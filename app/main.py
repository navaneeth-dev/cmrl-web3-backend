import os
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel
from app.get_ticket import get_ticket
import logging


logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
load_dotenv()
app = FastAPI()


class Ticket(BaseModel):
    id: str


@app.post("/api/checkTicket")
async def checkTicket(ticket: Ticket, background_tasks: BackgroundTasks):
    logging.info(f"hi {ticket.id}")
    background_tasks.add_task(get_ticket)
    return {"message": "Scheduled to get ticket"}
