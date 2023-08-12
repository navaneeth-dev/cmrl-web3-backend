import logging
import os
import base64
from playwright.async_api import async_playwright
import requests


CMRL_TICKET_URL = "https://tickets.chennaimetrorail.org/"


async def get_ticket(invoice_id: str):
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=False, args=["--disable-web-security"]
    )
    page = await browser.new_page(locale="en_US")
    await page.goto(CMRL_TICKET_URL)

    source_station_id = "0213"
    dest_station_id = "0215"

    # Select stations
    await page.locator("#login > form > div:nth-child(1) > select").select_option(
        source_station_id
    )
    await page.locator("#login > form > div:nth-child(2) > select").select_option(
        dest_station_id
    )

    # Mobile No
    await page.locator("#login > form > div:nth-child(3) > input").fill("1111111111")

    # Submit
    await page.locator("#login > form > div:nth-child(6) > button").click()

    # Ok modal
    await page.get_by_role("button", name="Ok").click()

    # Select UPI
    await page.locator(
        "#payment-option-list > bd-section:nth-child(3) bd-pay-option > div > div"
    ).click()

    # Enter UPI ID
    await page.get_by_label("Virtual Payment Address (VPA)").type(os.getenv("UPI_VPA"))

    await page.get_by_role("button", name="Make Payment for").click()
    logging.info("Waiting for payment.")

    # Wait 5mins for payment
    # Get ticket image
    img_b64_element = page.locator("img.w-200")
    img_b64 = await img_b64_element.get_attribute("src", timeout=60_000)
    if img_b64 is None:
        logging.error("Cannot find imgBase64")
        return

    logging.debug(page.url)
    await browser.close()

    logging.debug(img_b64[:200])

    # Upload img
    data = base64.b64decode(img_b64[22:])
    headers = {
        "Content-Type": "image/png",
        "Authorization": f"Bearer {os.getenv('NFT_STORAGE_TOKEN')}",
    }
    r = requests.post("https://api.nft.storage/upload", data=data, headers=headers)
    logging.debug(r.json())

    # Update CID in notes
    r = requests.patch(
        f"{os.getenv('BITCART_URL')}/api/invoices/{invoice_id}/customer",
        json={"notes": r["cid"]},
    )

    logging.info(f"Updated CID: {r.json()['id']}")

    await playwright.stop()
