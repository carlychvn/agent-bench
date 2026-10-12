# Complete TODO Implementation Guide

This document explains **every single TODO** in the codebase, organized by step.

Each TODO includes:
- 📍 **Location** - Exact file and line
- 📝 **What to do** - Clear instructions
- 💡 **Why** - Purpose and context
- ⚙️ **How** - Code example
- ⚠️ **Common mistakes** - What to avoid
- ✅ **Done when** - How to verify it works

---

## Table of Contents

- [Step 1: Database Persistence](#step-1-database-persistence)
  - [Session & Engine Setup](#session--engine-setup)
  - [Database Models](#database-models)
  - [Utility Functions](#utility-functions)
  - [API Routes - Benchmarks](#api-routes---benchmarks)
  - [API Routes - Evaluations](#api-routes---evaluations)
- [Step 2: Extract Trusted Tests](#step-2-extract-trusted-tests)
  - [Git Operations](#git-operations)
  - [Bundle Building](#bundle-building)
- [Step 3: Validate Base/Reference](#step-3-validate-basereference)
  - [Docker Test Execution](#docker-test-execution)
  - [Workspace Preparation](#workspace-preparation)
- [Step 4: Run One Agent](#step-4-run-one-agent)
  - [Agent Initialization](#agent-initialization)
  - [Agent Loop](#agent-loop)
  - [Tool Execution](#tool-execution)

---

# Step 1: Database Persistence

## Session & Engine Setup

### TODO 1.1: Create SQLAlchemy Engine

**📍 Location:** `src/agentbench/db/session.py:16-23`

**📝 What to do:**
Create the SQLAlchemy engine that connects to PostgreSQL.

**💡 Why:**
The engine manages the connection pool to your database. Without it, you can't talk to Postgres.

**⚙️ How:**
```python
# Replace the TODO comment with:
from agentbench.config import get_settings

settings = get_settings()
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verify connections before using them
)
```

**⚠️ Common mistakes:**
- Forgetting to import `get_settings`
- Wrong database URL (check `.env` file)
- Postgres not running

**✅ Done when:**
- Code doesn't raise `NotImplementedError`
- You can import `engine` from `agentbench.db`

---

### TODO 1.2: Create SessionLocal Factory

**📍 Location:** `src/agentbench/db/session.py:25-32`

**📝 What to do:**
Create a session factory that produces database sessions.

**💡 Why:**
Each HTTP request needs its own database session for isolation.

**⚙️ How:**
```python
# Replace the TODO comment with:
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,  # We'll commit manually for control
    autoflush=False,   # We'll flush manually for control
)
```

**⚠️ Common mistakes:**
- Setting `autocommit=True` (you want manual control)
- Forgetting to bind to the engine

**✅ Done when:**
- You can create sessions: `db = SessionLocal()`

---

### TODO 1.3: Implement get_db() Function

**📍 Location:** `src/agentbench/db/session.py:46-57`

**📝 What to do:**
Implement the FastAPI dependency that provides database sessions.

**💡 Why:**
This is how FastAPI routes get access to the database. It handles session lifecycle automatically.

**⚙️ How:**
```python
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db  # Provide the session to the route
    finally:
        db.close()  # Always close the session when done
```

**⚠️ Common mistakes:**
- Forgetting the `finally` block (causes connection leaks)
- Not yielding (route won't get the session)

**✅ Done when:**
- You can use `db: Session = Depends(get_db)` in routes
- No connection leak warnings

---

### TODO 1.4: Import and Export Database Components

**📍 Location:** `src/agentbench/db/__init__.py:9-24`

**📝 What to do:**
Uncomment the import/export statements.

**💡 Why:**
This makes database components easy to import elsewhere: `from agentbench.db import get_db`

**⚙️ How:**
```python
# Uncomment these lines:
from agentbench.db.models import Base, BenchmarkTaskModel, EvaluationModel, RunModel, ArtifactModel
from agentbench.db.session import SessionLocal, engine, get_db

__all__ = [
    "Base",
    "BenchmarkTaskModel",
    "EvaluationModel",
    "RunModel",
    "ArtifactModel",
    "SessionLocal",
    "engine",
    "get_db",
]
```

**⚠️ Common mistakes:**
- Uncommenting before implementing the models (import errors)

**✅ Done when:**
- `from agentbench.db import get_db` works

---

## Database Models

### TODO 1.5-1.11: Complete BenchmarkTaskModel

**📍 Location:** `src/agentbench/db/models.py:41-69`

**📝 What to do:**
Fill in all the column definitions for the benchmark_tasks table.

**💡 Why:**
This table stores all task specifications and validation evidence.

**⚙️ How:**
```python
class BenchmarkTaskModel(Base):
    __tablename__ = "benchmark_tasks"

    # TODO 1.5: Primary key columns
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # TODO 1.6: Specification fields from BenchmarkTaskCreate
    title = Column(String(200), nullable=False)
    repository_url = Column(Text, nullable=False)
    base_commit = Column(String(40), nullable=False)
    reference_commit = Column(String(40), nullable=False)
    prompt = Column(Text, nullable=False)
    grading_paths = Column(JSON, nullable=False)  # List of strings
    fail_to_pass = Column(JSON, nullable=False)  # List of test IDs
    pass_to_pass = Column(JSON, nullable=False, default=list)  # List of test IDs
    test_command = Column(JSON, nullable=False)  # List of strings
    environment = Column(JSON, nullable=False)  # Object with {image, setup_commands}

    # TODO 1.7: Computed specification hash
    specification_hash = Column(String(64), nullable=False, index=True)

    # TODO 1.8: Validation status
    validation_status = Column(String(20), nullable=False, default="unvalidated", index=True)

    # TODO 1.9: Worker-owned validation evidence
    grading_bundle_sha256 = Column(String(64), nullable=True)
    base_results = Column(JSON, nullable=False, default=dict)
    reference_results = Column(JSON, nullable=False, default=dict)
    validation_errors = Column(JSON, nullable=False, default=list)

    # TODO 1.10: Relationships (optional but helpful)
    evaluations = relationship("EvaluationModel", back_populates="benchmark_task")
```

**⚠️ Common mistakes:**
- Wrong column types (e.g., `String` instead of `Text` for long fields)
- Forgetting `nullable=False` for required fields
- Not importing `uuid`, `datetime`, `timezone`

**✅ Done when:**
- Migration creates table successfully
- Can insert and query tasks

---

### TODO 1.12-1.17: Complete EvaluationModel

**📍 Location:** `src/agentbench/db/models.py:83-97`

**📝 What to do:**
Define the evaluations table.

**⚙️ How:**
```python
class EvaluationModel(Base):
    __tablename__ = "evaluations"

    # TODO 1.12: Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # TODO 1.13: Foreign key
    benchmark_task_id = Column(UUID(as_uuid=True), ForeignKey("benchmark_tasks.id"), nullable=False)

    # TODO 1.14: Model list
    models = Column(JSON, nullable=False)  # List of strings

    # TODO 1.15: Task metadata snapshot
    task_specification_hash = Column(String(64), nullable=False)
    task_bundle_hash = Column(String(64), nullable=False)

    # TODO 1.16: Relationships
    benchmark_task = relationship("BenchmarkTaskModel", back_populates="evaluations")
    runs = relationship("RunModel", back_populates="evaluation", cascade="all, delete-orphan")
```

**✅ Done when:**
- Can create evaluations linked to tasks
- Foreign key constraint works

---

### TODO 1.18-1.24: Complete RunModel

**📍 Location:** `src/agentbench/db/models.py:113-140`

**📝 What to do:**
Define the runs table (one per model per evaluation).

**⚙️ How:**
```python
class RunModel(Base):
    __tablename__ = "runs"

    # TODO 1.18: Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # TODO 1.19: Foreign key
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=False)

    # TODO 1.20: Model identifier
    model = Column(String(200), nullable=False)

    # TODO 1.21: Status
    status = Column(String(20), nullable=False, default="queued", index=True)

    # TODO 1.22: Results (nullable until grading completes)
    fail_to_pass_passed = Column(JSON, nullable=True)
    pass_to_pass_passed = Column(JSON, nullable=True)
    grade_results = Column(JSON, nullable=True)

    # TODO 1.23: Metadata
    duration_seconds = Column(JSON, nullable=True)
    token_usage = Column(JSON, nullable=True)
    cost_usd = Column(JSON, nullable=True)

    # TODO 1.24: Error info
    error_message = Column(Text, nullable=True)

    # TODO 1.25: Relationships
    evaluation = relationship("EvaluationModel", back_populates="runs")
    artifacts = relationship("ArtifactModel", back_populates="run", cascade="all, delete-orphan")
```

**✅ Done when:**
- Can create runs for evaluations
- Status updates work

---

### TODO 1.26-1.31: Complete ArtifactModel

**📍 Location:** `src/agentbench/db/models.py:160-178`

**📝 What to do:**
Define artifacts table for file metadata.

**⚙️ How:**
```python
class ArtifactModel(Base):
    __tablename__ = "artifacts"

    # TODO 1.26: Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # TODO 1.27: Foreign keys (nullable - can be task or run artifacts)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=True)
    benchmark_task_id = Column(UUID(as_uuid=True), ForeignKey("benchmark_tasks.id"), nullable=True)

    # TODO 1.28: Artifact identification
    key = Column(String(500), nullable=False, unique=True)
    kind = Column(String(50), nullable=False)

    # TODO 1.29: Content hash
    sha256 = Column(String(64), nullable=False, index=True)

    # TODO 1.30: Size
    size_bytes = Column(JSON, nullable=True)

    # TODO 1.31: Relationships
    run = relationship("RunModel", back_populates="artifacts")
```

**✅ Done when:**
- Can store artifact metadata
- Unique constraint on `key` works

---

## Utility Functions

### TODO 1.32: Implement compute_spec_hash

**📍 Location:** `src/agentbench/db/utils.py:25-34`

**📝 What to do:**
Generate a deterministic SHA-256 hash of the task specification.

**💡 Why:**
This ensures immutability - same inputs always produce the same hash. Changed inputs = new task.

**⚙️ How:**
```python
def compute_spec_hash(task: BenchmarkTaskCreate) -> str:
    """Generate deterministic SHA-256 hash of task specification."""
    # Convert Pydantic model to dict
    data = task.model_dump(mode="json")

    # Sort keys for determinism
    canonical = json.dumps(data, sort_keys=True, ensure_ascii=True)

    # Hash it
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
```

**⚠️ Common mistakes:**
- Not sorting keys (same task gets different hashes)
- Using `str(task)` instead of `model_dump()` (not deterministic)

**✅ Done when:**
- Same task always produces same hash
- Different tasks produce different hashes

---

### TODO 1.33: Implement db_task_to_read

**📍 Location:** `src/agentbench/db/utils.py:56-84`

**📝 What to do:**
Convert database model to Pydantic API response model.

**💡 Why:**
Database uses SQLAlchemy models, but API returns Pydantic models. Need conversion.

**⚙️ How:**
```python
def db_task_to_read(db_task: BenchmarkTaskModel):
    """Convert database model to BenchmarkTaskRead."""
    from agentbench.domain.benchmarks import (
        BenchmarkTaskRead,
        BenchmarkValidation,
        EnvironmentSpec,
    )

    return BenchmarkTaskRead(
        id=db_task.id,
        created_at=db_task.created_at,
        title=db_task.title,
        repository_url=db_task.repository_url,
        base_commit=db_task.base_commit,
        reference_commit=db_task.reference_commit,
        prompt=db_task.prompt,
        grading_paths=db_task.grading_paths,
        fail_to_pass=db_task.fail_to_pass,
        pass_to_pass=db_task.pass_to_pass,
        test_command=db_task.test_command,
        environment=EnvironmentSpec(**db_task.environment),
        validation=BenchmarkValidation(
            status=db_task.validation_status,  # type: ignore
            grading_bundle_sha256=db_task.grading_bundle_sha256,
            base_results=db_task.base_results,
            reference_results=db_task.reference_results,
            errors=db_task.validation_errors,
        ),
    )
```

**⚠️ Common mistakes:**
- Field name mismatches (e.g., `validation_status` vs `status`)
- Forgetting to convert JSON to nested models

**✅ Done when:**
- API returns properly formatted responses

---

### TODO 1.34: Implement db_evaluation_to_read

**📍 Location:** `src/agentbench/db/utils.py:98-103`

**📝 What to do:**
Convert evaluation database model to API response.

**⚙️ How:**
```python
def db_evaluation_to_read(db_eval: EvaluationModel):
    """Convert database EvaluationModel to EvaluationRead."""
    from agentbench.domain.evaluations import EvaluationRead, RunSummary

    return EvaluationRead(
        id=db_eval.id,
        created_at=db_eval.created_at,
        benchmark_task=db_task_to_read(db_eval.benchmark_task),
        models=db_eval.models,
        runs=[
            RunSummary(id=run.id, model=run.model, status=run.status)  # type: ignore
            for run in db_eval.runs
        ],
    )
```

**✅ Done when:**
- Evaluation API responses include nested task and runs

---

## API Routes - Benchmarks

### TODO 1.35: Implement create_benchmark_task

**📍 Location:** `src/agentbench/api/routes/benchmarks.py:19-29`

**📝 What to do:**
Store a new task in the database.

**💡 Why:**
This is the entry point - users create tasks via this endpoint.

**⚙️ How:**
```python
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import Depends
from sqlalchemy.orm import Session
from agentbench.db import get_db, BenchmarkTaskModel
from agentbench.db.utils import compute_spec_hash, db_task_to_read

@router.post("", response_model=BenchmarkTaskRead)
def create_benchmark_task(
    request: BenchmarkTaskCreate,
    db: Session = Depends(get_db)
) -> BenchmarkTaskRead:
    """Store an immutable task."""
    # 1. Generate UUID
    task_id = uuid4()

    # 2. Compute spec hash
    spec_hash = compute_spec_hash(request)

    # 3. Create database model
    db_task = BenchmarkTaskModel(
        id=task_id,
        created_at=datetime.now(timezone.utc),
        specification_hash=spec_hash,
        validation_status="unvalidated",
        title=request.title,
        repository_url=str(request.repository_url),
        base_commit=request.base_commit,
        reference_commit=request.reference_commit,
        prompt=request.prompt,
        grading_paths=request.grading_paths,
        fail_to_pass=request.fail_to_pass,
        pass_to_pass=request.pass_to_pass,
        test_command=request.test_command,
        environment=request.environment.model_dump(mode="json"),
        grading_bundle_sha256=None,
        base_results={},
        reference_results={},
        validation_errors=[],
    )

    # 4. Save to database
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # 5. Return response
    return db_task_to_read(db_task)
```

**⚠️ Common mistakes:**
- Forgetting to commit
- Not refreshing (won't get generated values)
- Converting URL to string incorrectly

**✅ Done when:**
- POST to `/api/v1/benchmark-tasks` creates a task
- Task persists after API restart

---

### TODO 1.36: Implement list_benchmark_tasks

**📍 Location:** `src/agentbench/api/routes/benchmarks.py:39-48`

**📝 What to do:**
List tasks with pagination.

**⚙️ How:**
```python
@router.get("", response_model=BenchmarkTaskPage)
def list_benchmark_tasks(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(get_db),
) -> BenchmarkTaskPage:
    """List all tasks with pagination."""
    # Count total
    total = db.query(BenchmarkTaskModel).count()

    # Query with pagination
    db_tasks = (
        db.query(BenchmarkTaskModel)
        .order_by(BenchmarkTaskModel.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    # Convert to response models
    items = [db_task_to_read(task) for task in db_tasks]

    return BenchmarkTaskPage(items=items, limit=limit, offset=offset, total=total)
```

**✅ Done when:**
- GET returns list of tasks
- Pagination works

---

### TODO 1.37: Implement get_benchmark_task

**📍 Location:** `src/agentbench/api/routes/benchmarks.py:57-65`

**📝 What to do:**
Get single task by ID, return 404 if not found.

**⚙️ How:**
```python
@router.get("/{task_id}", response_model=BenchmarkTaskRead)
def get_benchmark_task(
    task_id: UUID,
    db: Session = Depends(get_db)
) -> BenchmarkTaskRead:
    """Get a single task by ID."""
    db_task = db.query(BenchmarkTaskModel).filter(BenchmarkTaskModel.id == task_id).first()

    if db_task is None:
        raise HTTPException(status_code=404, detail=f"Benchmark task {task_id} not found")

    return db_task_to_read(db_task)
```

**✅ Done when:**
- GET with valid ID returns task
- GET with invalid ID returns 404

---

### TODO 1.38: Implement validate_benchmark_task

**📍 Location:** `src/agentbench/api/routes/benchmarks.py:76-86`

**📝 What to do:**
Set task status to "validating".

**⚙️ How:**
```python
@router.post("/{task_id}/validate", response_model=BenchmarkTaskRead)
def validate_benchmark_task(
    task_id: UUID,
    db: Session = Depends(get_db)
) -> BenchmarkTaskRead:
    """Request validation for a task."""
    db_task = db.query(BenchmarkTaskModel).filter(BenchmarkTaskModel.id == task_id).first()

    if db_task is None:
        raise HTTPException(status_code=404, detail=f"Benchmark task {task_id} not found")

    # Update status
    db_task.validation_status = "validating"
    db.commit()
    db.refresh(db_task)

    return db_task_to_read(db_task)
```

**✅ Done when:**
- POST changes status to "validating"
- Returns 404 for missing task

---

## API Routes - Evaluations

### TODO 1.39: Implement create_evaluation

**📍 Location:** `src/agentbench/api/routes/evaluations.py:19-30`

**📝 What to do:**
Create evaluation with 404/409 gates.

**💡 Why:**
This is the CRITICAL security gate - prevents evaluations on invalid tasks.

**⚙️ How:**
```python
from agentbench.db import EvaluationModel, RunModel

@router.post("", response_model=EvaluationRead)
def create_evaluation(
    request: EvaluationCreate,
    db: Session = Depends(get_db)
) -> EvaluationRead:
    """Create evaluation with validation gates."""
    # Load task
    db_task = (
        db.query(BenchmarkTaskModel)
        .filter(BenchmarkTaskModel.id == request.benchmark_task_id)
        .first()
    )

    # Gate 1: Task must exist (404)
    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail=f"Benchmark task {request.benchmark_task_id} not found"
        )

    # Gate 2: Task must be validated (409)
    if db_task.validation_status != "validated":
        raise HTTPException(
            status_code=409,
            detail=f"Task {request.benchmark_task_id} is {db_task.validation_status}, not validated"
        )

    # Create evaluation
    eval_id = uuid4()
    db_eval = EvaluationModel(
        id=eval_id,
        created_at=datetime.now(timezone.utc),
        benchmark_task_id=db_task.id,
        models=request.models,
        task_specification_hash=db_task.specification_hash,
        task_bundle_hash=db_task.grading_bundle_sha256 or "",
    )
    db.add(db_eval)

    # Create runs
    db_runs = []
    for model in request.models:
        run = RunModel(
            id=uuid4(),
            created_at=datetime.now(timezone.utc),
            evaluation_id=eval_id,
            model=model,
            status="queued",
        )
        db.add(run)
        db_runs.append(run)

    db.commit()
    db.refresh(db_eval)
    for run in db_runs:
        db.refresh(run)

    return db_evaluation_to_read(db_eval)
```

**⚠️ Common mistakes:**
- Forgetting 404 check (crashes on missing task)
- Forgetting 409 check (runs on unvalidated task - SECURITY ISSUE!)
- Not creating runs (incomplete evaluation)

**✅ Done when:**
- Returns 404 for missing task
- Returns 409 for unvalidated task
- Creates evaluation + runs for validated task

---

### TODO 1.40: Implement list_evaluations

**📍 Location:** `src/agentbench/api/routes/evaluations.py:40-50`

**📝 What to do:**
List evaluations with pagination.

**⚙️ How:**
```python
@router.get("", response_model=EvaluationPage)
def list_evaluations(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(get_db),
) -> EvaluationPage:
    """List evaluations with pagination."""
    total = db.query(EvaluationModel).count()

    db_evals = (
        db.query(EvaluationModel)
        .order_by(EvaluationModel.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    items = [db_evaluation_to_read(eval) for eval in db_evals]

    return EvaluationPage(items=items, limit=limit, offset=offset, total=total)
```

**✅ Done when:**
- GET returns evaluations
- Includes nested task and runs

---

### TODO 1.41: Implement get_evaluation

**📍 Location:** `src/agentbench/api/routes/evaluations.py:59-68`

**📝 What to do:**
Get single evaluation with 404.

**⚙️ How:**
```python
@router.get("/{evaluation_id}", response_model=EvaluationRead)
def get_evaluation(
    evaluation_id: UUID,
    db: Session = Depends(get_db)
) -> EvaluationRead:
    """Get single evaluation."""
    db_eval = db.query(EvaluationModel).filter(EvaluationModel.id == evaluation_id).first()

    if db_eval is None:
        raise HTTPException(status_code=404, detail=f"Evaluation {evaluation_id} not found")

    return db_evaluation_to_read(db_eval)
```

**✅ Done when:**
- Returns evaluation or 404

---

# Step 2: Extract Trusted Tests

## Git Operations

### TODO 2.1: Implement git fetch

**📍 Location:** `src/agentbench/execution/git_repo.py:88-95`

**📝 What to do:**
Update cached repository with git fetch.

**💡 Why:**
Get latest commits without re-cloning entire repo.

**⚙️ How:**
```python
# Replace TODO with:
result = subprocess.run(
    ["git", "fetch", "--all"],
    cwd=repo_path,
    capture_output=True,
    text=True,
    timeout=60,
)
if result.returncode != 0:
    raise GitRepositoryError(f"Git fetch failed: {result.stderr}")
```

**✅ Done when:**
- Cached repos update successfully

---

### TODO 2.2: Implement git clone

**📍 Location:** `src/agentbench/execution/git_repo.py:100-110`

**📝 What to do:**
Clone repository for first time.

**⚙️ How:**
```python
# Replace TODO with:
result = subprocess.run(
    ["git", "clone", "--bare", repository_url, str(repo_path)],
    capture_output=True,
    text=True,
    timeout=300,
)
if result.returncode != 0:
    raise GitRepositoryError(f"Git clone failed: {result.stderr}")
```

**💡 Why `--bare`:**
We only need to read files, not work with branches. Bare repos are smaller and faster.

**✅ Done when:**
- First clone succeeds
- Subsequent calls use cached version

---

### TODO 2.3: Implement commit verification

**📍 Location:** `src/agentbench/execution/git_repo.py:133-140`

**📝 What to do:**
Check if commit exists using git cat-file.

**⚙️ How:**
```python
# Replace TODO with:
result = subprocess.run(
    ["git", "cat-file", "-t", commit_sha],
    cwd=repo_path,
    capture_output=True,
    timeout=10,
)
return result.returncode == 0
```

**✅ Done when:**
- Valid commits return True
- Invalid commits return False

---

### TODO 2.4: Implement file extraction

**📍 Location:** `src/agentbench/execution/git_repo.py:168-182`

**📝 What to do:**
Extract file content at specific commit.

**⚙️ How:**
```python
# Replace TODO with:
result = subprocess.run(
    ["git", "show", f"{commit_sha}:{file_path}"],
    cwd=repo_path,
    capture_output=True,
    timeout=30,
)

if result.returncode != 0:
    raise GitRepositoryError(
        f"File {file_path} not found at commit {commit_sha}"
    )

return result.stdout  # Returns bytes
```

**✅ Done when:**
- Can extract files from any commit
- Returns file content as bytes

---

### TODO 2.5: Implement file listing

**📍 Location:** `src/agentbench/execution/git_repo.py:205-220`

**📝 What to do:**
List all files at a commit.

**⚙️ How:**
```python
# Replace TODO with:
result = subprocess.run(
    ["git", "ls-tree", "-r", "--name-only", commit_sha],
    cwd=repo_path,
    capture_output=True,
    text=True,
    timeout=30,
)

if result.returncode != 0:
    raise GitRepositoryError(f"Failed to list files: {result.stderr}")

files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
return files
```

**✅ Done when:**
- Returns list of all files in repo at that commit

---

### TODO 2.6: Implement path security check

**📍 Location:** `src/agentbench/execution/git_repo.py:239-265`

**📝 What to do:**
Validate file paths to prevent directory traversal.

**💡 Why:**
Security! Prevent malicious paths like `../../etc/passwd`

**⚙️ How:**
```python
def _is_safe_path(self, path: str) -> bool:
    """Validate that a file path is safe."""
    try:
        p = Path(path)

        # No absolute paths
        if p.is_absolute():
            return False

        # No parent directory references
        if ".." in p.parts:
            return False

        # No .git access
        if ".git" in p.parts:
            return False

        # No null bytes or backslashes
        if any(char in str(path) for char in ["\0", "\\"]):
            return False

        return True
    except Exception:
        return False
```

**⚠️ Common mistakes:**
- Only checking for `..` as string (misses `foo/../bar`)
- Not checking for absolute paths
- Allowing .git access

**✅ Done when:**
- Rejects `../etc/passwd`
- Rejects `/etc/passwd`
- Rejects `.git/config`
- Accepts `tests/test_foo.py`

---

## Bundle Building

### TODO 2.7: Complete bundle building

**📍 Location:** `src/agentbench/execution/git_repo.py:324-365`

**📝 What to do:**
This is mostly complete - just review and ensure it handles your use case.

**✅ Done when:**
- Can build bundle from grading_paths
- Bundle has manifest with hashes
- Bundle SHA-256 is deterministic

---

### TODO 2.8: Use BundleBuilder in preparer

**📍 Location:** `src/agentbench/execution/preparer.py:79-95`

**📝 What to do:**
Call BundleBuilder to create bundle.

**⚙️ How:**
```python
# The code is already there! Just verify it works:
bundle_path, bundle_hash = self.bundle_builder.build_bundle(
    repository_url=str(specification.repository_url),
    reference_commit=specification.reference_commit,
    grading_paths=specification.grading_paths,
    output_dir=self.bundle_storage_dir,
)

artifact_key = f"bundles/{task_id}/{bundle_hash}.tar.gz"

return TrustedGradingBundle(
    task_id=task_id,
    artifact_key=artifact_key,
    sha256=bundle_hash,
    grading_paths=tuple(specification.grading_paths),
)
```

**✅ Done when:**
- Bundle is created and stored
- Returns TrustedGradingBundle with SHA-256

---

# Step 3: Validate Base/Reference

## Docker Test Execution

### TODO 3.1: Implement Docker test execution

**📍 Location:** `src/agentbench/execution/docker_runner.py:117-175`

**📝 What to do:**
Run tests in Docker container and collect results.

**💡 Why:**
Isolated, reproducible test execution.

**⚙️ How:**
```python
# The structure is there, fill in:
docker_cmd = [
    "docker",
    "run",
    "--rm",
    f"--volume={workspace_dir}:/workspace",
    "--workdir=/workspace",
    "--network=none",
    "--memory=2g",
    "--cpus=2",
    image,
    *test_command,
    "--junitxml=/workspace/results.xml",
]

import time
start_time = time.time()

result = subprocess.run(
    docker_cmd,
    capture_output=True,
    text=True,
    timeout=timeout_seconds,
)

duration = time.time() - start_time

# Parse results
tests = self._parse_junit_xml(results_file) if results_file.exists() else ()

return GradeOutcome(
    exit_code=result.returncode,
    stdout=result.stdout,
    stderr=result.stderr,
    duration_seconds=duration,
    tests=tests,
)
```

**⚠️ Common mistakes:**
- Not mounting workspace correctly
- Wrong working directory
- Forgetting network isolation
- No resource limits (container can use all CPU/memory)

**✅ Done when:**
- Tests run in container
- Results are collected
- Resource limits enforced

---

### TODO 3.2: Implement JUnit XML parsing

**📍 Location:** `src/agentbench/execution/docker_runner.py:222-245`

**📝 What to do:**
Parse test results from JUnit XML.

**⚙️ How:**
```python
# Structure is there, ensure it works:
for testcase in root.iter("testcase"):
    classname = testcase.get("classname", "")
    name = testcase.get("name", "")
    test_id = f"{classname}::{name}"

    if testcase.find("failure") is not None:
        outcome = TestOutcome.FAILED
    elif testcase.find("error") is not None:
        outcome = TestOutcome.ERROR
    elif testcase.find("skipped") is not None:
        outcome = TestOutcome.SKIPPED
    else:
        outcome = TestOutcome.PASSED

    results.append(TestResult(test_id=test_id, outcome=outcome))

return tuple(results)
```

**✅ Done when:**
- Correctly identifies passed/failed/skipped/error tests
- Returns test IDs in correct format

---

## Workspace Preparation

### TODO 3.3: Implement workspace preparation

**📍 Location:** `src/agentbench/execution/docker_runner.py:272-285`

**📝 What to do:**
Create workspace with code at specific commit + bundle.

**⚙️ How:**
```python
def prepare_workspace(
    self, repo_path: Path, commit_sha: str, bundle_dir: Path, output_dir: Path
) -> Path:
    """Prepare workspace for testing."""
    workspace = output_dir / f"workspace_{commit_sha[:8]}"
    workspace.mkdir(parents=True, exist_ok=True)

    # Extract commit using git archive
    subprocess.run(
        ["git", "--git-dir", str(repo_path), "archive", commit_sha],
        stdout=open(workspace / "archive.tar", "wb"),
        check=True,
    )

    # Extract archive
    subprocess.run(
        ["tar", "-xf", "archive.tar"],
        cwd=workspace,
        check=True,
    )

    # Remove archive
    (workspace / "archive.tar").unlink()

    # Copy bundle files on top
    import shutil
    for file in bundle_dir.rglob("*"):
        if file.is_file():
            rel_path = file.relative_to(bundle_dir)
            dest = workspace / rel_path
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, dest)

    return workspace
```

**✅ Done when:**
- Workspace has code at commit
- Bundle files overlay correctly
- Ready for Docker to mount

---

# Step 4: Run One Agent

## Agent Initialization

### TODO 4.1: Add Anthropic dependency

**📍 Location:** `src/agentbench/execution/agent.py:60`

**📝 What to do:**
Install anthropic package.

**⚙️ How:**
```bash
# In your terminal:
pip install anthropic

# Or add to pyproject.toml:
[project.optional-dependencies]
agent = ["anthropic>=0.18,<1"]

# Then:
uv sync --extra agent
```

**✅ Done when:**
- `import anthropic` works

---

### TODO 4.2: Initialize Anthropic client

**📍 Location:** `src/agentbench/execution/agent.py:64-66`

**📝 What to do:**
Create Anthropic client instance.

**⚙️ How:**
```python
def __init__(self, api_key: str):
    """Initialize Anthropic agent."""
    self.api_key = api_key

    from anthropic import Anthropic
    self.client = Anthropic(api_key=api_key)
```

**✅ Done when:**
- Client initialized without error

---

## Agent Loop

### TODO 4.3: Implement agent loop

**📍 Location:** `src/agentbench/execution/agent.py:96-122`

**📝 What to do:**
Implement the main agentic loop.

**💡 Why:**
This is the heart of the agent - iteratively calling LLM and executing tools.

**⚙️ How:**
```python
async def run(
    self, workspace: Workspace, task: AgentTask, model: str, events: EventSink
) -> AgentOutcome:
    """Run agent on a task."""

    await events.emit(workspace.run_id, "agent_started", {"model": model})

    # Build system prompt
    system_prompt = self._build_system_prompt(task)

    # Define tools
    tools = self._define_tools()

    # Conversation history
    messages = []

    # Agent loop
    max_iterations = 10
    for i in range(max_iterations):
        # Call LLM
        response = self.client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
            tools=tools,
        )

        # Add assistant response to history
        messages.append({
            "role": "assistant",
            "content": response.content,
        })

        # Check if done
        if response.stop_reason == "end_turn":
            # Agent said it's done
            break

        # Execute tools
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = self._execute_tool(
                        block.name,
                        block.input,
                        workspace
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            # Add tool results to conversation
            messages.append({
                "role": "user",
                "content": tool_results,
            })

    # Generate patch
    patch = self._generate_patch(workspace)

    await events.emit(workspace.run_id, "agent_completed", {"iterations": i + 1})

    return AgentOutcome(
        patch=patch,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        cost_usd=None,  # Calculate if needed
    )
```

**⚠️ Common mistakes:**
- Infinite loop (no max_iterations)
- Not adding tool results to conversation
- Wrong message format
- Forgetting to check stop_reason

**✅ Done when:**
- Agent iterates until done or max iterations
- Tools are executed correctly
- Patch is generated

---

## Tool Execution

### TODO 4.4-4.6: Implement tool execution

**📍 Location:** `src/agentbench/execution/agent.py:245-270`

**📝 What to do:**
The code is mostly there - ensure security checks.

**Key points:**
- Validate paths (no `..`)
- Timeout commands
- Return helpful error messages

**✅ Done when:**
- Agent can read files
- Agent can write files
- Agent can run commands
- All operations are safe

---

## Summary Statistics

**Step 1:** 41 TODOs - Database persistence (CRITICAL)
**Step 2:** 8 TODOs - Git operations (HARD)
**Step 3:** 3 TODOs - Docker validation (VERY HARD)
**Step 4:** 9 TODOs - Agent integration (EXTREMELY HARD)

**Total: 61 TODOs** across all steps

---

## General Tips

### For All TODOs:

1. **Read the comments** - They have hints
2. **Test incrementally** - Don't wait to test everything
3. **Check examples** - Bottom of each file
4. **Use the debugger** - Step through code
5. **Ask specific questions** - Include TODO number

### Testing Strategy:

```python
# For each TODO:
# 1. Implement it
# 2. Write a test
# 3. Run the test
# 4. Fix issues
# 5. Move to next TODO

# Example:
def test_compute_spec_hash():
    task = BenchmarkTaskCreate(...)
    hash1 = compute_spec_hash(task)
    hash2 = compute_spec_hash(task)
    assert hash1 == hash2  # Deterministic
    assert len(hash1) == 64  # SHA-256
```

---

## Need Help?

When stuck on a TODO:
1. **Identify it:** "TODO 1.32: compute_spec_hash"
2. **Describe what you tried:** "I wrote X but got error Y"
3. **Show the error:** Full error message
4. **Ask specific question:** "How do I make it deterministic?"

**Good luck! You've got comprehensive guidance for every single TODO!** 🚀
