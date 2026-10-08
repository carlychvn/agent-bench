from uuid import uuid4

import pytest
from pydantic import ValidationError

from agentbench.domain.evaluations import EvaluationCreate

VALID = {"benchmark_task_id": str(uuid4()), "models": ["provider/model"]}


@pytest.mark.parametrize(
    "changes",
    [
        {"benchmark_task_id": "not-a-uuid"},
        {"models": []},
        {"models": ["model", "model"]},
        {"models": [" "]},
        {"models": [str(index) for index in range(11)]},
        {"base_commit": "1" * 40},
        {"test_command": ["true"]},
        {"validation": {"status": "validated"}},
    ],
)
def test_rejects_ambiguous_or_overridden_inputs(changes: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        EvaluationCreate.model_validate({**VALID, **changes})


def test_multiple_models_reference_one_task() -> None:
    request = EvaluationCreate.model_validate({**VALID, "models": ["provider/a", "provider/b"]})
    assert request.models == ["provider/a", "provider/b"]
    assert str(request.benchmark_task_id) == VALID["benchmark_task_id"]
