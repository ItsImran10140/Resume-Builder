import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.score import router as score_router

app = FastAPI(title="Resume Builder API", version="1.0.0")

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "Resume Builder API", "version": "1.0.0", "status": "running"}


@app.on_event("startup")
async def startup_event() -> None:
    print("API started")
