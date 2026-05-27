from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.score import router as score_router
from app.config import settings

app = FastAPI(
    title="Resume ATS Scorer",
    version="0.1.0",
    description="spaCy section extraction + TF-IDF keyword scoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.app_env}
