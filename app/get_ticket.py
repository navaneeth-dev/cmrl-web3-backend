from playwright.async_api import async_playwright


async def get_ticket():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False)
    page = await browser.new_page()
    await page.goto("https://playwright.dev/")
    await browser.close()
    await playwright.stop()
