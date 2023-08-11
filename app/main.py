import time
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()


def process():
    print("Called")
    time.sleep(10)
    print("Ended")


@app.post("/api/checkTicket")
async def root(background_tasks: BackgroundTasks):
    background_tasks.add_task(process)
    return {"message": "Hello World"}
