from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from agentbench.domain.benchmarks import (
    BenchmarkTaskCreate,
    BenchmarkTaskPage,
    BenchmarkTaskRead,
)

router = APIRouter(prefix="/benchmark-tasks", tags=["benchmark tasks"])


@router.post("", response_model=BenchmarkTaskRead)
def create_benchmark_task(request: BenchmarkTaskCreate) -> BenchmarkTaskRead:
    """Store an immutable task with server-owned unvalidated status.

    STEP 1 TODO: Implement database persistence
    Steps:
    1. Generate UUID for new task
    2. Compute specification hash (deterministic)
    3. Create database model with status='unvalidated'
    4. Save to database using db.add(), db.commit(), db.refresh()
    5. Convert to BenchmarkTaskRead and return

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("", response_model=BenchmarkTaskPage)
def list_benchmark_tasks(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> BenchmarkTaskPage:
    """List all tasks with pagination.

    STEP 1 TODO: Implement database query with pagination
    Steps:
    1. Query total count: db.query(BenchmarkTaskModel).count()
    2. Query tasks with limit/offset, ordered by created_at descending
    3. Convert each to BenchmarkTaskRead
    4. Return BenchmarkTaskPage

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/{task_id}", response_model=BenchmarkTaskRead)
def get_benchmark_task(task_id: UUID) -> BenchmarkTaskRead:
    """Get a single task by ID.

    Returns 404 if not found.

    STEP 1 TODO: Implement database query with 404 handling
    Steps:
    1. Query for task: db.query(BenchmarkTaskModel).filter(...).first()
    2. If not found, raise HTTPException(status_code=404)
    3. Convert to BenchmarkTaskRead and return

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/{task_id}/validate", response_model=BenchmarkTaskRead)
def validate_benchmark_task(task_id: UUID) -> BenchmarkTaskRead:
    """Request validation for a task (changes status to 'validating').

    Only the trusted worker will mark it as 'validated' later.

    Returns 404 if task doesn't exist.

    STEP 1 TODO: Implement status update with 404 handling
    Steps:
    1. Query for task
    2. If not found, raise HTTPException(status_code=404)
    3. Update validation_status to 'validating'
    4. Commit changes: db.commit(), db.refresh()
    5. Convert to BenchmarkTaskRead and return

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
