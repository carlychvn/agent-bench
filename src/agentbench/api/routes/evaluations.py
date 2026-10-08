from typing import Annotated, NoReturn
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from agentbench.domain.evaluations import EvaluationCreate, EvaluationPage, EvaluationRead

router = APIRouter(prefix="/evaluations", tags=["evaluations"])
PLACEHOLDER_RESPONSES = {501: {"description": "Evaluation persistence is not implemented"}}


def not_implemented() -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail="Evaluation persistence and execution are not implemented in this scaffold.",
    )


@router.post("", response_model=EvaluationRead, responses=PLACEHOLDER_RESPONSES)
def create_evaluation(request: EvaluationCreate) -> EvaluationRead:
    """Phase 2: load a validated immutable task, snapshot it and enqueue model runs.

    Unknown task IDs must return 404. Unvalidated/rejected tasks must return 409.
    Clients cannot replace task inputs or submit reference data to the agent.
    """
    not_implemented()


@router.get("", response_model=EvaluationPage, responses=PLACEHOLDER_RESPONSES)
def list_evaluations(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> EvaluationPage:
    """Phase 2: list persisted evaluations with stable ordering and pagination."""
    not_implemented()


@router.get("/{evaluation_id}", response_model=EvaluationRead, responses=PLACEHOLDER_RESPONSES)
def get_evaluation(evaluation_id: UUID) -> EvaluationRead:
    """Phase 2: load an evaluation and its model runs, or return 404."""
    not_implemented()
