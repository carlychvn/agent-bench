import json
from pathlib import Path

import pytest


@pytest.fixture
def valid_task() -> dict[str, object]:
    path = Path(__file__).parents[1] / "docs/examples/benchmark-task.json"
    return json.loads(path.read_text())
