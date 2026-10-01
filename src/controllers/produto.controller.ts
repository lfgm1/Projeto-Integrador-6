import { Request, Response } from "express";
import { IProdutoService } from "../interfaces/produto-service.interface";

export class ProdutoController {
  constructor(private readonly service: IProdutoService) {}

  listar = async (_req: Request, res: Response) => {
    res.json(await this.service.listar());
  };

  buscarPorId = async (req: Request<{ id: string }>, res: Response) => {
    res.json(await this.service.buscarPorId(req.params.id));
  };

  criar = async (req: Request, res: Response) => {
    const produto = await this.service.criar(req.body);
    res.location(`/produtos/${produto.id}`).status(201).json(produto);
  };

  atualizar = async (req: Request<{ id: string }>, res: Response) => {
    res.json(await this.service.atualizar(req.params.id, req.body));
  };

  excluir = async (req: Request<{ id: string }>, res: Response) => {
    await this.service.excluir(req.params.id);
    res.status(204).send();
  };
}
