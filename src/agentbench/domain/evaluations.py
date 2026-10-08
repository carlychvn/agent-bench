from datetime import datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import Field, field_validator

from agentbench.domain.benchmarks import BenchmarkTaskRead, Contract, NonEmptyText


class RunStatus(StrEnum):
    QUEUED = "queued"
    PREPARING = "preparing"
    RUNNING = "running"
    GRADING = "grading"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class EvaluationCreate(Contract):
    benchmark_task_id: UUID
    models: Annotated[list[NonEmptyText], Field(min_length=1, max_length=10)]

    @field_validator("models")
    @classmethod
    def unique_models(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("Model identifiers must be unique")
        return value


class RunSummary(Contract):
    id: UUID
    model: str
    status: RunStatus


class EvaluationRead(Contract):
    id: UUID
    benchmark_task: BenchmarkTaskRead
    models: list[str]
    created_at: datetime
    runs: list[RunSummary]


class EvaluationPage(Contract):
    items: list[EvaluationRead]
    limit: int
    offset: int
    total: int
