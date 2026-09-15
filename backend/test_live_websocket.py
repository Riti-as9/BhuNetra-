import asyncio
import json
import websockets

async def test():
    async with websockets.connect("ws://127.0.0.1:8000/ws/monitoring") as ws:
        print("WEBSOCKET CONNECTED")
        message = await asyncio.wait_for(ws.recv(), timeout=20)
        data = json.loads(message)
        print("LIVE UPDATE RECEIVED")
        print("TYPE:", data.get("type"))
        print("DATA MODE:", data.get("data_mode"))
        print("ZONES:", len(data.get("zones", [])))

asyncio.run(test())
