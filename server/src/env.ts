import { z } from "zod";

const nonEmptyString = (name: string) => z.string().min(1, `${name} is required`);

const EnvSchema = z
  .object({
    GITHUB_CLIENT_ID: nonEmptyString("GITHUB_CLIENT_ID"),
    GITHUB_CLIENT_SECRET: nonEmptyString("GITHUB_CLIENT_SECRET"),

    OAUTH_REDIRECT_URI: z.url("OAUTH_REDIRECT_URI must be a valid URL"),

    CORS_ALLOWED_ORIGIN: z.url("CORS_ALLOWED_ORIGIN must be a valid URL"),

    PORT: z.coerce.number().int().positive().default(3000),

    LOG_LEVEL: z.string().optional(),

    RATE_LIMIT_MAX: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_WINDOW: z.string().optional(),

    GITHUB_OAUTH_BASE_URL: z.url().optional(),
    GITHUB_API_BASE_URL: z.url().optional(),
  })
  .loose();

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ");

    throw new Error(`Environment configuration error: ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function resetEnvForTests() {
  cachedEnv = null;
}
