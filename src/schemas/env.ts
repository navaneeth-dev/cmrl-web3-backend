import { ZodError, z } from "zod";
import logger from "../utils/logger";
import "dotenv/config";

const envSchema = z.object({
  QSTASH_TOKEN: z.string(),
  NODE_ENV: z.enum(["development"]).default("development"),
  BITCART_URL: z.string().url(),
});

type EnvSchema = z.infer<typeof envSchema>;

const parseEnv = (): EnvSchema | null => {
  try {
    const parsedEnv = envSchema.parse(process.env);
    return parsedEnv;
  } catch (err) {
    if (err instanceof ZodError) {
      logger.error({ errors: err.errors }, "Invalid environment variables.");
    } else {
      logger.error(err);
    }

    process.exit(0);
    return null;
  }
};

const ENV = parseEnv();
export default ENV;