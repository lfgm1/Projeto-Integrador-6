import { criarApp } from "./app";
import { criarConexao } from "./config/database";

export async function iniciarServidor(porta = Number(process.env.PORT ?? 3000)) {
  const sequelize = criarConexao();
  const app = criarApp(sequelize);
  try {
    await sequelize.sync();
    const server = app.listen(porta, "127.0.0.1", () => {
      console.log(`Servidor disponível em http://localhost:${porta}`);
    });
    return { server, sequelize };
  } catch (error) {
    await sequelize.close();
    throw error;
  }
}

if (require.main === module) {
  iniciarServidor().catch((error: unknown) => {
    console.error("Erro ao iniciar o servidor:", error);
    process.exitCode = 1;
  });
}
