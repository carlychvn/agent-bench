# Implementing historical-fix benchmarks

This is the implementation contract for the scaffold. None of the Git extraction,
validation or execution steps below currently run. The UI supplies fictional
examples; the API/MCP validate input shapes and return HTTP 501.

## What a task means

A repository has a bug or missing feature at `base_commit`. The known-good
`reference_commit` contains its fix and tests. An author provides a prompt and
selects tests/fixtures from the reference. Agents get the base source plus prompt;
the evaluator uses the selected tests to judge their source changes.

The reference implementation is used only to establish that the benchmark is
solvable. Candidate patches can differ from the human patch and still succeed.
Choose a coherent fix/PR; do not infer a benchmark from arbitrary distant commits
whose differences include unrelated features or dependency changes.

[Example specification](examples/benchmark-task.json) is structurally valid but
uses a fictional repository, commits and image digest. Replace those with real,
reachable objects and actual collected test IDs before implementation smoke tests.

| Field | Responsibility |
| --- | --- |
| `title`, `prompt` | Describe the behavior and constraints. Tests must not assume unstated names/messages. |
| `repository_url` | Public GitHub repository containing both revisions. |
| `base_commit` | Full immutable SHA of the agent's starting code. |
| `reference_commit` | Full immutable SHA of the known-good fix; evaluator-only. |
| `grading_paths` | Explicit files/directories containing reference tests and necessary fixtures. No globs or overlapping paths. |
| `fail_to_pass` | Exact runner/parser test IDs that fail behaviorally on base and pass on reference; at least one. |
| `pass_to_pass` | Exact test IDs that pass on base/reference and must keep passing on candidates. May be empty for tasks without a regression cohort; report this coverage limitation. |
| `test_command` | Argument array; no implicit shell. Must produce structured results for the required IDs. |
| `environment.image` | Immutable Docker image reference with `@sha256:` digest. |
| `environment.setup_commands` | Bounded argument arrays to install dependencies; same configuration in baseline/reference/candidate environments. |

## 1. Persist immutable definitions

Implement SQLAlchemy/Alembic tables for task specifications, validation attempts,
evaluations, model-run attempts, events, results and artifact metadata. A stored
task ID refers to one immutable specification. Do not add an update operation
that changes the meaning of an existing validated task. Compute a canonical
specification hash including prompt, commits, paths, cohorts, commands and runtime.

`POST /api/v1/benchmark-tasks` creates an **unvalidated** definition.
`POST /api/v1/benchmark-tasks/{id}/validate` enqueues a separate validation job and
returns a **validating** state. Never accept validation reports/status from authors.
Only a trusted worker can publish validation evidence; author-supplied result
fields are rejected by the current creation schema.

`POST /api/v1/evaluations` accepts `benchmark_task_id` and `models`. Return 404
for unknown IDs and 409 unless worker evidence validates that exact specification
and bundle. Recheck this gate when a worker claims a run. Snapshot the task,
validation/bundle hashes and agent/model configuration for each evaluation.

**Acceptance:** tasks survive restarts; changing an input creates a new unvalidated
ID; attempts cannot reuse evidence for a different specification; unvalidated or
rejected tasks never reach an agent worker.

## 2. Build a trusted grading bundle

Fetch base/reference objects on the trusted preparation host. Verify they exist
in the selected public repository; do not assume matching SHA syntax proves this.
Record the resolved full SHAs and any source PR metadata. Future history/ref data
must never enter the agent sandbox.

Build an explicit test patch/tree overlay from the selected reference paths:

- Extract only reviewed tests, fixtures and required test helpers. Exclude the
  reference solution and unrelated changes. A path string alone cannot establish
  that a file is a test; enforce a preparation policy and review its manifest.
- Represent additions, modifications and deletions in selected paths. Replacing
  an entire selected directory requires deleting its old contents before restoring
  the trusted tree, so stale/agent-added grading files cannot survive.
- Reject escaping symlinks, submodules, traversal, unexpected binary files and
  unsupported fixture dependencies. Include approved binary fixtures explicitly.
- Keep setup/runtime configuration separately pinned. Reject tasks whose tests
  depend on unprovided reference-only implementation or unrelated changes.
- Store immutable bundle bytes, a manifest of paths/content hashes and SHA-256
  metadata. The candidate grader verifies those bytes before installing them.

**Acceptance:** applying the bundle to a clean base introduces only approved test
content; it does not install the fix. Bundle contents/digests remain identical
across validation and every model run.

## 3. Validate the benchmark before running agents

In isolated, fresh environments using the pinned runtime/setup:

1. Check out base; install the trusted test bundle; collect/run the grading command.
2. Check out reference; install the identical bundle; collect/run the same command.
3. Parse exact test IDs and check every required cohort member:
   - Fail-to-pass: assertion/behavior failure on base, pass on reference.
   - Pass-to-pass: pass on base and reference.
