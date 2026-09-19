import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, analytics, assignments, auth, incidents, realtime, resources
from app.core.config import get_settings
from app.core.realtime import manager
from app.core.scheduler import start_scheduler, stop_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    manager.bind_loop(asyncio.get_running_loop())
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Intelligent Emergency Response Platform", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(resources.router)
app.include_router(assignments.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(realtime.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
