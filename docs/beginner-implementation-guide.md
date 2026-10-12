# Beginner implementation guide

This guide walks through the exact **“What to implement next”** list from the
[README](../README.md#what-to-implement-next), with beginner explanations and
learning links. The formal contract remains [benchmarking.md](benchmarking.md);
the system picture is [architecture.md](architecture.md).

**Do the seven steps in order.** Do not start agents or Docker grading until
Step 1 (persist) works end to end.

---

## The seven steps (same as the README)

1. [Persist tasks/evaluations](#step-1--persist-tasksevaluations)
2. [Extract trusted tests](#step-2--extract-trusted-tests)
3. [Validate base/reference](#step-3--validate-basereference)
4. [Run one agent](#step-4--run-one-agent)
5. [Grade cleanly](#step-5--grade-cleanly)
6. [Connect UI/MCP](#step-6--connect-uimcp)
7. [Verify the flow](#step-7--verify-the-flow)

How to use each step:

1. Read the **README requirement** (quoted verbatim).
2. Read **What this means** (plain English).
3. Skim **Learn these concepts** before coding.
4. Follow **What to build**.
5. Stop at **Done when** before the next step.

| Step | Beginner estimate |
| --- | --- |
| Before you start | half day |
| 1 Persist | several days |
| 2 Extract trusted tests | several days |
| 3 Validate base/reference | several days |
| 4 Run one agent | a week+ |
| 5 Grade cleanly | several days |
| 6 Connect UI/MCP | a few days |
| 7 Verify the flow | a few days |

Steps 2–5 are substantially harder than Step 1.

---

## Before you start — Setup and vocabulary

### What you should already have running

From the [README local development](../README.md#local-development) section:

```sh
# Repo root
cp .env.example .env
uv sync --extra mcp --extra database --extra execution

# API
uv run uvicorn agentbench.api.main:app --reload --host 127.0.0.1 --port 8000

# Postgres (Compose). If port 5432 is busy, use 5433 in compose.yaml and .env
docker compose up -d postgres

# Frontend (separate terminal)
cd apps/web && npm install && npm run dev -- --webpack
```

Useful URLs:

- API health: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs
- Frontend demo: http://localhost:3000

Today, valid task/evaluation API calls return **HTTP 501** (not implemented).
Invalid payloads return **422**. The UI uses **fake sample data** and does not
call the API.

### Plain-English vocabulary

| Term | Meaning |
| --- | --- |
| **Benchmark task** | A frozen recipe: repo + base commit + prompt + which tests count |
| **Base commit** | Broken / incomplete code the agent starts from |
| **Reference commit** | Known-good fix + tests (evaluator only — agent must not see this) |
| **Fail-to-pass (F2P)** | Tests that fail on base and pass on reference (the bug being fixed) |
| **Pass-to-pass (P2P)** | Tests that already pass and must keep passing (no regressions) |
| **Grading bundle** | Extracted trusted tests/fixtures used to score candidates |
| **Evaluation** | “Run these models on this validated task” |
| **Run / model-run attempt** | One model’s attempt |
| **Immutable** | After create, you don’t edit a task; you create a new one |
| **Worker** | Background process that validates tasks and runs agents/graders |
| **501** | “Scaffold only — not built yet” |
| **404** | Not found |
| **409** | Found, but not allowed in this state (e.g. task not validated) |
| **422** | Request body failed validation |

### Learn these concepts (before Step 1)

| Topic | Why you need it | Resource |
| --- | --- | --- |
| HTTP status codes | 404 / 409 / 422 / 501 | [MDN HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) |
| REST APIs | What the FastAPI routes are | [MDN: What is a REST API?](https://developer.mozilla.org/en-US/docs/Glossary/REST) |
| JSON | Request/response bodies | [MDN: Working with JSON](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON) |
| Git commits / SHAs | Base vs reference revisions | [Git Basics — Recording Changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository) |
| Docker (overview) | Later steps use containers | [Docker Get Started](https://docs.docker.com/get-started/) |
| uv (Python tooling) | This repo uses `uv` | [uv docs](https://docs.astral.sh/uv/) |
| FastAPI intro | The HTTP server | [FastAPI first steps](https://fastapi.tiangolo.com/tutorial/first-steps/) |
| Pydantic models | Domain contracts already use these | [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/) |

### Files to open and just read

| File | Why |
| --- | --- |
| [examples/benchmark-task.json](examples/benchmark-task.json) | Example create payload (fictional SHAs — not runnable yet) |
| `src/agentbench/domain/benchmarks.py` | What a task looks like in code |
| `src/agentbench/domain/evaluations.py` | What an evaluation looks like |
| `src/agentbench/api/routes/benchmarks.py` | Routes that currently raise 501 |
| `src/agentbench/api/routes/evaluations.py` | Same for evaluations |
| `src/agentbench/execution/contracts.py` | Interfaces for later steps |

### Done when

- [ ] `/health` returns `{"status":"ok"}`
- [ ] `/docs` loads
- [ ] Frontend opens (use `--webpack` if Turbopack fails)
- [ ] You can explain base vs reference vs F2P vs P2P in one sentence each

---

## Step 1 — Persist tasks/evaluations

> **README:** Persist tasks/evaluations: migrations, immutable task IDs/spec
> hashes, worker-owned validation evidence, artifacts and model-run attempts.
> Add 404/409 gates before evaluation queuing and when workers claim runs.

**Contract:** [benchmarking.md §1](benchmarking.md#1-persist-immutable-definitions)  
**Also:** [architecture.md — Backend](architecture.md#components)

### What this means

Right now the API accepts a task JSON, checks the shape, then says 501 and
throws the data away. You need a **database** so that:

1. Creating a task **saves** it with status `unvalidated`
2. Listing/getting tasks read from the database
3. Asking to validate sets status `validating` (real validation is Step 3)
4. Creating an evaluation only works if the task is **validated** (404 if missing, 409 if not validated)
5. Restarting the API does **not** lose data
6. Spec hashes, validation evidence, artifacts, and model-run attempts are stored for later workers

There is **no update endpoint**. If the author changes the prompt or tests, they
create a **new** task ID.

### Learn these concepts (Step 1)

| Topic | Why | Resource |
| --- | --- | --- |
| PostgreSQL basics | Where rows live | [PostgreSQL tutorial](https://www.postgresqltutorial.com/) · [Postgres docs](https://www.postgresql.org/docs/current/tutorial.html) |
| Tables / primary keys / foreign keys | How tasks relate to evaluations | [PostgreSQL: Foreign Keys](https://www.postgresql.org/docs/current/tutorial-fk.html) |
| SQLAlchemy 2.0 ORM | Python ↔ tables | [SQLAlchemy ORM quick start](https://docs.sqlalchemy.org/en/20/orm/quickstart.html) |
| Sessions / engines | How the API talks to Postgres | [Session basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html) |
| Alembic migrations | Versioned schema changes (“migrations”) | [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html) |
| FastAPI dependencies | Inject a DB session into routes | [FastAPI: Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) |
| FastAPI bigger apps | Routers (already started) | [Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) |
| UUIDs | Immutable task / evaluation / run IDs | [Python uuid](https://docs.python.org/3/library/uuid.html) |
| Hashing (SHA-256) | Spec hashes (and later bundle hashes) | [hashlib](https://docs.python.org/3/library/hashlib.html) |
| HTTP 404 vs 409 | Gates before evaluation queuing | [404](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404) · [409](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/409) |
| pytest + FastAPI | Update API tests | [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/) · [pytest](https://docs.pytest.org/) |

Optional deps are already declared in `pyproject.toml` under
`[project.optional-dependencies] database` (SQLAlchemy, psycopg, Alembic).

### What to build

#### 1. Database connection helper

Create something like:

```text
src/agentbench/db/__init__.py
src/agentbench/db/session.py
src/agentbench/db/models.py
```

In `session.py`:

- Read `get_settings().database_url` from `src/agentbench/config.py`
- Create an engine and session factory
- Provide a FastAPI dependency `get_db()` that yields a session and closes it

Settings already load `.env` with prefix `AGENTBENCH_`. Your URL should match
Compose (e.g. `localhost:5433` if you remapped the port).

#### 2. Tables (models) — migrations target

Cover what the README lists: tasks, worker-owned validation evidence, artifacts,
and model-run attempts.

**`benchmark_tasks`** (immutable task IDs + spec)

| Column idea | Comes from |
| --- | --- |
| `id` (UUID, PK) | Immutable task ID |
| `created_at` | `BenchmarkTaskRead.created_at` |
| Spec fields | Everything on `BenchmarkTaskCreate` |
| `specification_hash` | Canonical hash of the create payload |
| `validation_status` | `unvalidated` / `validating` / `validated` / `rejected` |
| `grading_bundle_sha256` | Worker-owned; null until filled |
| `base_results`, `reference_results` | Worker-owned evidence maps |
| `validation_errors` | Worker-owned error list |

Nested/list fields can start as **JSON columns**
([SQLAlchemy JSON](https://docs.sqlalchemy.org/en/20/core/type_basics.html#sqlalchemy.types.JSON)).

**`evaluations`**

- `id`, `created_at`, `benchmark_task_id` (FK), `models` (JSON list)
- Snapshot of task / spec / bundle hashes for the evaluation

**`runs`** (model-run attempts)

- `id`, `evaluation_id` (FK), `model`, `status` (start as `queued`)

**`artifacts`** (and optionally `events`)

- Metadata for stored bytes (bundle, patches, logs): key, sha256, kind, run/task id

Clients never write validation evidence; only the trusted worker may.

#### 3. Migrations with Alembic

```sh
uv run alembic init alembic
```

Then point Alembic at your metadata and `database_url`, autogenerate a revision,
and upgrade:

```sh
uv run alembic revision --autogenerate -m "create tasks evaluations runs artifacts"
uv run alembic upgrade head
```

Follow the [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
carefully for the `env.py` wiring — this is where beginners usually get stuck.

#### 4. Implement the seven routes (replace 501)

**File:** `src/agentbench/api/routes/benchmarks.py`

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/v1/benchmark-tasks` | Insert row, status `unvalidated`, empty evidence → `BenchmarkTaskRead` |
| GET | `/api/v1/benchmark-tasks` | Paginate → `BenchmarkTaskPage` |
| GET | `/api/v1/benchmark-tasks/{id}` | Return task or **404** |
| POST | `/api/v1/benchmark-tasks/{id}/validate` | Missing → **404**; else `validating` (enqueue job later) |

**File:** `src/agentbench/api/routes/evaluations.py`

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/v1/evaluations` | Unknown task → **404**; not validated → **409**; else create evaluation + one run per model |
| GET | `/api/v1/evaluations` | Paginate |
| GET | `/api/v1/evaluations/{id}` | Return or **404** |

**404/409 gates:** apply on evaluation create **and again** when a worker claims a
run (re-check the task is still validated for that exact spec/bundle).

#### 5. Spec hash

Canonical hash of prompt, commits, paths, cohorts, commands, runtime. Same inputs
→ same hash; any change → new task. Use [`hashlib`](https://docs.python.org/3/library/hashlib.html)
over deterministic JSON (sorted keys).

#### 6. Update tests

`tests/test_api.py` currently expects **501**. After persistence:

- Valid create → success + `validation.status == "unvalidated"`
- Bad body → still **422**
- Missing id → **404**
- Eval on unvalidated task → **409**

### How to manually verify

1. Restart API after migrations.
2. POST [examples/benchmark-task.json](examples/benchmark-task.json) via `/docs`.
3. GET the returned `id`.
4. Restart the API; GET again — data must still be there.
5. POST validate → `validating`.
6. POST evaluation → **409** until a worker marks the task `validated`.

### Done when ([§1 acceptance](benchmarking.md#1-persist-immutable-definitions))

- [ ] Migrations applied; tasks/evaluations/runs/artifacts persist
- [ ] Immutable task IDs; changing inputs creates a new ID (no update API)
- [ ] Spec hashes stored
- [ ] Validation evidence columns exist and are worker-owned (clients cannot forge them)
- [ ] 404/409 gates on evaluation queuing (and designed for worker claim-time recheck)
- [ ] `uv run pytest` passes for updated API tests

**Do not start Step 2 until this checklist is green.**

---

## Step 2 — Extract trusted tests

> **README:** Extract trusted tests: resolve both Git objects, build a reviewed
> test/fixture bundle with a manifest/hash, represent deletions and exclude
> reference source.

**Contract:** [benchmarking.md §2](benchmarking.md#2-build-a-trusted-grading-bundle)  
**Interface:** `BenchmarkPreparer.build` in `src/agentbench/execution/contracts.py`

### What this means

The reference commit contains the fix **and** the tests. For grading you only want
the **tests/fixtures** listed in `grading_paths` — not the fixed application code.
Resolve both Git objects, extract those paths into an immutable **bundle** with a
manifest and hash, including deletions so stale files cannot linger.

### Learn these concepts (Step 2)

| Topic | Why | Resource |
| --- | --- | --- |
| Cloning / fetching Git objects | Resolve base + reference | [git clone](https://git-scm.com/docs/git-clone) · [git fetch](https://git-scm.com/docs/git-fetch) |
| `git show` / archive paths | Read files at a commit | [git show](https://git-scm.com/docs/git-show) · [git archive](https://git-scm.com/docs/git-archive) |
| Tree vs commit | What you’re extracting | [Git Internals — Git Objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) |
| Filesystem safety | No path traversal / symlink escape | [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal) |
| SHA-256 manifests | Bundle integrity | [hashlib](https://docs.python.org/3/library/hashlib.html) |
| Unified diffs / patches | Represent adds/modifies/deletes | [GNU diffutils](https://www.gnu.org/software/diffutils/manual/html_node/What-a-Patch-Looks-Like.html) |

### What to build

Implement `BenchmarkPreparer.build` (e.g. `src/agentbench/execution/prepare.py`):

1. Resolve `repository_url`, `base_commit`, and `reference_commit` (objects must exist).
2. From the **reference** tree only, extract reviewed `grading_paths`.
3. Build a manifest: path + content hash; represent additions, modifications, **deletions**.
4. **Exclude reference source** (the human fix / app code outside approved test paths).
5. Reject unsafe content: escaping symlinks, `..`, unexpected binaries (unless approved).
6. Store immutable bytes + `sha256`; return `TrustedGradingBundle`.

Worker stub today: `src/agentbench/worker/main.py` (logs and exits). It should
call `build`, then Step 3’s `validate`.

### Done when ([§2 acceptance](benchmarking.md#2-build-a-trusted-grading-bundle))

- [ ] Both Git objects resolved (not just SHA syntax)
- [ ] Bundle + manifest/hash for reviewed tests/fixtures
- [ ] Deletions represented; reference solution excluded
- [ ] Bundle on clean base adds only approved test content — not the fix
- [ ] Same digest every time for the same task

---

## Step 3 — Validate base/reference

> **README:** Validate base/reference: identical runtime and bundle; collect
> exact IDs; verify every fail-to-pass/pass-to-pass outcome. Infrastructure/
> collection errors do not count as expected behavioral failures.

**Contract:** [benchmarking.md §3](benchmarking.md#3-validate-the-benchmark-before-running-agents)  
**Interface:** `BenchmarkPreparer.validate`

### What this means

Before any model runs, prove the task is fair and solvable using the **same**
pinned runtime and **same** bundle:

1. Clean base + bundle → every F2P **fails** (behaviorally), every P2P **passes**
2. Clean reference + identical bundle → every F2P **passes**, every P2P **passes**
3. Only then set status `validated` and store worker-owned evidence

Pull failures, timeouts, missing tests, skips, and collection errors are
**infrastructure/collection** problems — they must **not** count as the expected
F2P behavioral failure.

### Learn these concepts (Step 3)

| Topic | Why | Resource |
| --- | --- | --- |
| Docker images / digests | Identical pinned runtime | [Image digests](https://docs.docker.com/engine/reference/commandline/pull/#pull-an-image-by-digest-from-docker-hub) |
| Running containers | Isolated base/reference runs | [docker run](https://docs.docker.com/engine/reference/commandline/run/) |
| Python Docker SDK | Optional `execution` extra | [docker-py](https://docker-py.readthedocs.io/) |
| pytest | First suggested runner | [pytest docs](https://docs.pytest.org/) |
| JUnit XML | Collect exact test IDs | [pytest junitxml](https://docs.pytest.org/en/stable/how-to/output.html#creating-junitxml-format-files) |
| Job claiming | Worker validates separately from API | [SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE) · [architecture scheduling](architecture.md#scheduling-and-extension-points) |

### What to build

1. Worker claims a validation job for a `validating` task.
2. Identical image, setup commands, and bundle on base and on reference.
3. Collect/parse **exact** required test IDs; verify every F2P and P2P outcome.
4. Write `grading_bundle_sha256`, `base_results`, `reference_results`, `errors`.
5. Set `validated` or `rejected`, or leave `unvalidated` + retryable infra failure.

Domain evidence rules live in `BenchmarkTaskRead` validators in
`domain/benchmarks.py`.

### Done when ([§3 acceptance](benchmarking.md#3-validate-the-benchmark-before-running-agents))

- [ ] Identical runtime + bundle used for base and reference
- [ ] Every F2P/P2P ID checked; exact IDs collected
- [ ] Infra/collection errors do not satisfy expected F2P failures
- [ ] Known-good fixture validates; bad cohorts reject
- [ ] Killed worker never leaves a false `validated`

---

## Step 4 — Run one agent

> **README:** Run one agent: expose base-only code/history and prompt, enforce
> resource/usage limits, capture candidate source changes and actions. Keep
> reference information, hidden tests and provider secrets outside the sandbox.

**Contract:** [benchmarking.md §4](benchmarking.md#4-run-an-agent-with-base-only-information)  
**Interfaces:** `AgentTask`, `SandboxRunner`, `CodingAgent`, `EventSink` in
`execution/contracts.py`

### What this means

The agent may only see **base code/history** and the **prompt**. Capture its
source changes and actions under resource/usage limits. Keep reference data,
hidden grading tests, and provider secrets **outside** the sandbox.

### Learn these concepts (Step 4)

| Topic | Why | Resource |
| --- | --- | --- |
| Shallow clones / history leakage | Base-only history | [git clone --depth](https://git-scm.com/docs/git-clone) — still audit refs/remotes |
| Unified diffs | Capture candidate source changes | [diff / patch](https://www.gnu.org/software/diffutils/manual/html_node/Overview.html) |
| Sandboxing / limits | Resource and isolation | [Docker Engine security](https://docs.docker.com/engine/security/) |
| LLM provider APIs (one only) | First real agent | Pick one vendor’s official docs; keep adapter thin |
| Protocol typing | Why `CodingAgent` is a Protocol | [typing.Protocol](https://docs.python.org/3/library/typing.html#typing.Protocol) |
| SWE-bench (context) | Historical-fix benchmarks | [SWE-bench Verified README](https://huggingface.co/datasets/SWE-bench/SWE-bench_Verified/blob/main/README.md) |

### What to build

1. `SandboxRunner.prepare`: disposable base workspace; strip future refs; enforce limits.
2. `AgentTask(repository_url, base_commit, prompt)` only — not full `BenchmarkTaskCreate`.
3. `CodingAgent.run`: tools inside sandbox; emit actions/events; return `AgentOutcome`.
4. Capture full candidate diff; derive allowed grading patch; reject protected-path edits.
5. Do **not** install the grading bundle before the solution is frozen.
6. Keep reference info, hidden tests, and provider secrets outside the sandbox.
7. `cleanup` after capture; wire into `src/agentbench/worker/main.py`.

### Done when ([§4 acceptance](benchmarking.md#4-run-an-agent-with-base-only-information))

- [ ] Agent sees base-only code/history + prompt
- [ ] Resource/usage limits enforced; changes and actions captured
- [ ] Reference info, hidden tests, and secrets inaccessible
- [ ] Patch captured before workspace deletion

---

## Step 5 — Grade cleanly

> **README:** Grade cleanly: new base checkout, allowed candidate patch and
> verified test bundle; trusted runtime/configuration. Missing/skipped tests
> cannot earn success. Separate incorrect solutions from execution/setup/timeouts.

**Contract:** [benchmarking.md §5](benchmarking.md#5-grade-in-a-fresh-trusted-environment)  
**Interface:** `Grader` in `execution/contracts.py`

### What this means

Never trust the agent’s container. Always: **new base checkout** + **allowed
candidate patch** + **verified test bundle** on the **trusted** runtime. A
solution succeeds only when every required test **passes**. Missing/skipped/
error tests cannot count as success. Wrong answers and infra failures must stay
separate in metrics.

### Learn these concepts (Step 5)

| Topic | Why | Resource |
| --- | --- | --- |
| `git apply` / `patch` | Apply allowed candidate changes | [git apply](https://git-scm.com/docs/git-apply) |
| Per-test results vs exit codes | Missing/skipped ≠ pass | Same JUnit/pytest parsing as Step 3 |
| Metrics integrity | Separate incorrect vs timeouts/setup | [benchmarking.md §5](benchmarking.md#5-grade-in-a-fresh-trusted-environment) |

### What to build

Implement `Grader.grade` → `GradeOutcome`:

1. Fresh base checkout (not the agent workspace).
2. Apply only the allowed candidate source patch (reject bad applies separately).
3. Install verified bundle (check digest) + trusted setup/`test_command`.
4. Parse required IDs; all F2P + P2P must pass; missing/skipped/error ≠ success.
5. Persist patches, hashes, duration, tokens, nullable cost.
6. Record incorrect solutions separately from execution/setup/timeouts.

### Done when ([§5 acceptance](benchmarking.md#5-grade-in-a-fresh-trusted-environment))

- [ ] New base + allowed patch + verified bundle on trusted runtime
- [ ] Gold patch passes; unchanged base fails
- [ ] Missing/skipped tests cannot earn success
- [ ] Test-tampering patches cannot pass
- [ ] Incorrect solutions separated from execution/setup/timeouts

---

## Step 6 — Connect UI/MCP

> **README:** Connect UI/MCP: typed API transport, task validation progress,
> real submission, polling, events, structured results and complete patches.
> Do not silently fall back to fictional data when requests fail.

**Contract:** [benchmarking.md §6](benchmarking.md#6-connect-frontend-mcp-and-ci) (UI/MCP half)

### What this means

Replace the Next.js session demo (`DemoProvider` + `demo-data.ts`) with a
**typed** client that talks to your real API: validation progress, real
submissions, polling, events, structured results, and complete patches.
When the API fails, **show an error** — never silently use fictional fixtures.
MCP already forwards to the HTTP API; test it once routes work.

### Learn these concepts (Step 6)

| Topic | Why | Resource |
| --- | --- | --- |
| `fetch` | Typed API transport from the browser | [MDN fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) |
| CORS | Cross-origin browser calls | [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) — `AGENTBENCH_CORS_ORIGINS` |
| Next.js App Router | Page structure | [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation) |
| React effects | Polling validation / run progress | [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) |
| TypeScript | Typed client | [TS handbook](https://www.typescriptlang.org/docs/handbook/intro.html) |
| MCP | Management tools | [MCP introduction](https://modelcontextprotocol.io/introduction) · [Python SDK](https://github.com/modelcontextprotocol/python-sdk) |

### What to build

1. Typed API client (e.g. `apps/web/src/lib/api.ts`) for task/evaluation endpoints.
2. Replace `DemoProvider` so catalogs, validation progress, and submissions are real.
3. Polling for validation/runs; surface events, structured results, complete patches.
4. Add richer API endpoints as needed (run detail, events, artifacts) beyond summary `EvaluationRead`.
5. **No silent fixture fallback** on request failure.
6. Test MCP schemas and 404/409/error propagation (`src/agentbench/mcp/server.py`).

### Files you’ll touch

| File | Role |
| --- | --- |
| `apps/web/src/components/demo-provider.tsx` | Replace session demo state |
| `apps/web/src/lib/demo-data.ts` | Remove or quarantine fixtures |
| `apps/web/src/lib/types.ts` | Align with API types |
| `src/agentbench/mcp/server.py` | Already forwards; add tests |

### Done when

- [ ] Typed transport; real task/eval submission
- [ ] Validation progress + polling visible in UI
- [ ] Events, structured results, and complete patches available
- [ ] Failed requests show errors — never fictional success data
- [ ] MCP create/list/validate/eval works against the live API

---

## Step 7 — Verify the flow

> **README:** Verify the flow: a local two-commit repository and deterministic
> fake agent in CI. Exercise gold/unchanged/wrong patches, hidden-test
> tampering, missing results, worker recovery, artifact integrity and cleanup.
> Paid provider tests should be separate from normal CI.

**Contract:** [benchmarking.md §6](benchmarking.md#6-connect-frontend-mcp-and-ci) (CI half)

### What this means

Automate the full pipeline on a **tiny local two-commit repo** with a
**deterministic fake agent** (no paid APIs in normal CI). Assert the acceptance
cases below so regressions cannot sneak in.

### Learn these concepts (Step 7)

| Topic | Why | Resource |
| --- | --- | --- |
| GitHub Actions | `.github/workflows/checks.yml` already exists | [GitHub Actions quickstart](https://docs.github.com/en/actions/writing-workflows/quickstart) |
| Test fixtures | Tiny repos on disk | [pytest tmp_path](https://docs.pytest.org/en/stable/how-to/tmp_path.html) |
| Deterministic fakes | Fake agent, no flaky model calls | [pytest monkeypatch](https://docs.pytest.org/en/stable/how-to/monkeypatch.html) |

### What to build / exercise

Pipeline: create → extract → validate → evaluate → grade → read results (UI/MCP).

Required cases (from the README):

- [ ] **Gold** patch passes
- [ ] **Unchanged** base fails
- [ ] **Wrong** patch fails
- [ ] **Hidden-test tampering** fails
- [ ] **Missing results** never count as success
- [ ] **Worker recovery** after crash does not corrupt state
- [ ] **Artifact integrity** (checksums) and **cleanup**
- [ ] Paid provider tests live in a **separate** job/workflow — not normal CI

Also: all models share the same immutable task and environment.

### Done when

- [ ] Local two-commit fixture + fake agent run in CI
- [ ] Cases above are asserted (not only happy path)
- [ ] No paid model calls in the default CI path

---

## Optional work (only after one real end-to-end task)

See [README optional additions](../README.md#optional-additions) and
[benchmarking.md optional extensions](benchmarking.md#optional-extensions).

| Idea | Learn more |
| --- | --- |
| SWE-bench imports | [SWE-bench Verified](https://huggingface.co/datasets/SWE-bench/SWE-bench_Verified/blob/main/README.md) |
| Redis / Celery | [Celery first steps](https://docs.celeryq.dev/en/stable/getting-started/first-steps-with-celery.html) |
| Object storage | [AWS S3 docs](https://docs.aws.amazon.com/s3/) — checksummed artifacts |
| SSE streaming | [MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) |
| Auth | [FastAPI security](https://fastapi.tiangolo.com/tutorial/security/) |
| Stronger sandboxing | [Docker security](https://docs.docker.com/engine/security/) |

---

## Suggested weekly plan (beginner)

| Week | Focus |
| --- | --- |
| 1 | Before you start + Step 1 through tasks create/get/list |
| 2 | Finish Step 1 (validate enqueue, evaluations, 404/409, tests) |
| 3–4 | Steps 2 + 3 on a tiny local git fixture |
| 5–6 | Step 4 with a **fake** agent first, then one real provider |
| 7 | Step 5 grading + Step 7 CI cases |
| 8 | Step 6 UI/MCP polish |

Prefer a **tiny local two-commit repo** until the pipeline works.

---

## Quick reference — where code lives

| Concern | Location |
| --- | --- |
| Task/eval contracts | `src/agentbench/domain/` |
| HTTP routes | `src/agentbench/api/routes/` |
| DB (you create) | `src/agentbench/db/` |
| Migrations (you create) | `alembic/` |
| Prep / agent / grade interfaces | `src/agentbench/execution/contracts.py` |
| Worker process | `src/agentbench/worker/main.py` |
| MCP tools | `src/agentbench/mcp/server.py` |
| Frontend demo | `apps/web/src/` |
| Example payload | `docs/examples/benchmark-task.json` |
| Contract text | `docs/benchmarking.md` |
| Architecture | `docs/architecture.md` |
| README step list | [What to implement next](../README.md#what-to-implement-next) |

---

## When you get stuck

1. Re-read the matching `benchmarking.md` section — it is the acceptance authority.
2. Confirm you finished earlier steps (especially Step 1).
3. Reproduce with the smallest fixture (two commits, one test).
4. Use `/docs` and pytest before touching the UI.
5. Ask for help with: the **step number**, the acceptance line that fails, and the exact error.

You do not need optional README features to finish the core product. The
deliverable is one reproducible validated benchmark with inspectable inputs,
candidate patches, trusted grading evidence, and comparable runs.
