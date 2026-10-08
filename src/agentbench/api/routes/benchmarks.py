from typing import Annotated, NoReturn
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from agentbench.domain.benchmarks import BenchmarkTaskCreate, BenchmarkTaskPage, BenchmarkTaskRead

router = APIRouter(prefix="/benchmark-tasks", tags=["benchmark tasks"])
PLACEHOLDER_RESPONSES = {
    501: {"description": "Benchmark persistence/validation is not implemented"}
}


def not_implemented() -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail="Benchmark persistence, test extraction and validation are not implemented.",
    )


@router.post("", response_model=BenchmarkTaskRead, responses=PLACEHOLDER_RESPONSES)
def create_benchmark_task(request: BenchmarkTaskCreate) -> BenchmarkTaskRead:
    """Phase 2: store an immutable task with server-owned unvalidated status."""
    not_implemented()


@router.get("", response_model=BenchmarkTaskPage, responses=PLACEHOLDER_RESPONSES)
def list_benchmark_tasks(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> BenchmarkTaskPage:
    not_implemented()


@router.get("/{task_id}", response_model=BenchmarkTaskRead, responses=PLACEHOLDER_RESPONSES)
def get_benchmark_task(task_id: UUID) -> BenchmarkTaskRead:
    not_implemented()


@router.post(
    "/{task_id}/validate", response_model=BenchmarkTaskRead, responses=PLACEHOLDER_RESPONSES
)
def validate_benchmark_task(task_id: UUID) -> BenchmarkTaskRead:
    """Phase 2: enqueue validation; only the trusted worker may mark a task validated."""
    not_implemented()
