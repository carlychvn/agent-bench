from uuid import uuid4

import pytest
from pydantic import ValidationError

from agentbench.domain.benchmarks import BenchmarkTaskCreate, BenchmarkTaskRead


@pytest.mark.parametrize(
    "changes",
    [
        {"base_commit": "main"},
        {"reference_commit": "2222222"},
        {"reference_commit": "1" * 40},
        {"prompt": " "},
        {"grading_paths": []},
        {"grading_paths": ["../tests/test.py"]},
        {"grading_paths": ["/tests/test.py"]},
        {"grading_paths": ["tests\\test.py"]},
        {"grading_paths": [".git/config"]},
        {"grading_paths": ["tests/*"]},
        {"grading_paths": ["tests", "tests/test.py"]},
        {"grading_paths": ["tests", "tests"]},
        {"fail_to_pass": []},
        {"test_command": "python -m pytest"},
        {"environment": {"image": "python:3.12"}},
        {"validation": {"status": "validated"}},
    ],
)
def test_requires_reproducible_trusted_inputs(
    valid_task: dict[str, object], changes: dict[str, object]
) -> None:
    with pytest.raises(ValidationError):
        BenchmarkTaskCreate.model_validate({**valid_task, **changes})


@pytest.mark.parametrize(
    "url",
    [
        "http://github.com/owner/repository",
        "https://example.com/owner/repository",
        "https://github.com/owner/repository/tree/main",
        "https://user:secret@github.com/owner/repository",
        "https://github.com/owner/repository?token=secret",
    ],
)
def test_requires_public_repository_url_shape(valid_task: dict[str, object], url: str) -> None:
    with pytest.raises(ValidationError):
        BenchmarkTaskCreate.model_validate({**valid_task, "repository_url": url})


def test_test_groups_cannot_overlap(valid_task: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        BenchmarkTaskCreate.model_validate(
            {**valid_task, "pass_to_pass": valid_task["fail_to_pass"]}
        )


def evidence_for(spec: BenchmarkTaskCreate) -> dict[str, object]:
    return {
        "status": "validated",
        "grading_bundle_sha256": "a" * 64,
        "base_results": {
            **dict.fromkeys(spec.fail_to_pass, "failed"),
            **dict.fromkeys(spec.pass_to_pass, "passed"),
        },
        "reference_results": dict.fromkeys([*spec.fail_to_pass, *spec.pass_to_pass], "passed"),
        "errors": [],
    }


def stored_task(spec: BenchmarkTaskCreate, evidence: dict[str, object]) -> dict[str, object]:
    return {
        **spec.model_dump(mode="json"),
        "id": str(uuid4()),
        "created_at": "2026-10-07T00:00:00Z",
        "validation": evidence,
    }


def test_validated_tasks_require_baseline_and_reference_evidence(
    valid_task: dict[str, object],
) -> None:
    spec = BenchmarkTaskCreate.model_validate(valid_task)
    result = BenchmarkTaskRead.model_validate(stored_task(spec, evidence_for(spec)))
    assert result.validation.status == "validated"


@pytest.mark.parametrize("outcome", ["passed", "skipped", "error"])
def test_base_failures_must_be_behavioral_failures(
    valid_task: dict[str, object], outcome: str
) -> None:
    spec = BenchmarkTaskCreate.model_validate(valid_task)
    evidence = evidence_for(spec)
    evidence["base_results"] = dict.fromkeys([*spec.fail_to_pass, *spec.pass_to_pass], outcome)
    with pytest.raises(ValidationError):
        BenchmarkTaskRead.model_validate(stored_task(spec, evidence))


@pytest.mark.parametrize("missing", ["base_results", "reference_results", "grading_bundle_sha256"])
def test_missing_evidence_never_validates(valid_task: dict[str, object], missing: str) -> None:
    spec = BenchmarkTaskCreate.model_validate(valid_task)
    evidence = evidence_for(spec)
    evidence.pop(missing)
    with pytest.raises(ValidationError):
        BenchmarkTaskRead.model_validate(stored_task(spec, evidence))


def test_reference_and_regression_failures_reject_validation(valid_task: dict[str, object]) -> None:
    spec = BenchmarkTaskCreate.model_validate(valid_task)
    for test_id in [spec.fail_to_pass[0], spec.pass_to_pass[0]]:
        evidence = evidence_for(spec)
        evidence["reference_results"] = {
            **dict.fromkeys([*spec.fail_to_pass, *spec.pass_to_pass], "passed"),
            test_id: "failed",
        }
        with pytest.raises(ValidationError):
            BenchmarkTaskRead.model_validate(stored_task(spec, evidence))


def test_existing_tests_must_already_pass_on_base(valid_task: dict[str, object]) -> None:
    spec = BenchmarkTaskCreate.model_validate(valid_task)
    evidence = evidence_for(spec)
    evidence["base_results"] = dict.fromkeys([*spec.fail_to_pass, *spec.pass_to_pass], "failed")
    with pytest.raises(ValidationError):
        BenchmarkTaskRead.model_validate(stored_task(spec, evidence))


def test_full_commit_shas_are_canonicalized(valid_task: dict[str, object]) -> None:
    task = BenchmarkTaskCreate.model_validate({**valid_task, "base_commit": "A" * 40})
    assert task.base_commit == "a" * 40
