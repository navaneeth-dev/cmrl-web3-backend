import logging
import os
import base64
from playwright.async_api import async_playwright
import requests


CMRL_TICKET_URL = "https://tickets.chennaimetrorail.org/"


async def get_ticket(invoice_id: str, source_station_id: str, dest_station_id: str):
    # Generating status
    invoice_response = requests.patch(
        f"{os.getenv('BITCART_URL')}/api/invoices/{invoice_id}",
        json={"metadata": {"status": "generating"}},
        headers={"Authorization": f"Bearer {os.getenv('BITCART_API_TOKEN')}"},
    )
    logging.info(f"Updated to generating status.")

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=True if os.getenv("FLY_APP_NAME") is not None else False,
        args=["--disable-web-security"],
    )
    page = await browser.new_page(locale="en_US")
    await page.goto(CMRL_TICKET_URL)

    # Select stations
    src_locator = page.locator("#login > form > div:nth-child(1) > select")
    dest_locator = page.locator("#login > form > div:nth-child(2) > select")

    await src_locator.select_option(source_station_id)
    await dest_locator.select_option(dest_station_id)

    src_name = (await src_locator.inner_text()).strip()
    dest_name = (await src_locator.inner_text()).strip()

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
    nft_response = requests.post(
        "https://api.nft.storage/upload", data=data, headers=headers
    )

    # Update CID in notes
    invoice_response = requests.patch(
        f"{os.getenv('BITCART_URL')}/api/invoices/{invoice_id}",
        json={
            "metadata": {
                "status": "success",
                "cid": f"{nft_response.json()['value']['cid']}",
                "src_name": src_name,
                "dest_name": dest_name,
            }
        },
        headers={"Authorization": f"Bearer {os.getenv('BITCART_API_TOKEN')}"},
    )
    logging.info(f"Updated CID: {invoice_response.json()['id']}")

    await playwright.stop()
