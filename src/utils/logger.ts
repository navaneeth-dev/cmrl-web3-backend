import pino from "pino";

const logger = pino(
  process.env.NODE_ENV !== "production"
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: { ignore: "pid,hostname,req,res" },
        },
      }
    : {}
);
export default logger;
