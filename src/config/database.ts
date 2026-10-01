import { Sequelize } from "sequelize";
import path from "node:path";

export function criarConexao(storage = process.env.DB_STORAGE ?? path.resolve("produtos.sqlite")): Sequelize {
  return new Sequelize({ dialect: "sqlite", storage, logging: false });
}
