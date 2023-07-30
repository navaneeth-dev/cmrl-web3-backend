import { Request, Response } from "express";
import ENV from "../schemas/env";
import ticketQueue from "../queues/ticketQueue";

// Called from webhook of bitcart
// Enqueue puppetter
const ticketController = async (req: Request, res: Response) => {
  // const invoiceId = req.params.id;
  req.log.info({ body: req.body }, "checkTicket");
  const invoiceId = req.body.id;

  // Verify invoice id via API
  const response = await fetch(`${ENV!.BITCART_URL}/api/invoices/${invoiceId}`);
  const invoice = await response.json();

  if (invoice.status !== "complete")
    return res.send({ message: "Invoice not paid, exitting..." });

  // If not blank return
  if (invoice.notes !== "")
    return res.send({ message: "Already generated ticket" });

  // Add to queue
  await ticketQueue.add(invoiceId, { invoiceId });
  return res.send({ message: "Queued ticket generation" });
};

export default ticketController;
