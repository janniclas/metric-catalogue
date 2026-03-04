import { buildServer } from "./server";
import { loadEnv } from "./env";

async function start() {
  const env = loadEnv();
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    server.log.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

void start();
