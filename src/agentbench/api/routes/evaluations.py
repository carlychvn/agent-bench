from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from agentbench.domain.evaluations import EvaluationCreate, EvaluationPage, EvaluationRead

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("", response_model=EvaluationRead)
def create_evaluation(request: EvaluationCreate) -> EvaluationRead:
    """Create an evaluation: run multiple models on a validated task.

    Critical gates (prevent invalid evaluations):
    - 404 if task doesn't exist
    - 409 if task is not validated

    STEP 1 TODO: Implement with 404/409 checks
    Steps:
    1. Load the benchmark task from database
    2. Check it exists (404 if not): raise HTTPException(status_code=404)
    3. Check it's validated (409 if not): raise HTTPException(status_code=409)
    4. Create evaluation with snapshot of task metadata
    5. Create one run per model (status='queued')
    6. Save to database and return

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("", response_model=EvaluationPage)
def list_evaluations(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> EvaluationPage:
    """List all evaluations with pagination.

    STEP 1 TODO: Implement pagination query
    Steps:
    1. Query total count
    2. Query evaluations with limit/offset, ordered by created_at descending
    3. For each evaluation, load related benchmark_task and runs
    4. Convert to EvaluationRead models
    5. Return EvaluationPage

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/{evaluation_id}", response_model=EvaluationRead)
def get_evaluation(evaluation_id: UUID) -> EvaluationRead:
    """Get a single evaluation by ID.

    Returns 404 if not found.

    STEP 1 TODO: Implement with 404 handling
    Steps:
    1. Query for evaluation
    2. If not found, raise HTTPException(status_code=404)
    3. Load related benchmark_task and runs
    4. Convert to EvaluationRead and return

    Hint: Use Depends(get_db) to get a database session
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
