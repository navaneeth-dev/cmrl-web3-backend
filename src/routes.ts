import { Express } from "express";
import healthController from "./controllers/healthController";
import ticketController from "./controllers/ticketController";

const routes = (app: Express) => {
  app.get("/api/health", healthController);
  app.post("/api/generateTicket/:id", ticketController);
};

export default routes;
