import { Request, Response } from "express";
import puppeteer, { ElementHandle } from "puppeteer";
import { NFTStorage } from "nft.storage";
import { receiver } from "../../config/qstashConfig";
import ENV from "../schemas/env";

const nftStorage = new NFTStorage({ token: ENV!.NFT_STORAGE_TOKEN });

const generateTicketController = async (req: Request, res: Response) => {
  req.log.debug("generateTicket called");

  // Verify from QStash
  const { body } = req;

  try {
    await receiver.verify({
      signature: req.get("Upstash-Signature") ?? "",
      body: JSON.stringify(body),
      clockTolerance: 30,
    });

    const { invoiceId } = body;

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
    req.log.debug("done");

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

    req.log.debug("Waiting for payment");
    // Wait 5mins for payment
    // await new Promise((r) => setTimeout(r, 60 * 1000));
    await page.waitForNavigation({ timeout: 60 * 1000 });
    await page.waitForNetworkIdle({ timeout: 60 * 1000 });

    // Get ticket image
    const imgBase64 = (await page.evaluate(
      `document.querySelector("div > div.col-md-5.col-sm-5.col-5 > div:nth-child(1) > img").getAttribute('src')`
    )) as string;

    req.log.debug(await page.url());

    await browser.close();

    req.log.debug(imgBase64.substring(0, 200));

    // Convert b64 str to Blob for uploading img
    // Dont convert so 22: data:image/png;base64,
    const byteCharacters = atob(imgBase64.substring(22));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload img
    req.log.debug("Uploading img");
    const blob = new Blob([byteArray], { type: "image/png" });
    const cid = await nftStorage.storeBlob(blob);
    req.log.debug("CID", cid);

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
    req.log.info("Updated CID", json.id);

    return res.send({ message: "Successfully got ticket", imgBase64 });
  } catch (err) {
    req.log.error(err);
    return res.status(403).send({ message: "Not from QStash" });
  }
};

export default generateTicketController;
