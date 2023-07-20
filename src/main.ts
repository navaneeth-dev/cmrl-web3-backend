import express from "express";
import { ConnectionOptions, Queue, Worker } from "bullmq";
import "dotenv/config";
import { envSchema } from "./models/env.schema";
import pinohttp, { Options } from "pino-http";

const app = express();

const main = async () => {
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    return;
  }

  const connection: ConnectionOptions = {
    host: env.data.REDISHOST,
    password: env.data.REDISPASSWORD,
    username: env.data.REDISUSER,
    port: env.data.REDISPORT,
  };

  const worker = new Worker(
    "foo",
    async (job) => {
      console.log("called");
      await new Promise((r) => setTimeout(r, 3000));
      console.log(job.data);
    },
    {
      connection,
    }
  );

  const myQueue = new Queue("foo", {
    connection,
  });

  app.get("/", async (req, res) => {
    await myQueue.add("myJobName", { foo: "bar" });
    return { hello: "world" };
  });

  const envToLogger = {
    development: {
      transport: {
        target: "pino-pretty",
      },
    },
  };
  const pino = pinohttp(envToLogger[env.data.NODE_ENV] ?? {});
  app.use(pino);
  app.listen(3000, () => pino.logger.info("Listening"));
};

main();
