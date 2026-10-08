"""Immutable benchmark specifications and validation evidence.

A stored task ID identifies one immutable specification. Changing any input creates
another task ID and requires fresh validation. Reference data is evaluator-only.
"""

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Self
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    StringConstraints,
    field_validator,
    model_validator,
)

NonEmptyText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
CommitSHA = Annotated[
    str, StringConstraints(strip_whitespace=True, to_lower=True, pattern=r"^[0-9a-fA-F]{40}$")
]
SHA256 = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{64}$")]
Command = Annotated[list[NonEmptyText], Field(min_length=1, max_length=100)]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EnvironmentSpec(Contract):
    # Resolve tags outside the task editor; persisted tasks use an immutable digest.
    image: Annotated[NonEmptyText, Field(pattern=r"^[^\s@]+@sha256:[0-9a-f]{64}$")]
    setup_commands: Annotated[list[Command], Field(max_length=20)] = Field(default_factory=list)


class BenchmarkTaskCreate(Contract):
    title: Annotated[NonEmptyText, Field(max_length=200)]
    repository_url: HttpUrl
    base_commit: CommitSHA
    reference_commit: CommitSHA
    prompt: Annotated[NonEmptyText, Field(max_length=50_000)]
    grading_paths: Annotated[list[NonEmptyText], Field(min_length=1, max_length=100)]
    fail_to_pass: Annotated[list[NonEmptyText], Field(min_length=1, max_length=1000)]
    pass_to_pass: Annotated[list[NonEmptyText], Field(max_length=1000)]
    test_command: Command
    environment: EnvironmentSpec

    @field_validator("repository_url")
    @classmethod
    def validate_repository(cls, value: HttpUrl) -> HttpUrl:
        parts = value.path.strip("/").split("/") if value.path else []
        if (
            value.scheme != "https"
            or value.host != "github.com"
            or value.port not in (None, 443)
            or value.username is not None
            or value.password is not None
            or value.query is not None
            or value.fragment is not None
            or len(parts) != 2
            or any(not part or part in {".", ".."} for part in parts)
        ):
            raise ValueError("Use https://github.com/owner/repository")
        # Public visibility and object reachability require the future repository resolver.
        return value

    @field_validator("grading_paths")
    @classmethod
    def validate_paths(cls, paths: list[str]) -> list[str]:
        for path in paths:
            parts = path.split("/")
            if (
                any(part in {"", ".", ".."} or part.lower() == ".git" for part in parts)
                or any(character in path for character in "\\\x00:*?[]")
            ):
                raise ValueError("Grading paths must be explicit repository-relative paths")
        if len(set(paths)) != len(paths):
            raise ValueError("Grading paths must be unique")
        if any(a != b and b.startswith(f"{a}/") for a in paths for b in paths):
            raise ValueError("Grading paths must not overlap; list the directory or its files")
        return paths

    @field_validator("fail_to_pass", "pass_to_pass")
    @classmethod
    def unique_tests(cls, tests: list[str]) -> list[str]:
        if len(set(tests)) != len(tests):
            raise ValueError("Required test identifiers must be unique")
        return tests

    @model_validator(mode="after")
    def validate_task(self) -> Self:
        if self.base_commit == self.reference_commit:
            raise ValueError("Base and reference commits must differ")
        if set(self.fail_to_pass) & set(self.pass_to_pass):
            raise ValueError("A test cannot belong to both fail-to-pass and pass-to-pass")
        return self


class ValidationStatus(StrEnum):
    UNVALIDATED = "unvalidated"
    VALIDATING = "validating"
    VALIDATED = "validated"
    REJECTED = "rejected"


class TestOutcome(StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class BenchmarkValidation(Contract):
    status: ValidationStatus = ValidationStatus.UNVALIDATED
    # Worker-owned evidence. Clients cannot set these on BenchmarkTaskCreate.
    grading_bundle_sha256: SHA256 | None = None
    base_results: dict[str, TestOutcome] = Field(default_factory=dict)
    reference_results: dict[str, TestOutcome] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)


class BenchmarkTaskRead(BenchmarkTaskCreate):
    id: UUID
    created_at: datetime
    validation: BenchmarkValidation

    @model_validator(mode="after")
    def validate_evidence(self) -> Self:
        if self.validation.status != ValidationStatus.VALIDATED:
            return self
        evidence = self.validation
        if not evidence.grading_bundle_sha256 or evidence.errors:
            raise ValueError("Validated tasks require a grading bundle and error-free evidence")
        for test_id in self.fail_to_pass:
            if (
                evidence.base_results.get(test_id) != TestOutcome.FAILED
                or evidence.reference_results.get(test_id) != TestOutcome.PASSED
            ):
                raise ValueError("Every fail-to-pass test must fail on base and pass on reference")
        for test_id in self.pass_to_pass:
            if (
                evidence.base_results.get(test_id) != TestOutcome.PASSED
                or evidence.reference_results.get(test_id) != TestOutcome.PASSED
            ):
                raise ValueError("Every pass-to-pass test must pass on both revisions")
        return self


class BenchmarkTaskPage(Contract):
    items: list[BenchmarkTaskRead]
    limit: int
    offset: int
    total: int