4. Save both result sets, exit codes, logs, environment metadata and bundle hash.

Collection errors, missing tests, duplicate/ambiguous IDs, skipped cases, setup
failures and timeouts cannot satisfy the expected failures. Test frameworks may
need different result adapters; begin with one explicit pytest/JUnit integration.
Normalize parameterized test IDs consistently and preserve the original IDs for
inspection. Do not score an exit code alone as complete benchmark evidence.

Set validated only when every check succeeds. For incorrect cohort expectations
or ungradeable tasks, publish rejected evidence. For transient infrastructure
failures, keep the task unvalidated, record a distinct infrastructure failure and
allow a bounded retry. The current response model also rejects a validated task
whose required baseline/reference results or bundle checksum are missing.

**Acceptance:** deliberately invalid benchmarks never validate; a known-good
reference does; a killed validation worker does not leave a falsely validated
record. Show expected-vs-observed outcomes in the dashboard.

## 4. Run an agent with base-only information

Prepare a disposable base snapshot. Keep only the base revision's permitted Git
state; remove future objects/refs/remotes and disable access to the reference
solution through network fetching, management APIs, artifact paths or logs.
A shallow checkout still requires checking which refs/objects and remotes remain.

Construct the `AgentTask` interface: repository URL, base SHA and prompt only.
Do not pass the complete `BenchmarkTaskCreate` object into `CodingAgent`. The
worker can install the agreed environment without exposing reference metadata.
Agents may inspect/run existing base tests and add development tests, but those
are not trusted grading evidence. Hold the agent implementation, budgets and tool
permissions constant when comparing model configurations; record their versions.

Capture source modifications, untracked files (with size/type limits), events and
reported usage. Preserve the original full candidate diff for review. Derive an
allowed source patch for grading and reject candidate changes to protected
paths/configuration or attempts to disable grading. The bundle is never installed
in the agent workspace before the solution is frozen.

**Acceptance:** agent-visible files/history/logs cannot reveal the future fix or
hidden grading tests; the worker captures the patch before the agent workspace is
removed; hidden artifacts and provider secrets are inaccessible to agent tools.

## 5. Grade in a fresh trusted environment

Create a new base checkout and apply only allowed candidate source changes.
Reject invalid patch application as a separate result; never replace candidate
source with the reference source. Remove protected test-tree contents and install
the verified grading bundle. Use trusted test-runner configuration and a fresh
environment rather than reusing the agent's modified container/processes.

Run setup and grading with independent limits. Parse required test IDs. A solution
resolves the task only when **all** fail-to-pass and pass-to-pass members pass.
Missing/skipped/error cases cannot count as passes. Extra development tests do
not substitute for a required test. Preserve stdout/stderr and parsed results;
separate incorrect solutions from execution/setup/timeout failures.

Record the complete candidate patch, allowed grading patch, hashes, duration,
actual tokens and nullable cost. Report infrastructure failures independently
from task success rate; publish the denominator and failure count so omitting
failed environments cannot silently inflate comparisons.

**Acceptance:** the gold source patch resolves a validated task, an unchanged base
fails, and a patch that deletes/changes grading tests cannot earn a pass. A missing
test ID or empty test suite never yields a successful resolution.

## 6. Connect frontend, MCP and CI

Replace session-only `DemoProvider` with a typed API client. Task detail reads
validation evidence; evaluation creation selects a validated task ID. Do not
silently use fixtures when requests fail. Add validation progress/error/retry
states, paginated catalogs/events, active-run polling and real patch artifacts.
Add run-detail, event, result and artifact endpoints: the current evaluation
response only declares task snapshots and run summaries, not those rich results.
Keep author/reference information available only to authorized management users,
not to the agent under test.

The MCP management tools forward task create/get/list/validate and evaluation
create/get/list to the HTTP API. Test their schemas, serialization, validation
gates and error propagation with the official SDK client. Do not give those
management tools or credentials to evaluated agents.

CI should construct a tiny local Git fixture with two commits and deterministic
regression tests. Use a fake agent producing known source patches. Exercise task
creation → extraction → base/reference validation → evaluation → grading → UI/MCP
result retrieval. Include wrong fixes, missing tests, test tampering, bad images,
crashes/recovery and cleanup. Keep paid model calls outside normal CI.

## Optional extensions

Import SWE-bench-style base commits/prompts/test patches through a task-source
adapter once this path works. Extend the specification as a versioned union if
precomputed bundles become a supported source; do not overload a reference SHA
with a file path. Other additions: datasets/cohorts, hidden test augmentation,
stronger isolation, remote workers, shared object storage, live event streaming,
provider registries and repeated trials. Add each when a concrete need appears.
