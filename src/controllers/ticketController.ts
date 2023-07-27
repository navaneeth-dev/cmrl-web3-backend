import { Request, Response } from "express";
import ENV from "../schemas/env";
import client from "../../config/qstashConfig";

// Called from webhook of bitcart
// Enqueue puppetter
const tickerController = async (req: Request, res: Response) => {
  const invoiceId = req.params.id;

  // Verify invoice id via API
  const response = await fetch(`${ENV!.BITCART_URL}/api/invoices/${invoiceId}`);
  const invoice = await response.json();

  if (invoice.status !== "complete")
    return res.send({ message: "Invoice not paid, exitting..." });

  // If not blank return
  if (invoice.notes !== "")
    return res.send({ message: "Already generated ticket" });

  // Add to queue
  client.publishJSON({ url: "https://example.com", body: { invoiceId } });
  return res.send({ message: "Queued ticket generation" });
};

export default tickerController;
