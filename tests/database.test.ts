import request from "supertest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { criarConexao } from "../src/config/database";
import { criarApp } from "../src/app";

it("mantém o produto gravado depois de fechar e reabrir o banco", async () => {
  const pasta = await mkdtemp(path.join(os.tmpdir(), "produtos-teste-"));
  const arquivo = path.join(pasta, "teste.sqlite");
  const primeira = criarConexao(arquivo);
  const segunda = criarConexao(arquivo);
  let primeiraFechada = false;
  try {
    const app = criarApp(primeira);
    await primeira.sync();
    const criacao = await request(app).post("/produtos").send({ nome: "SSD", preco: 250 });
    expect(criacao.status).toBe(201);
    await primeira.close();
    primeiraFechada = true;

    const outroApp = criarApp(segunda);
    await segunda.authenticate();
    const consulta = await request(outroApp).get(`/produtos/${criacao.body.id}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body).toEqual(criacao.body);
  } finally {
    if (!primeiraFechada) await primeira.close();
    await segunda.close();
    await rm(pasta, { recursive: true, force: true });
  }
});

it("usa o arquivo local quando DB_STORAGE não é informado", async () => {
  const anterior = process.env.DB_STORAGE;
  delete process.env.DB_STORAGE;
  const conexao = criarConexao();
  try {
    expect(conexao.getDialect()).toBe("sqlite");
    expect(conexao).toMatchObject({ options: { storage: path.resolve("produtos.sqlite") } });
  } finally {
    await conexao.close();
    if (anterior === undefined) delete process.env.DB_STORAGE;
    else process.env.DB_STORAGE = anterior;
  }
});
