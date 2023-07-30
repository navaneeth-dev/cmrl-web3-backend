import { Express } from "express";
import healthController from "./controllers/healthController";
import ticketController from "./controllers/checkTicket";

const routes = (app: Express) => {
  app.get("/api/health", healthController);
  app.post("/api/checkTicket", ticketController);
};

export default routes;
