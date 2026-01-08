"""
Main FastAPI application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from database import engine
import models

# Import routers (à créer)
#from api import auth, production, dashboard, market, cargo, reference, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 Starting Star Citizen App API...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🔐 CORS Origins: {settings.ALLOWED_ORIGINS}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Backend API for Star Citizen resource management and crew coordination",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/", tags=["Health"])
def health_check():
    """API health check."""
    return {
        "status": "ok",
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

from api import auth, production, market, reference, dashboard, cargo, admin

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(production.router, prefix="/production", tags=["Production"])
app.include_router(market.router, prefix="/market", tags=["Market"])
app.include_router(reference.router, prefix="/reference", tags=["Reference Data"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(cargo.router, prefix="/cargo", tags=["Cargo/Commerce"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
