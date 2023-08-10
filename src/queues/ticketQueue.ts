import { chromium } from "playwright";
import { NFTStorage } from "nft.storage";
import { Queue, Worker } from "bullmq";
import ENV from "../schemas/env";
import connection from "../../config/bullMqConfig";
import logger from "../utils/logger";

const nftStorage = new NFTStorage({ token: ENV!.NFT_STORAGE_TOKEN });

const QUEUE_NAME = "ticketQueue";
const ticketQueue = new Queue(QUEUE_NAME, { connection });
const ticketWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    logger.debug({ jobId: job.id }, "generateTicket called");

    try {
      const { invoiceId } = job.data;

      const initiatePaymentUrl = "https://tickets.chennaimetrorail.org/";
      const browser = await chromium.launch({
        headless: ENV?.NODE_ENV !== "development",
        args: ["--disable-web-security"],
      });

      const page = await browser.newPage({ locale: "en_US" });

      await page.goto(initiatePaymentUrl);

      await page.waitForTimeout(2000);

      const sourceStationId = "0213";
      const destStationId = "0215";

      await page
        .locator("#login > form > div:nth-child(1) > select")
        .selectOption(sourceStationId);
      await page
        .locator("#login > form > div:nth-child(2) > select")
        .selectOption(destStationId);

      // Mobile No
      await page
        .locator("#login > form > div:nth-child(3) > input")
        .fill("1111111111");

      // Submit
      await page.locator("#login > form > div:nth-child(6) > button").click();

      // Ok modal
      await page.getByRole("button", { name: "Ok" }).click();
      logger.debug("Modal done");

      // Select UPI, type cast here as open issue in GitHub
      await page
        .locator(
          "#payment-option-list > bd-section:nth-child(3) bd-pay-option > div > div"
        )
        .click();

      // Enter UPI ID
      await page
        .getByLabel("Virtual Payment Address (VPA)")
        .type(ENV?.UPI_VPA ?? "404@404");

      await page.getByRole("button", { name: "Make Payment for" }).click();
      logger.debug("Waiting for payment");

      // Wait 5mins for payment
      // Get ticket image
      const imgBase64Element = page.locator("img.w-200");
      const imgBase64 = await imgBase64Element.getAttribute("src", {
        timeout: 60_000,
      });
      if (!imgBase64) {
        logger.error("Cannot find imgBase64");
        return;
      }

      logger.debug(page.url());
      await browser.close();

      logger.debug(imgBase64.substring(0, 200));

      // // Convert b64 str to Blob for uploading img
      // // Dont convert so 22: data:image/png;base64,
      // const byteCharacters = atob(imgBase64.substring(22));
      // const byteNumbers = new Array(byteCharacters.length);
      // for (let i = 0; i < byteCharacters.length; i += 1) {
      //   byteNumbers[i] = byteCharacters.charCodeAt(i);
      // }
      // const byteArray = new Uint8Array(byteNumbers);

      // // Upload img
      // logger.debug("Uploading img");
      // const blob = new Blob([byteArray], { type: "image/png" });
      // const cid = await nftStorage.storeBlob(blob);
      // logger.debug({ cid }, "CID");

      // // Update CID in Notes
      // const updateInvoice = await fetch(
      //   `${ENV?.BITCART_URL}/api/invoices/${invoiceId}/customer`,
      //   {
      //     method: "PATCH",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ notes: cid }),
      //   }
      // );
      // const json = await updateInvoice.json();
      // logger.info({ invoiceId: json.id }, "Updated Invoice");
    } catch (err) {
      logger.error(err);
    }
  },
  { connection }
);

ticketWorker.on("completed", (job) => {
  logger.info(`${job.id} has completed!`);
});
ticketWorker.on("failed", (job, err) => {
  logger.error(`${job?.id ?? "Job"} has failed with ${err.message}`);
});
process.on("SIGINT", async () => {
  await ticketWorker.close();
});

export default ticketQueue;
