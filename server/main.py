"""
Placify AI - Main Server Entry Point
FastAPI application with CORS, route mounting, and startup initialization.
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Load .env before any local imports so os.getenv() picks up the values
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# Add server directory to path for script-style (python main.py) imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .auth import router as auth_router
    from .database import init_db
    from .ml.predictor import load_models
    from .routes.analysis import router as analysis_router
    from .utils.resume_parser import ensure_nltk_resources
except ImportError:
    from auth import router as auth_router
    from database import init_db
    from ml.predictor import load_models
    from routes.analysis import router as analysis_router
    from utils.resume_parser import ensure_nltk_resources


def configure_console_output() -> None:
    """Avoid Windows console crashes when log messages contain Unicode."""
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is not None and hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def env_flag(name: str, default: bool = False) -> bool:
    """Parse a boolean environment variable."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_console_output()
    print("Placify AI Server starting...")
    init_db()
    load_models()
    print("Downloading / verifying NLTK models...")
    ensure_nltk_resources()
    print("Server ready!")
    yield


app = FastAPI(
    title="Placify AI",
    description="AI-driven placement prediction platform for students",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analysis_router)


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Placify AI"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        reload=env_flag("UVICORN_RELOAD", default=False),
    )
