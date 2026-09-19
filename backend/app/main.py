from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, assignments, incidents, realtime, resources
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Intelligent Emergency Response Platform", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router)
app.include_router(resources.router)
app.include_router(assignments.router)
app.include_router(alerts.router)
app.include_router(realtime.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
