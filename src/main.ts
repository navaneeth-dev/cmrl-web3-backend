import Fastify from "fastify";
import { ConnectionOptions, Queue, Worker } from "bullmq";
import "dotenv/config";
import { envSchema } from "./models/env.schema";

// To fix
const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
    },
  },
};
const fastify = Fastify({
  logger: envToLogger.development,
});

const main = async () => {
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    fastify.log.error(
      { errors: env.error.errors },
      "Environment variables not set."
    );
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

  fastify.get("/", async (req, res) => {
    await myQueue.add("myJobName", { foo: "bar" });
    return "Hello";
  });

  try {
    const server = await fastify.listen({ port: 3000 });
    fastify.log.info(server, "hello");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    await fastify.close();
    process.exit(0);
  });
});

main();
