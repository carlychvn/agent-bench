from uuid import uuid4

from fastapi.testclient import TestClient

from agentbench.api.main import create_app

client = TestClient(create_app())
VALID_EVALUATION = {"benchmark_task_id": str(uuid4()), "models": ["provider/model"]}


def test_health_is_available_without_database() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_operations_do_not_claim_to_persist_or_validate(valid_task: dict[str, object]) -> None:
    responses = [
        client.post("/api/v1/benchmark-tasks", json=valid_task),
        client.get("/api/v1/benchmark-tasks"),
        client.get(f"/api/v1/benchmark-tasks/{uuid4()}"),
        client.post(f"/api/v1/benchmark-tasks/{uuid4()}/validate"),
        client.post("/api/v1/evaluations", json=VALID_EVALUATION),
        client.get("/api/v1/evaluations"),
        client.get(f"/api/v1/evaluations/{uuid4()}"),
    ]
    assert all(response.status_code == 501 for response in responses)


def test_invalid_inputs_are_rejected_before_placeholder() -> None:
    assert client.post("/api/v1/benchmark-tasks", json={}).status_code == 422
    assert client.post("/api/v1/evaluations", json={}).status_code == 422
    assert client.get("/api/v1/benchmark-tasks?limit=101").status_code == 422
    assert client.get("/api/v1/evaluations?offset=-1").status_code == 422
    assert client.post("/api/v1/benchmark-tasks/not-a-uuid/validate").status_code == 422
    assert client.get("/api/v1/evaluations/not-a-uuid").status_code == 422


def test_old_evaluation_submission_shape_is_rejected(valid_task: dict[str, object]) -> None:
    assert client.post(
        "/api/v1/evaluations", json={**valid_task, "models": ["provider/model"]}
    ).status_code == 422
