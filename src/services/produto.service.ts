import { DadosProduto } from "../interfaces/produto.interface";
import { ProdutoModel } from "../models/produto.model";
import { ErroHttp } from "../errors/erro-http";
import { IProdutoService } from "../interfaces/produto-service.interface";

function validarDados(dados: unknown): DadosProduto {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    throw new ErroHttp(400, "Informe o nome e o preço do produto.");
  }
  const { nome, preco } = dados as Record<string, unknown>;
  if (typeof nome !== "string" || nome.trim().length === 0 || nome.trim().length > 120) {
    throw new ErroHttp(400, "O nome deve ter entre 1 e 120 caracteres.");
  }
  if (typeof preco !== "number" || !Number.isFinite(preco) || preco < 0 || preco > 99999999.99) {
    throw new ErroHttp(400, "O preço deve ser um número entre 0 e 99.999.999,99.");
  }
  if (Math.abs(preco * 100 - Math.round(preco * 100)) > 0.000001) {
    throw new ErroHttp(400, "O preço deve ter no máximo duas casas decimais.");
  }
  return { nome: nome.trim(), preco };
}

function validarId(valor: string): number {
  const id = Number(valor);
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(id) || id <= 0) {
    throw new ErroHttp(400, "O código do produto deve ser um inteiro positivo.");
  }
  return id;
}

export class ProdutoService implements IProdutoService {
  constructor(private readonly Produto: ProdutoModel) {}

  async listar() {
    return this.Produto.findAll({ order: [["id", "ASC"]] });
  }

  async buscarPorId(valor: string) {
    const produto = await this.Produto.findByPk(validarId(valor));
    if (!produto) throw new ErroHttp(404, "Produto não encontrado.");
    return produto;
  }

  async criar(dados: unknown) {
    return this.Produto.create(validarDados(dados));
  }

  async atualizar(id: string, dados: unknown) {
    const produto = await this.buscarPorId(id);
    return produto.update(validarDados(dados));
  }

  async excluir(id: string): Promise<void> {
    const produto = await this.buscarPorId(id);
    await produto.destroy();
  }
}
