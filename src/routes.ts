import { Express } from "express";
import { health } from "./controllers/health";

export const routes = (app: Express) => {
  app.get("/api/health", health);
};
