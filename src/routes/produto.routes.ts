import { Router } from "express";
import { ProdutoController } from "../controllers/produto.controller";
import { IProdutoService } from "../interfaces/produto-service.interface";

export function criarProdutoRoutes(service: IProdutoService): Router {
  const router = Router();
  const controller = new ProdutoController(service);
  router.get("/", controller.listar);
  router.get("/:id", controller.buscarPorId);
  router.post("/", controller.criar);
  router.put("/:id", controller.atualizar);
  router.delete("/:id", controller.excluir);
  return router;
}
