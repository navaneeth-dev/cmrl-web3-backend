import { z } from "zod";

export const envSchema = z.object({
  REDISHOST: z.string(),
  REDISUSER: z.string(),
  REDISPASSWORD: z.string(),
  REDISPORT: z.preprocess(
    (port) => parseInt(z.string().parse(port), 10),
    z.number().positive().max(65535)
  ),
  NODE_ENV: z.enum(["development"]).default("development"),
});
