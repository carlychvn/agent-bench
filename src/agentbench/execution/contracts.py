"""Trusted benchmark preparation and agent execution are separate boundaries."""

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from uuid import UUID

from agentbench.domain.benchmarks import (
    BenchmarkTaskCreate,
    BenchmarkValidation,
    EnvironmentSpec,
    TestOutcome,
)


@dataclass(frozen=True)
class AgentTask:
    """The complete agent-visible task; no reference SHA, hidden tests or gold patch."""

    repository_url: str
    base_commit: str
    prompt: str


@dataclass(frozen=True)
class Workspace:
    run_id: UUID
    path: Path
    commit_sha: str


@dataclass(frozen=True)
class TrustedGradingBundle:
    """Built outside the agent sandbox; immutable bytes verified before every grading run."""

    task_id: UUID
    artifact_key: str
    sha256: str
    grading_paths: tuple[str, ...]


@dataclass(frozen=True)
class AgentOutcome:
    # Candidate source changes only; the trusted grader controls protected test paths.
    patch: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    cost_usd: str | None = None


@dataclass(frozen=True)
class TestResult:
    test_id: str
    outcome: TestOutcome


@dataclass(frozen=True)
class GradeOutcome:
    exit_code: int
    stdout: str
    stderr: str
    duration_seconds: float
    tests: tuple[TestResult, ...]


class EventSink(Protocol):
    async def emit(self, run_id: UUID, kind: str, payload: dict[str, object]) -> None: ...


class BenchmarkPreparer(Protocol):
    """Extract selected tests/fixtures from the reference and validate base + reference.

    Keep the solution, reference revision, grading bundle and validation output out
    of agent-visible files, Git history and logs. Never copy the reference source
    into a candidate workspace. Reject missing tests and infrastructure failures.
    """

    async def build(
        self, task_id: UUID, specification: BenchmarkTaskCreate
    ) -> TrustedGradingBundle: ...

    async def validate(
        self, specification: BenchmarkTaskCreate, bundle: TrustedGradingBundle
    ) -> BenchmarkValidation: ...


class SandboxRunner(Protocol):
    """Prepare an agent-only base snapshot, remove future Git history and limit resources."""

    async def prepare(
        self, run_id: UUID, task: AgentTask, environment: EnvironmentSpec
    ) -> Workspace: ...

    async def cleanup(self, workspace: Workspace) -> None: ...


class CodingAgent(Protocol):
    async def run(
        self, workspace: Workspace, task: AgentTask, model: str, events: EventSink
    ) -> AgentOutcome: ...


class Grader(Protocol):
    """Grade in a new clean base checkout with candidate source changes + trusted tests.

    Verify bundle integrity, reject edits to protected grading paths, and execute
    argv without an implicit shell. Missing/skipped/error tests cannot count as
    passes. Infrastructure failures must remain distinct from incorrect solutions.
    """

    async def grade(
        self,
        run_id: UUID,
        task: BenchmarkTaskCreate,
        candidate: AgentOutcome,
        bundle: TrustedGradingBundle,
        events: EventSink,
    ) -> GradeOutcome: ...
