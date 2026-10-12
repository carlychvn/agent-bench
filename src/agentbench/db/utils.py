"""Utility functions for database operations."""

import hashlib
import json

from agentbench.domain.benchmarks import BenchmarkTaskCreate
from agentbench.db.models import BenchmarkTaskModel, EvaluationModel, RunModel


def compute_spec_hash(task: BenchmarkTaskCreate) -> str:
    """Generate deterministic SHA-256 hash of task specification.

    Same inputs -> same hash.
    Any change to the task -> different hash.

    This ensures immutability: if you change the prompt, commits, or tests,
    you get a new task ID, not an update to the existing one.

    Args:
        task: The task specification to hash

    Returns:
        64-character hex string (SHA-256 hash)
    """
    # STEP 1 TODO: Implement deterministic spec hash
    # 1. Convert Pydantic model to dict using model_dump(mode="json")
    # 2. Create canonical JSON string with sorted keys
    # 3. Hash the canonical representation using SHA-256
    # Hint:
    #   data = task.model_dump(mode="json")
    #   canonical = json.dumps(data, sort_keys=True, ensure_ascii=True)
    #   return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    raise NotImplementedError("STEP 1 TODO: Implement compute_spec_hash")


def db_task_to_read(db_task: BenchmarkTaskModel):
    """Convert database model to BenchmarkTaskRead Pydantic model.

    This is needed because:
    - Database uses SQLAlchemy models (e.g., BenchmarkTaskModel)
    - API returns Pydantic models (e.g., BenchmarkTaskRead)

    Args:
        db_task: SQLAlchemy model from database query

    Returns:
        BenchmarkTaskRead Pydantic model for API response
    """
    from agentbench.domain.benchmarks import (
        BenchmarkTaskRead,
        BenchmarkValidation,
        EnvironmentSpec,
    )

    # STEP 1 TODO: Implement this conversion
    # Hint: You'll need to:
    # 1. Create EnvironmentSpec from db_task.environment JSON
    # 2. Create BenchmarkValidation from validation fields
    # 3. Create BenchmarkTaskRead with all fields
    #
    # Example structure:
    # return BenchmarkTaskRead(
    #     id=db_task.id,
    #     created_at=db_task.created_at,
    #     title=db_task.title,
    #     repository_url=db_task.repository_url,
    #     base_commit=db_task.base_commit,
    #     reference_commit=db_task.reference_commit,
    #     prompt=db_task.prompt,
    #     grading_paths=db_task.grading_paths,
    #     fail_to_pass=db_task.fail_to_pass,
    #     pass_to_pass=db_task.pass_to_pass,
    #     test_command=db_task.test_command,
    #     environment=EnvironmentSpec(**db_task.environment),
    #     validation=BenchmarkValidation(
    #         status=db_task.validation_status,
    #         grading_bundle_sha256=db_task.grading_bundle_sha256,
    #         base_results=db_task.base_results,
    #         reference_results=db_task.reference_results,
    #         errors=db_task.validation_errors,
    #     ),
    # )
    raise NotImplementedError("STEP 1 TODO: Implement db_task_to_read conversion")


def db_evaluation_to_read(db_eval: EvaluationModel):
    """Convert database EvaluationModel to EvaluationRead Pydantic model.

    Args:
        db_eval: SQLAlchemy model from database query

    Returns:
        EvaluationRead Pydantic model for API response
    """
    from agentbench.domain.evaluations import EvaluationRead, RunSummary

    # STEP 1 TODO: Implement this conversion
    # Hint: You'll need to:
    # 1. Convert the benchmark_task relationship to BenchmarkTaskRead
    # 2. Convert runs relationship to list of RunSummary
    # 3. Create EvaluationRead with all fields
    raise NotImplementedError("STEP 1 TODO: Implement db_evaluation_to_read conversion")
