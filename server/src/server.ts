import fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./env";
import { registerOAuthRoutes } from "./routes/oauth";

export async function buildServer() {
  const env = loadEnv();
  const server = fastify({
    logger: {
      level: env.LOG_LEVEL ?? "info",
    },
  });

  await server.register(helmet);
  await server.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (origin === env.CORS_ALLOWED_ORIGIN) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"), false);
    },
  });

  await server.register(rateLimit, {
    global: false,
  });

  server.get("/healthz", async () => ({ status: "ok" }));

  await registerOAuthRoutes(server);

  return server;
}
