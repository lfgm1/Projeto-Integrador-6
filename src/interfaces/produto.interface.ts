export interface DadosProduto {
  nome: string;
  preco: number;
}

export interface ProdutoAtributos extends DadosProduto {
  id: number;
}
