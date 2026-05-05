import logging
import logging.config

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import Base, engine
from routers.orders import router as orders_router
from routers.ui_routes import router as ui_router
from routers.auth import router as auth_router
# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="Mini ERP API",
        version="1.0.0",
        description="A minimal ERP backend built with FastAPI + PostgreSQL.",
    )

    # CORS — tighten origins in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    from routers.products import router as products_router
    from routers.customers import router as customers_router
    from routers.audit import router as audit_router

    app.include_router(auth_router)
    app.include_router(orders_router)
    app.include_router(ui_router)
    app.include_router(products_router)
    app.include_router(customers_router)
    app.include_router(audit_router)

    # ── Startup: create tables (use Alembic migrations in production) ─────────
    @app.on_event("startup")
    async def startup_event() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified / created.")

    # ── Shutdown ──────────────────────────────────────────────────────────────
    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        await engine.dispose()
        logger.info("Database connections closed.")

    # ── Global unhandled-exception fallback ───────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s: %s", request.url, exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok"}