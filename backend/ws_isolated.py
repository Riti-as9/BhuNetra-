from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/test")
async def websocket_test(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("HELLO FROM WEBSOCKET")
    await websocket.close()
