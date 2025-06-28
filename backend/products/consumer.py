import json
from channels.generic.websocket import AsyncWebsocketConsumer

from celery.result import AsyncResult


class ParseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, code):
        pass

    async def receive(self, text_data):
        if not text_data:
            await self.send(text_data=json.dumps({"error": "Пусто"}))
            return

        data = json.loads(text_data)
        query = data.get("query")
        min_price = data.get("min_price")
        max_price = data.get("max_price")
        min_rating = data.get("min_rating")

        if data.get("action") == "start":
            from .tasks import parse_wb_task

            task = parse_wb_task.delay(
                query,
                min_price=min_price,
                max_price=max_price,
                min_rating=min_rating,
                )

            await self.send(text_data=json.dumps({
                "status": "started",
                "data": data,
                "task_id": task.id
            }))

        elif data.get("action") == "check":
            task_id = data.get("task_id")

            if not task_id:
                await self.send(text_data=json.dumps({
                    "status": "error",
                    "message": "task_id not provided"
                }))
                return

            result = AsyncResult(task_id)
            response = {
                "status": result.status,
                "task_id": task_id
            }

            if result.ready():
                response["result"] = result.result

            await self.send(text_data=json.dumps(response))
