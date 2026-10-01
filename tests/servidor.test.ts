import { once } from "node:events";
import { AddressInfo } from "node:net";
import { Sequelize } from "sequelize";
import { iniciarServidor } from "../src/index";

const ambiente = { DB_STORAGE: process.env.DB_STORAGE, PORT: process.env.PORT };
beforeEach(() => {
  process.env.DB_STORAGE = ":memory:";
  process.env.PORT = "0";
});
afterEach(() => {
  for (const [chave, valor] of Object.entries(ambiente)) {
    if (valor === undefined) delete process.env[chave];
    else process.env[chave] = valor;
  }
});

it("inicializa as tabelas e atende uma requisição HTTP", async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  const { server, sequelize } = await iniciarServidor();
  try {
    if (!server.listening) await once(server, "listening");
    const porta = (server.address() as AddressInfo).port;
    const resposta = await fetch(`http://127.0.0.1:${porta}/produtos`);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual([]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});

it("fecha a conexão e informa a falha ao não conseguir iniciar o banco", async () => {
  jest.spyOn(Sequelize.prototype, "sync").mockRejectedValueOnce(new Error("Banco indisponível"));
  const fechar = jest.spyOn(Sequelize.prototype, "close");
  await expect(iniciarServidor(0)).rejects.toThrow("Banco indisponível");
  expect(fechar).toHaveBeenCalledTimes(1);
});
