import uuid

import jwt
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.realtime import manager
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

router = APIRouter(tags=["realtime"])


async def _authenticate(websocket: WebSocket, db: Session) -> User | None:
    token = websocket.query_params.get("token")
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        return None

    if user_id is None:
        return None

    user = db.get(User, uuid.UUID(user_id))
    if user is None or not user.is_active:
        return None

    return user


@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket, db: Session = Depends(get_db)) -> None:
    """Requires a valid access token as a `?token=` query param — WebSocket
    handshakes can't carry an Authorization header, so the token goes in the
    query string instead. Closes with 1008 (policy violation) if missing or
    invalid, before accepting the connection."""
    user = await _authenticate(websocket, db)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
