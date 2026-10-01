import request from "supertest";
import { criarApp } from "../src/app";
import { criarConexao } from "../src/config/database";
import { ProdutoService } from "../src/services/produto.service";
import { ProdutoModel } from "../src/models/produto.model";

const sequelize = criarConexao(":memory:");
const app = criarApp(sequelize);
const Produto = sequelize.models.Produto as ProdutoModel;
const service = new ProdutoService(Produto);

beforeAll(async () => { await sequelize.sync({ force: true }); });
beforeEach(async () => { await Produto.destroy({ where: {} }); });
afterAll(async () => { await sequelize.close(); });

describe("CRUD de produtos", () => {
  it("lista um banco vazio", async () => {
    const resposta = await request(app).get("/produtos");
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it("cadastra, consulta, atualiza e exclui um produto", async () => {
    const criacao = await request(app).post("/produtos").send({ nome: "  Teclado  ", preco: 89.9, id: 999 });
    expect(criacao.status).toBe(201);
    const id = criacao.body.id;
    expect(criacao.body).toEqual({ id, nome: "Teclado", preco: 89.9 });
    expect(id).not.toBe(999);
    expect(criacao.headers.location).toBe(`/produtos/${id}`);
    expect((await Produto.findByPk(id))?.nome).toBe("Teclado");

    const consulta = await request(app).get(`/produtos/${id}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body).toEqual(criacao.body);
    expect((await request(app).get("/produtos")).body).toEqual([criacao.body]);

    const atualizacao = await request(app).put(`/produtos/${id}`).send({ nome: "Teclado mecânico", preco: 199.99 });
    expect(atualizacao.status).toBe(200);
    expect(atualizacao.body).toEqual({ id, nome: "Teclado mecânico", preco: 199.99 });
    expect((await request(app).get(`/produtos/${id}`)).body).toEqual(atualizacao.body);

    const exclusao = await request(app).delete(`/produtos/${id}`);
    expect(exclusao.status).toBe(204);
    expect(exclusao.text).toBe("");
    expect(await Produto.findByPk(id)).toBeNull();
    expect((await request(app).get(`/produtos/${id}`)).status).toBe(404);
  });

  it("lista por código e não reutiliza o código de um produto excluído", async () => {
    const primeiro = await service.criar({ nome: "Mouse", preco: 30 });
    const segundo = await service.criar({ nome: "Monitor", preco: 500 });
    expect((await request(app).get("/produtos")).body.map((item: { id: number }) => item.id)).toEqual([primeiro.id, segundo.id]);
    await service.excluir(String(segundo.id));
    const terceiro = await service.criar({ nome: "Cabo", preco: 15 });
    expect(terceiro.id).toBeGreaterThan(segundo.id);
  });

  it.each([0, 0.29, 100, 99999999.99])("aceita o preço %s", async (preco) => {
    const resposta = await request(app).post("/produtos").send({ nome: "Produto", preco });
    expect(resposta.status).toBe(201);
    expect(resposta.body.preco).toBe(preco);
  });

  it("aceita nomes com 120 caracteres", async () => {
    const resposta = await request(app).post("/produtos").send({ nome: "a".repeat(120), preco: 1 });
    expect(resposta.status).toBe(201);
  });

  it.each([
    {}, { preco: 1 }, { nome: "Produto" }, { nome: "", preco: 1 },
    { nome: "  ", preco: 1 }, { nome: 42, preco: 1 },
    { nome: "a".repeat(121), preco: 1 }, { nome: "Produto", preco: -1 },
    { nome: "Produto", preco: "10" }, { nome: "Produto", preco: null },
    { nome: "Produto", preco: true }, { nome: "Produto", preco: 100000000 },
    { nome: "Produto", preco: 10.123 }, [],
  ])("rejeita cadastro inválido: %j", async (dados) => {
    const resposta = await request(app).post("/produtos").send(dados);
    expect(resposta.status).toBe(400);
    expect(resposta.body.mensagem).toEqual(expect.any(String));
    expect(await Produto.count()).toBe(0);
  });

  it("rejeita uma requisição sem corpo", async () => {
    expect((await request(app).post("/produtos")).status).toBe(400);
  });

  it.each([null, undefined, true, "produto", 1])("valida entradas não estruturadas no serviço: %s", async (dados) => {
    await expect(service.criar(dados)).rejects.toMatchObject({ status: 400 });
  });

  it.each([NaN, Infinity, -Infinity])("rejeita preço não finito: %s", async (preco) => {
    await expect(service.criar({ nome: "Produto", preco })).rejects.toMatchObject({ status: 400 });
  });

  it.each(["abc", "0", "-1", "1.5", "9007199254740992", "1e2"])("rejeita o código inválido %s em todas as operações", async (id) => {
    expect((await request(app).get(`/produtos/${id}`)).status).toBe(400);
    expect((await request(app).put(`/produtos/${id}`).send({ nome: "Mouse", preco: 10 })).status).toBe(400);
    expect((await request(app).delete(`/produtos/${id}`)).status).toBe(400);
  });

  it("retorna 404 ao consultar, editar ou excluir um produto inexistente", async () => {
    const consulta = await request(app).get("/produtos/99999");
    expect(consulta.status).toBe(404);
    expect(consulta.body).toEqual({ mensagem: "Produto não encontrado." });
    expect((await request(app).put("/produtos/99999").send({ nome: "Mouse", preco: 10 })).status).toBe(404);
    expect((await request(app).delete("/produtos/99999")).status).toBe(404);
  });

  it("preserva os dados quando a atualização é inválida", async () => {
    const produto = await service.criar({ nome: "Mouse", preco: 10 });
    const resposta = await request(app).put(`/produtos/${produto.id}`).send({ nome: "Mouse alterado", preco: -5 });
    expect(resposta.status).toBe(400);
    expect((await request(app).get(`/produtos/${produto.id}`)).body).toEqual({ id: produto.id, nome: "Mouse", preco: 10 });
  });

  it("mantém a regra de promoção para preços abaixo de 100", async () => {
    expect((await service.criar({ nome: "Mouse", preco: 99.99 })).estaEmPromocao()).toBe(true);
    expect((await service.criar({ nome: "Teclado", preco: 100 })).estaEmPromocao()).toBe(false);
  });
});

describe("Tratamento de erros", () => {
  it("retorna 400 para JSON malformado", async () => {
    const resposta = await request(app).post("/produtos").set("Content-Type", "application/json").send('{"nome":');
    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ mensagem: "O JSON enviado é inválido." });
  });

  it("limita o tamanho do corpo da requisição", async () => {
    const resposta = await request(app).post("/produtos").send({ nome: "a".repeat(17000), preco: 1 });
    expect(resposta.status).toBe(413);
  });

  it("retorna JSON e status 404 para rotas inexistentes", async () => {
    const resposta = await request(app).get("/inexistente");
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ mensagem: "Página ou rota não encontrada." });
  });

  it("retorna 500 sem expor detalhes internos do banco", async () => {
    jest.spyOn(Produto, "findAll").mockRejectedValueOnce(new Error("erro privado do banco"));
    const resposta = await request(app).get("/produtos");
    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ mensagem: "Não foi possível concluir a operação. Tente novamente." });
    expect(resposta.text).not.toContain("erro privado");
  });

  it("trata também falhas inesperadas que não são instâncias de Error", async () => {
    jest.spyOn(Produto, "findAll").mockRejectedValueOnce("falha");
    expect((await request(app).get("/produtos")).status).toBe(500);
  });
});
