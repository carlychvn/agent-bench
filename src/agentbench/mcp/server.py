from uuid import UUID

import httpx
from mcp.server import MCPServer

from agentbench.config import get_settings
from agentbench.domain.benchmarks import BenchmarkTaskCreate
from agentbench.domain.evaluations import EvaluationCreate

server = MCPServer("AgentBench")


async def api_request(method: str, path: str, **kwargs: object) -> dict[str, object]:
    async with httpx.AsyncClient(base_url=get_settings().api_url.rstrip("/"), timeout=30) as client:
        response = await client.request(method, path, **kwargs)
        response.raise_for_status()
        return response.json()


def pagination(limit: int, offset: int) -> dict[str, int]:
    if not 1 <= limit <= 100 or offset < 0:
        raise ValueError("limit must be 1–100 and offset must be non-negative")
    return {"limit": limit, "offset": offset}


@server.tool()
async def create_benchmark_task(specification: BenchmarkTaskCreate) -> dict[str, object]:
    """Define an immutable base/reference task. Backend currently returns HTTP 501."""
    return await api_request(
        "POST", "/api/v1/benchmark-tasks", json=specification.model_dump(mode="json")
    )


@server.tool()
async def get_benchmark_task(task_id: UUID) -> dict[str, object]:
    """Get a benchmark specification and validation evidence (currently HTTP 501)."""
    return await api_request("GET", f"/api/v1/benchmark-tasks/{task_id}")


@server.tool()
async def list_benchmark_tasks(limit: int = 20, offset: int = 0) -> dict[str, object]:
    """List benchmark definitions (currently HTTP 501)."""
    return await api_request("GET", "/api/v1/benchmark-tasks", params=pagination(limit, offset))


@server.tool()
async def validate_benchmark_task(task_id: UUID) -> dict[str, object]:
    """Request worker validation, not an assertion of validity (currently HTTP 501)."""
    return await api_request("POST", f"/api/v1/benchmark-tasks/{task_id}/validate")


@server.tool()
async def create_evaluation(benchmark_task_id: UUID, models: list[str]) -> dict[str, object]:
    """Evaluate selected models on one validated benchmark task (currently HTTP 501)."""
    request = EvaluationCreate(benchmark_task_id=benchmark_task_id, models=models)
    return await api_request("POST", "/api/v1/evaluations", json=request.model_dump(mode="json"))


@server.tool()
async def get_evaluation(evaluation_id: UUID) -> dict[str, object]:
    """Get an evaluation and its runs via the API (currently HTTP 501)."""
    return await api_request("GET", f"/api/v1/evaluations/{evaluation_id}")


@server.tool()
async def list_evaluations(limit: int = 20, offset: int = 0) -> dict[str, object]:
    """List evaluations via the API (currently HTTP 501)."""
    return await api_request("GET", "/api/v1/evaluations", params=pagination(limit, offset))


def main() -> None:
    server.run(transport="stdio")


if __name__ == "__main__":
    main()
