import os
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from playwright.async_api import async_playwright


load_dotenv()
app = FastAPI()


async def process():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False)
    page = await browser.new_page()
    await page.goto("https://playwright.dev/")
    await page.wait_for_timeout(5000)
    await browser.close()
    await playwright.stop()


@app.post("/api/checkTicket")
async def root(background_tasks: BackgroundTasks):
    background_tasks.add_task(process)
    return {"message": "Hello World"}
