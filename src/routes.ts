import { Express } from "express";
import healthController from "./controllers/healthController";
import tickerController from "./controllers/ticketController";

const routes = (app: Express) => {
  app.get("/api/health", healthController);
  app.post("/api/generateTicket", tickerController);
};

export default routes;
