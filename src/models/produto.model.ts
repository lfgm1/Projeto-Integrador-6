import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ProdutoAtributos } from "../interfaces/produto.interface";

export function definirProduto(sequelize: Sequelize) {
  class Produto extends Model<ProdutoAtributos, Optional<ProdutoAtributos, "id">> implements ProdutoAtributos {
    declare id: number;
    declare nome: string;
    declare preco: number;

    estaEmPromocao(): boolean {
      return this.preco < 100;
    }
  }

  Produto.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true, len: [1, 120] } },
    preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0, max: 99999999.99 } },
  }, { sequelize, tableName: "produtos", timestamps: false });

  return Produto;
}

export type ProdutoModel = ReturnType<typeof definirProduto>;
