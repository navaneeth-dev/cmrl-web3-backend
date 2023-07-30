import puppeteer, { ElementHandle } from "puppeteer";
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
    logger.debug("generateTicket called");

    try {
      const { invoiceId } = job.data;

      const initiatePaymentUrl = "https://tickets.chennaimetrorail.org/";
      const browser = await puppeteer.launch({
        headless: "new",
        executablePath: ENV?.FLY_REGION ? "/usr/bin/google-chrome" : undefined,
        devtools: true,
        args: ["--no-sandbox"],
      });

      const page = await browser.newPage();

      await page.goto(initiatePaymentUrl);

      const sourceStationId = "0213";
      const destStationId = "0215";

      await page.select(
        "#login > form > div:nth-child(1) > select",
        sourceStationId
      );
      await page.select(
        "#login > form > div:nth-child(2) > select",
        destStationId
      );

      // Mobile No
      await page.type("#login > form > div:nth-child(3) > input", "1111111111");

      // Submit
      await page.click("#login > form > div:nth-child(6) > button");

      // Ok modal
      await page.waitForSelector(
        "body > ngb-modal-window > div > div > div.modal-footer > button"
      );
      await page.click(
        "body > ngb-modal-window > div > div > div.modal-footer > button"
      );
      logger.debug("done");

      await page.waitForSelector("body > bd-modal");

      // Select UPI, type cast here as open issue in GitHub
      await page.waitForFunction(
        'document.querySelector("body > bd-modal").shadowRoot.querySelector("#pay-option-item_wrapper > div > bd-pay-option > div > div")'
      );

      const upiDiv = (await (
        await page.evaluateHandle(
          'document.querySelector("body > bd-modal").shadowRoot.querySelector("bd-section:nth-child(3) #pay-option-item_wrapper > div > bd-pay-option > div > div")'
        )
      ).asElement()) as ElementHandle<Element>;
      await upiDiv?.click();

      // Wait for UPI VPA input
      await page.waitForFunction(
        'document.querySelector("body > bd-modal").shadowRoot.querySelector("#upi_vpa")'
      );

      const upiVpa = (await (
        await page.evaluateHandle(
          `document.querySelector("body > bd-modal").shadowRoot.querySelector("#upi_vpa")`
        )
      ).asElement()) as ElementHandle<Element>;
      await upiVpa.type(ENV?.UPI_VPA!);

      const payBtn = (await (
        await page.evaluateHandle(
          `document.querySelector("body > bd-modal").shadowRoot.querySelector("#undefined_wrapper > div > bd-button > div > center > button")`
        )
      ).asElement()) as ElementHandle<Element>;
      payBtn.click();

      logger.debug("Waiting for payment");
      // Wait 5mins for payment
      // await new Promise((r) => setTimeout(r, 60 * 1000));
      await page.waitForNavigation({ timeout: 60 * 1000 });
      await page.waitForNetworkIdle({ timeout: 60 * 1000 });

      // Get ticket image
      const imgBase64 = (await page.evaluate(
        `document.querySelector("div > div.col-md-5.col-sm-5.col-5 > div:nth-child(1) > img").getAttribute('src')`
      )) as string;

      logger.debug(await page.url());

      await browser.close();

      logger.debug(imgBase64.substring(0, 200));

      // Convert b64 str to Blob for uploading img
      // Dont convert so 22: data:image/png;base64,
      const byteCharacters = atob(imgBase64.substring(22));
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload img
      logger.debug("Uploading img");
      const blob = new Blob([byteArray], { type: "image/png" });
      const cid = await nftStorage.storeBlob(blob);
      logger.debug({ cid }, "CID");

      // Update CID in Notes
      const updateInvoice = await fetch(
        `${ENV?.BITCART_URL}/api/invoices/${invoiceId}/customer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: cid }),
        }
      );
      const json = await updateInvoice.json();
      logger.info({ invoiceId: json.id }, "Updated Invoice");
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

export default ticketQueue;
