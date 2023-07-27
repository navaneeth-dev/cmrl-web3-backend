import { Queue, Worker } from "bullmq";
import connection from "../../config/bullMQConfig";

const QUEUE_NAME = "generateTicket";

export const ticketGenerationQueue = new Queue(QUEUE_NAME, {
  connection,
});

export const ticketGenerationWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(job.data);
  },
  { connection }
);
