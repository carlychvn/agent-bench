# AgentBench

A starter platform for comparing AI coding agents on reproducible repository
benchmarks. [Architecture](docs/architecture.md) describes the boundaries;
[implementation instructions](docs/benchmarking.md) define the full pipeline.

## 🎯 Who Is This For?

**This is a learning project for intermediate Python developers**, not absolute beginners.

### ✅ You're Ready If You Have:
- 6+ months Python experience
- Built a web API before (Flask/FastAPI)
- Basic SQL knowledge (SELECT, INSERT, UPDATE)
- Used Docker to run containers
- Comfortable reading documentation and debugging

### 📚 Essential Reading:
- **⭐ Start here!** → [START-HERE](docs/START-HERE.md) - Quick start + learning path
- **Step-by-step guide** → [Beginner Implementation Guide](docs/beginner-implementation-guide.md) - All 7 steps explained in detail
- **TODO reference** → [TODO Guide](docs/TODO-GUIDE.md) - All 61 TODOs explained with examples
- **Command cheat sheet** → [Quick Reference](docs/quick-reference.md) - Common commands & debugging

## Benchmark workflow

Turn an existing fix into a reusable task:

1. Select a repository, the **base commit** before the fix, and a known-good
   **reference commit** containing the fix and regression tests.
2. Write a natural-language prompt. Select reference test/fixture paths, exact
   **fail-to-pass** and **pass-to-pass** test IDs, a grading command and a pinned
   runtime/setup configuration.
3. A trusted worker extracts the tests, verifies they fail/pass as expected on
   base/reference, and stores an immutable grading bundle and validation evidence.
4. Evaluate models on the validated task. Each agent sees the same **base code
   and prompt**; reference solution, hidden tests and future Git history stay out
   of its environment.
5. Grade each candidate in a fresh checkout: **base + agent source changes +
   trusted tests**. Every required test must pass. The candidate need not match
   the human fix exactly.

