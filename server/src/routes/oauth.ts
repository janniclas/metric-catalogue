import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { exchangeCode, fetchUsername, GitHubExchangeError } from "../github";
import { loadEnv } from "../env";

const ExchangeSchema = z
  .object({
    code: z.string().min(1),
    code_verifier: z.string().min(1),
    state: z.string().min(1),
  })
  .strict();

export async function registerOAuthRoutes(server: FastifyInstance) {
  const env = loadEnv();

  server.post(
    "/oauth/github/exchange",
    {
      config: {
        rateLimit: {
          max: env.RATE_LIMIT_MAX ?? 5,
          timeWindow: env.RATE_LIMIT_WINDOW ?? "1 minute",
        },
      },
    },
    async (request, reply) => {
      const parsed = ExchangeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request payload." });
      }

      const { code, code_verifier, state } = parsed.data;

      // 🔐 TODO: verify state against server-side store
      const isValidState = true; // implement
      if (!isValidState) {
        return reply.status(401).send({ error: "Invalid OAuth state." });
      }

      try {
        const accessToken = await exchangeCode({
          code,
          codeVerifier: code_verifier,
          redirectUri: env.OAUTH_REDIRECT_URI,
        });

        const username = await fetchUsername(accessToken);

        // 🔐 TODO: store token server-side (session token, use @fastify/secure-session)
        // e.g. request.session.githubToken = accessToken;

        return reply.send({ username });
      } catch (err) {
        if (err instanceof GitHubExchangeError) {
          if (err.status === 401 || err.status === 400) {
            return reply.status(401).send({ error: "Invalid OAuth code." });
          }
          if (err.status === 429 || err.status === 403) {
            return reply.status(429).send({ error: "GitHub rate limit exceeded." });
          }
          return reply.status(500).send({ error: "OAuth exchange failed." });
        }

        request.log.error({ err }, "OAuth exchange failed");
        return reply.status(500).send({ error: "Unexpected error." });
      }
    },
  );
}
