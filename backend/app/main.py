from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import tasks, squads, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: could start background scheduler here
    yield
    # Shutdown


app = FastAPI(title="LockIn API", version="0.1.0", lifespan=lifespan)

from app.config import get_settings

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(squads.router, prefix="/squads", tags=["squads"])
app.include_router(users.router, prefix="/users", tags=["users"])


@app.get("/health")
async def health():
    return {"status": "ok"}
