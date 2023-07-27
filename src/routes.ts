import { Express } from "express";
import health from "./controllers/health";

const routes = (app: Express) => {
  app.get("/api/health", health);
};

export default routes;
