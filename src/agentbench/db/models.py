"""SQLAlchemy models (database tables) for AgentBench.

These models map to Postgres tables and correspond to the domain models in:
- agentbench.domain.benchmarks (BenchmarkTaskCreate, BenchmarkTaskRead)
- agentbench.domain.evaluations (EvaluationCreate, EvaluationRead)

Key concepts:
- Base: All models inherit from this
- Column: Represents a database column
- ForeignKey: Creates relationships between tables
- JSON: Stores nested data (lists, dicts) as JSON
- relationship: Creates Python object relationships (optional, makes queries easier)
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


# Base class for all models
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class BenchmarkTaskModel(Base):
    """Immutable benchmark task specification with validation evidence.

    Corresponds to: BenchmarkTaskRead in domain/benchmarks.py

    Client-writable fields come from BenchmarkTaskCreate.
    Worker-owned validation evidence cannot be set by clients.
    """

    __tablename__ = "benchmark_tasks"

    # STEP 1 TODO: Add primary key columns
    # - id (UUID, primary key, default uuid.uuid4)
    # - created_at (DateTime, default current UTC time, not nullable)

    # STEP 1 TODO: Add specification fields from BenchmarkTaskCreate
    # - title (String 200, not nullable)
    # - repository_url (Text, not nullable)
    # - base_commit (String 40, not nullable)
    # - reference_commit (String 40, not nullable)
    # - prompt (Text, not nullable)
    # - grading_paths (JSON list, not nullable)
    # - fail_to_pass (JSON list, not nullable)
    # - pass_to_pass (JSON list, not nullable, default empty list)
    # - test_command (JSON list, not nullable)
    # - environment (JSON object with image, setup_commands, not nullable)

    # STEP 1 TODO: Add computed specification hash
    # - specification_hash (String 64, not nullable, indexed)

    # STEP 1 TODO: Add validation status
    # - validation_status (String 20, not nullable, default="unvalidated", indexed)

    # STEP 1 TODO: Add worker-owned validation evidence (clients cannot write these)
    # - grading_bundle_sha256 (String 64, nullable - null until worker fills it)
    # - base_results (JSON, not nullable, default empty dict)
    # - reference_results (JSON, not nullable, default empty dict)
    # - validation_errors (JSON, not nullable, default empty list)

    # STEP 1 TODO: Add relationship to evaluations (optional - makes queries easier)
    # evaluations = relationship("EvaluationModel", back_populates="benchmark_task")

    pass


class EvaluationModel(Base):
    """An evaluation: run multiple models on one validated task.

    Corresponds to: EvaluationRead in domain/evaluations.py
    """

    __tablename__ = "evaluations"

    # STEP 1 TODO: Add primary key columns
    # - id (UUID, primary key, default uuid.uuid4)
    # - created_at (DateTime, default current UTC time, not nullable)

    # STEP 1 TODO: Add foreign key to benchmark task
    # - benchmark_task_id (UUID, foreign key to benchmark_tasks.id, not nullable)

    # STEP 1 TODO: Add list of model identifiers to evaluate
    # - models (JSON list of strings, not nullable)

    # STEP 1 TODO: Add snapshot of task metadata at evaluation time (immutable)
    # - task_specification_hash (String 64, not nullable)
    # - task_bundle_hash (String 64, not nullable)

    # STEP 1 TODO: Add relationships
    # - benchmark_task = relationship("BenchmarkTaskModel", back_populates="evaluations")
    # - runs = relationship("RunModel", back_populates="evaluation", cascade="all, delete-orphan")

    pass


class RunModel(Base):
    """A single model-run attempt within an evaluation.

    Corresponds to: RunSummary in domain/evaluations.py
    One run per model in an evaluation.
    """

    __tablename__ = "runs"

    # STEP 1 TODO: Add primary key columns
    # - id (UUID, primary key, default uuid.uuid4)
    # - created_at (DateTime, default current UTC time, not nullable)

    # STEP 1 TODO: Add foreign key to evaluation
    # - evaluation_id (UUID, foreign key to evaluations.id, not nullable)

    # STEP 1 TODO: Add model identifier
    # - model (String 200, not nullable)

    # STEP 1 TODO: Add status field
    # - status (String 20, not nullable, default="queued", indexed)
    #   Valid values: queued | preparing | running | grading | completed | failed | cancelled

    # STEP 1 TODO: Add results fields (filled after grading, nullable until then)
    # - fail_to_pass_passed (JSON list of test IDs that passed, nullable)
    # - pass_to_pass_passed (JSON list of test IDs that passed, nullable)
    # - grade_results (JSON dict {test_id: outcome}, nullable)

    # STEP 1 TODO: Add metadata fields (nullable)
    # - duration_seconds (JSON, can be float, nullable)
    # - token_usage (JSON dict {prompt_tokens, completion_tokens, ...}, nullable)
    # - cost_usd (JSON, nullable float, nullable)

    # STEP 1 TODO: Add error information (if failed)
    # - error_message (Text, nullable)

    # STEP 1 TODO: Add relationships
    # - evaluation = relationship("EvaluationModel", back_populates="runs")
    # - artifacts = relationship("ArtifactModel", back_populates="run", cascade="all, delete-orphan")

    pass


class ArtifactModel(Base):
    """Metadata for stored artifacts (bundles, patches, logs).

    The actual file bytes can be stored:
    - On disk (referenced by key)
    - In object storage like S3 (referenced by key)
    - In the database as bytea (not recommended for large files)

    For now, we just store metadata. Later steps will handle actual file storage.
    """

    __tablename__ = "artifacts"

    # STEP 1 TODO: Add primary key columns
    # - id (UUID, primary key, default uuid.uuid4)
    # - created_at (DateTime, default current UTC time, not nullable)

    # STEP 1 TODO: Add foreign keys (can be null for task-level artifacts like bundles)
    # - run_id (UUID, foreign key to runs.id, nullable)
    # - benchmark_task_id (UUID, foreign key to benchmark_tasks.id, nullable)

    # STEP 1 TODO: Add artifact identification
    # - key (String 500, not nullable, unique) - e.g., "bundles/abc123.tar.gz"
    # - kind (String 50, not nullable) - e.g., "bundle", "patch", "log"

    # STEP 1 TODO: Add content hash for integrity
    # - sha256 (String 64, not nullable, indexed)

    # STEP 1 TODO: Add size in bytes
    # - size_bytes (JSON, can be int, nullable)

    # STEP 1 TODO: Add relationships
    # - run = relationship("RunModel", back_populates="artifacts")

    pass
