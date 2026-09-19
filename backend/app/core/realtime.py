import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []
        self.loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                logger.exception("Failed to send websocket message, dropping connection")
                self.disconnect(connection)

    def broadcast_event(self, event: str, data: dict[str, Any]) -> None:
        """Thread-safe broadcast for callers outside the event loop (sync service code).

        No-ops when there's no bound loop (e.g. during tests) or no active
        connections, so it's safe to call unconditionally from service layer.
        """
        if self.loop is None or not self.active_connections:
            return
        message = {"event": event, "data": data}
        asyncio.run_coroutine_threadsafe(self.broadcast(message), self.loop)


manager = ConnectionManager()
