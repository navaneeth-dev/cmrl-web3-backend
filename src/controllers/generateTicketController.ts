import { Request, Response } from "express";
import { receiver } from "../../config/qstashConfig";

const generateTicketController = async (req: Request, res: Response) => {
  // Verify from QStash
  const { body } = req;

  try {
    await receiver.verify({
      signature: req.get("Upstash-Signature") ?? "",
      body,
    });

    req.log.info(req.body);

    return res.send({ message: "Successfully got ticket" });
  } catch (err) {
    req.log.error(err);
    return res.status(403).send({ message: "Not from QStash" });
  }
};

export default generateTicketController;
