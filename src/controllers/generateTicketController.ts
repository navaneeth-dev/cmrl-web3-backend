import { Request, Response } from "express";
import { receiver } from "../../config/qstashConfig";

const generateTicketController = async (_req: Request, res: Response) => {
  // Verify from QStash
  const isValid = await receiver.verify({
    signature: request.headers.get("Upstash-Signature") ?? "",
    body,
  });
};

export default generateTicketController;
