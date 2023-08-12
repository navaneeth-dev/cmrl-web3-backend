import os
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from app import get_ticket


load_dotenv()
app = FastAPI()


@app.post("/api/checkTicket")
async def root(background_tasks: BackgroundTasks):
    background_tasks.add_task(get_ticket)
    return {"message": "Hello World"}