Steps 3–5 are the intended implementation, **not currently working execution**.
This follows the historical issue/fix approach represented by
[SWE-bench's task specification](https://huggingface.co/datasets/SWE-bench/SWE-bench_Verified/blob/main/README.md).

## What exists now

- **Task contracts:** full base/reference SHAs, prompt, explicit grading paths,
  required test cohorts, command arrays and a digest-pinned Docker image.
  Paths, overlapping cohorts, identical revisions and client-forged validation
  fields are rejected. Validated responses require baseline/reference evidence
  and a grading bundle checksum.
- **API scaffold:** benchmark create/get/list/validate and evaluation create/get/
  list routes. Request validation runs; every operation returns **HTTP 501**.
  `/health` reports process liveness only.
- **MCP scaffold:** seven management tools forwarding to the same API. They do
  not create a separate execution or storage path.
- **Execution interfaces:** trusted preparation/validation, a deliberately narrow
  agent-visible task, sandbox preparation, agent execution and clean grading.
- **Frontend demo:** benchmark catalog, task authoring, task/validation detail,
  evaluation creation from a validated sample task, overview/history filters,
  comparisons, logs, test cohorts, code diff excerpts and JSON export.
- **Infrastructure:** PostgreSQL Compose configuration, Python contract/API tests
  and CI checks. There are no ORM tables or migrations yet.

Sample repositories, SHAs, image digests, validation reports, models, logs, costs
and outcomes are **fictional**. New demo tasks start **unvalidated** and cannot
be evaluated; real task validation is not implemented. Validated sample tasks can
create queued demo evaluations. State resets on refresh, runs do not advance and
no model is called. Diff excerpts are not apply-ready patches.

There is no persistence, Git cloning/extraction, validation worker, model adapter,
Docker runner or actual grading. The worker entry point reports that and exits.

## Layout

```text
apps/web/src/app/          Task/evaluation routes and shared styles
apps/web/src/components/   Forms, evidence/detail views, shell and demo provider
apps/web/src/lib/          View types, task validation and fictional fixtures
src/agentbench/domain/     Benchmark and evaluation contracts
src/agentbench/api/        HTTP route placeholders
src/agentbench/execution/  Trusted preparation, agent and grader interfaces
src/agentbench/worker/     Worker entry point
src/agentbench/mcp/        Official Python MCP SDK adapter
src/agentbench/config.py   Environment configuration
tests/                    Contract and API checks
docs/examples/            Illustrative benchmark specification
docs/benchmarking.md       Detailed implementation and acceptance instructions
compose.yaml              Local PostgreSQL
```

## Local development

Requirements: Python 3.12+, [uv](https://docs.astral.sh/uv/), Node.js 22+ and npm.
Docker Compose is needed for local PostgreSQL and the future execution service.
Run Python commands from the repository root so `.env` resolves consistently.

```sh
cp .env.example .env
uv sync --extra mcp --extra database --extra execution
uv run uvicorn agentbench.api.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: <http://localhost:8000/docs>. Health: <http://localhost:8000/health>.
Valid task/evaluation requests return 501; invalid payloads return 422.

Optional database startup (the scaffold does not connect to it):

```sh
docker compose up -d postgres
```

Frontend, in another terminal:

```sh
cd apps/web
npm install
npm run dev
```

Open <http://localhost:3000>. The UI works independently of the backend.

| Route | Purpose |
| --- | --- |
| `/` | Evaluation overview and metrics |
| `/tasks` | Benchmark task catalog and validation filters |
| `/tasks/new` | Define base/reference commits, tests and environment |
| `/tasks/[id]` | Pinned definition and baseline/reference evidence |
| `/evaluations` | Searchable/filterable evaluation history |
| `/evaluations/new` | Select a validated task and models |
| `/evaluations/[id]` | Runs, benchmark inputs, logs, test cohorts and diffs |
| `/compare` | Model metrics and matched-task links |
| `/guide` | Preview workflow and capabilities |

Try `eval-001` for passing runs, `eval-003` for unmet required tests, and
`eval-005` for an infrastructure failure. Define a task using the fictional example
and inspect its **unvalidated** state. To try evaluation creation, select an
existing **validated sample**. There is no button to fabricate real validation.
Navigate through app links to retain demo session state.

## API and MCP contracts

This intentionally replaces the original repository/task/model submission shape.
First define a task, then submit evaluations by immutable task ID. No compatibility
path is provided because persistence/execution were never implemented.

| Method | Endpoint | Intended responsibility |
| --- | --- | --- |
| POST | `/api/v1/benchmark-tasks` | Create an immutable, unvalidated task |
| GET | `/api/v1/benchmark-tasks` | Paginated task catalog |
| GET | `/api/v1/benchmark-tasks/{id}` | Definition and validation evidence |
| POST | `/api/v1/benchmark-tasks/{id}/validate` | Enqueue trusted validation |
| POST | `/api/v1/evaluations` | Evaluate a validated task with selected models |
| GET | `/api/v1/evaluations` | Paginated evaluation history |
| GET | `/api/v1/evaluations/{id}` | Task snapshot and model runs |

All seven operations are 501 placeholders today. Future evaluation creation must
return 404 for an unknown task and 409 for an unvalidated/rejected task.

The [example task JSON](docs/examples/benchmark-task.json) illustrates the creation
payload. Its repository, commits and image digest are placeholders, not runnable
inputs. Commit SHAs must be full 40-character hexadecimal values. Grading paths
are explicit repository-relative files/directories; they must not overlap.
Test commands and setup commands are argv arrays, without implicit shell parsing.
Exact test IDs depend on the runner and its result adapter.

An evaluation request becomes:

```json
{
  "benchmark_task_id": "00000000-0000-4000-8000-000000000001",
  "models": ["provider/model-a", "provider/model-b"]
}
```

Start the MCP server using the official SDK v2 `MCPServer` API:

```sh
uv run --extra mcp agentbench-mcp
```

Configure a local client with command `uv`, arguments
`["run", "--directory", "/absolute/path/to/agent-bench", "--extra", "mcp", "agentbench-mcp"]`.
Run the API separately. `AGENTBENCH_API_URL` selects its address.

Tools: `create_benchmark_task`, `get_benchmark_task`, `list_benchmark_tasks`,
`validate_benchmark_task`, `create_evaluation`, `get_evaluation`,
`list_evaluations`. Task creation takes a `specification` object matching the
example JSON; evaluation creation takes `benchmark_task_id` and `models`.
Backend failures, including 501, become MCP tool errors. These are **management**
tools; do not expose them or their credentials to evaluated agents.

Worker scaffold:

```sh
uv run agentbench-worker
```

## What to implement next

Follow [the detailed instructions](docs/benchmarking.md), in this order:

1. **Persist tasks/evaluations:** migrations, immutable task IDs/spec hashes,
   worker-owned validation evidence, artifacts and model-run attempts. Add 404/409
   gates before evaluation queuing and when workers claim runs.
2. **Extract trusted tests:** resolve both Git objects, build a reviewed test/fixture
   bundle with a manifest/hash, represent deletions and exclude reference source.
3. **Validate base/reference:** identical runtime and bundle; collect exact IDs;
   verify every fail-to-pass/pass-to-pass outcome. Infrastructure/collection errors
   do not count as expected behavioral failures.
4. **Run one agent:** expose base-only code/history and prompt, enforce resource/
   usage limits, capture candidate source changes and actions. Keep reference
   information, hidden tests and provider secrets outside the sandbox.
5. **Grade cleanly:** new base checkout, allowed candidate patch and verified test
   bundle; trusted runtime/configuration. Missing/skipped tests cannot earn success.
   Separate incorrect solutions from execution/setup/timeouts.
6. **Connect UI/MCP:** typed API transport, task validation progress, real submission,
   polling, events, structured results and complete patches. Do not silently fall
   back to fictional data when requests fail.
7. **Verify the flow:** a local two-commit repository and deterministic fake agent
   in CI. Exercise gold/unchanged/wrong patches, hidden-test tampering, missing
   results, worker recovery, artifact integrity and cleanup. Paid provider tests
   should be separate from normal CI.

The key acceptance checks: the gold source patch passes; unchanged base fails;
an agent cannot pass by deleting tests; a missing required test never passes;
all models receive the same immutable task and environment.

## Checks

```sh
uv run ruff check .
uv run ruff format --check .
uv run pytest
cd apps/web
npm run lint
npm run typecheck
npm run build
```

Python runtime tests require installed dependencies. Generate/commit `uv.lock`
when registry access is available, then use frozen Python installs in CI. Use
`npm ci` with a complete committed npm lockfile in reproducible environments.
In a restricted environment where Turbopack cannot bind its internal socket,
`npm run build -- --webpack` validates the production build. Browser previews
still require a permitted local listening port.

## Optional additions

Add these after one validated historical task runs end to end.

| Addition | When useful | Direction |
| --- | --- | --- |
| SWE-bench imports | Reuse established datasets instead of manually defining every task | Versioned task-source adapter for base commits/prompts/precomputed test patches; retain trusted validation. |
| Dataset cohorts and repeated trials | Compare agents statistically across matched tasks | Fix immutable task sets, agent configuration and budgets; report sample counts and infrastructure exclusions. |
| More providers/agent frameworks | One integration already works | Version adapters and record tool policies/settings; distinguish agent changes from model changes. |
| PostgreSQL worker scaling | One worker cannot handle the queue | Short transactional claims, leases, heartbeats, ownership-checked writes and separate retry attempts. |
| Redis / Celery | Scheduling/routing needs exceed the PostgreSQL queue | Preserve durable database state and idempotent processing before adding a broker. |
| Object storage | Multiple hosts need the same bundles/artifacts | Immutable checksummed objects, authorization, retention and verified downloads. |
| Streaming logs | Polling is too slow or expensive | SSE with ordered event cursors, reconnect/resume and a polling fallback. |
| Authentication and teams | Tasks/results are shared or private | Author/worker/agent permissions, ownership and audit records; reference access must remain evaluator-only. |
| Cancellation and budgets | Runs are long or costly | Cooperative cancellation, container termination, spend/resource limits and cleanup. |
| Stronger sandboxing | Hostile multi-tenant workloads are accepted | Dedicated hosts and hardened isolation, restricted network access and trusted grading boundaries. |
| Rich patch viewer | Real artifacts outgrow demo excerpts | Unified-patch parsing, correct old/new line numbers and binary-file handling. |
| Observability | Failures become hard to diagnose | Structured events/traces keyed by task/evaluation/run IDs, queue latency and failure metrics. |
| MCP over HTTP | Remote management clients need access | Streamable HTTP with the same authentication/authorization as the API. |

The central deliverable is a reproducible, validated benchmark with inspectable
inputs, candidate code, trusted grading evidence and comparable agent runs.
