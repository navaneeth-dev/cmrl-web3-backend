import express from "express";
import { pinoHttp } from "pino-http";
import logger from "./utils/logger";
import routes from "./routes";

const app = express();

// Middlewares
app.use(pinoHttp({ logger }));

// IIFI
(async () => {
  routes(app);

  app.listen(3000, () => logger.info("Listening on 3000"));
})();
