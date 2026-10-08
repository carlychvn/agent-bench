from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agentbench.api.routes import benchmarks, evaluations
from agentbench.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AgentBench", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.include_router(benchmarks.router, prefix="/api/v1")
    app.include_router(evaluations.router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        """Process liveness only; does not assert database or worker readiness."""
        return {"status": "ok"}

    return app


app = create_app()
