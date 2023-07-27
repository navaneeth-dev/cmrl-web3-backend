import { Request, Response } from "express";
import { receiver } from "../../config/qstashConfig";

const generateTicketController = async (req: Request, res: Response) => {
  // Verify from QStash
  const { body } = req;
  const isValid = await receiver.verify({
    signature: req.get("Upstash-Signature") ?? "",
    body,
  });

  if (!isValid) {
    return res.send({ message: "Not from QStash" });
  }

  return res.send({ message: "Successfully got ticket" });
};

export default generateTicketController;
