import { Express } from "express";
import healthController from "./controllers/healthController";
import ticketController from "./controllers/checkTicket";
import generateTicketController from "./controllers/generateTicketController";

const routes = (app: Express) => {
  app.get("/api/health", healthController);
  app.post("/api/checkTicket", ticketController);
  app.post("/api/generateTicket", generateTicketController);
};

export default routes;
