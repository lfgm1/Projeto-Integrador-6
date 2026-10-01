import { ProdutoAtributos } from "./produto.interface";

export interface IProdutoService {
  listar(): Promise<ProdutoAtributos[]>;
  buscarPorId(id: string): Promise<ProdutoAtributos>;
  criar(dados: unknown): Promise<ProdutoAtributos>;
  atualizar(id: string, dados: unknown): Promise<ProdutoAtributos>;
  excluir(id: string): Promise<void>;
}
