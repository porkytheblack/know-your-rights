from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, documents
from app.api.admin import auth as admin_auth, documents as admin_documents, analytics as admin_analytics, news as admin_news
from app.config import settings

from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.models.database import db
from app.utils.limiter import limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

# Admin Routers
app.include_router(admin_auth.router, prefix="/api/admin/auth", tags=["admin-auth"])
app.include_router(admin_documents.router, prefix="/api/admin/documents", tags=["admin-documents"])
app.include_router(admin_analytics.router, prefix="/api/admin/analytics", tags=["admin-analytics"])
app.include_router(admin_news.router, prefix="/api/admin/news", tags=["admin-news"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "project": "know-your-rights"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
