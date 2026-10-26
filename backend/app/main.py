from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Institution
from .seed import seed_database
from .routers import (
    clock_router,
    audit_router,
    rules_router,
    institutions_router,
    fdrs_router,
    demo_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Check if database has been seeded
    db = SessionLocal()
    try:
        count = db.query(Institution).count()
        if count == 0:
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="KoshPramaan (कोष-प्रमाण) API",
    description="AICTE Security Deposit & FDR Verification Portal API - Streamline of Security Deposit / FDR Portal",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (Both root and /api prefixes supported for flexible deployment)
for prefix in ["", "/api"]:
    app.include_router(clock_router.router, prefix=prefix)
    app.include_router(audit_router.router, prefix=prefix)
    app.include_router(rules_router.router, prefix=prefix)
    app.include_router(institutions_router.router, prefix=prefix)
    app.include_router(fdrs_router.router, prefix=prefix)
    app.include_router(demo_router.router, prefix=prefix)


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "koshpramaan-api"}


@app.get("/")
def root():
    return {
        "portal": "KoshPramaan (कोष-प्रमाण)",
        "agency": "AICTE",
        "notice": "Demo data, mocked integrations",
        "docs_url": "/docs",
        "endpoints": [
            "/api/clock",
            "/api/clock/advance",
            "/api/clock/reset",
            "/api/audit/verify",
            "/api/audit/events",
            "/api/rules",
            "/api/institutions",
            "/api/fdrs",
            "/api/demo/status",
            "/api/demo/reset",
        ],
    }

            "/institutions",
            "/fdrs",
            "/demo/status",
            "/demo/reset",
        ],
    }
