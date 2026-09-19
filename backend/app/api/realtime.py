from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.realtime import manager

router = APIRouter(tags=["realtime"])


@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
