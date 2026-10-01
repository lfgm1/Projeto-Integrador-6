import express, { ErrorRequestHandler } from "express";
import { Sequelize } from "sequelize";
import { definirProduto } from "./models/produto.model";
import { ProdutoService } from "./services/produto.service";
import { criarProdutoRoutes } from "./routes/produto.routes";
import { ErroHttp } from "./errors/erro-http";

export function criarApp(sequelize: Sequelize) {
  const Produto = definirProduto(sequelize);
  const service = new ProdutoService(Produto);
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use("/produtos", criarProdutoRoutes(service));
  app.use((_req, _res, next) => next(new ErroHttp(404, "Página ou rota não encontrada.")));

  const tratarErro: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    let status = 500;
    let mensagem = "Não foi possível concluir a operação. Tente novamente.";
    if (error instanceof ErroHttp) {
      status = error.status;
      mensagem = error.message;
    } else if (error instanceof SyntaxError && "body" in error) {
      status = 400;
      mensagem = "O JSON enviado é inválido.";
    } else if (error instanceof Error && "type" in error && error.type === "entity.too.large") {
      status = 413;
      mensagem = "Os dados enviados excedem o tamanho permitido.";
    }
    res.status(status).json({ mensagem });
  };
  app.use(tratarErro);
  return app;
}
