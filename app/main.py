import os
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel
from app.get_ticket import get_ticket
import logging
import requests


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
    logging.info(f"Checking Ticket {ticket.id}.")
    r = requests.get(f"{os.getenv('BITCART_URL')}/api/invoices/{ticket.id}")
    invoice = r.json()
    if invoice["status"] != "complete":
        return {"message": "Invoice not paid."}

    metadata = invoice["metadata"]

    # Check if already generated
    if metadata.get("status") == "success":
        return {"message": "Ticket already generated."}

    # Check for generating status
    if metadata.get("status") == "generating":
        return {"message": "Ticketing is generating"}

    # Queue get_ticket
    src_station_id = metadata.get("src_id")
    dest_station_id = metadata.get("dest_id")
    background_tasks.add_task(get_ticket, ticket.id, src_station_id, dest_station_id)
    return {"message": "Scheduled to get ticket."}
