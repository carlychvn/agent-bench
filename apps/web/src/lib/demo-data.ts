import type {
  BenchmarkTask,
  Evaluation,
  FileDiff,
  LogEvent,
  ModelOption,
  ModelRun,
  TestCase,
} from "./types";

export const DEMO_MODELS: ModelOption[] = [
  { id: "demo/code-agent", name: "Code Agent", description: "A general coding agent demo preset." },
  {
    id: "demo/reasoning-agent",
    name: "Reasoning Agent",
    description: "A reasoning-focused demo preset.",
  },
  { id: "demo/fast-agent", name: "Fast Agent", description: "A lightweight agent demo preset." },
];

const parserDiff: FileDiff[] = [
  {
    path: "src/parser.py",
    lines: [
      { kind: "context", text: "def parse_expression(source: str):" },
      { kind: "removed", text: "    tokens = tokenize(source)" },
      { kind: "added", text: "    if not source.strip():" },
      { kind: "added", text: "        return EmptyExpression()" },
      { kind: "added", text: "    tokens = tokenize(source.strip())" },
      { kind: "context", text: "    return Parser(tokens).parse()" },
    ],
  },
  {
    path: "tests/test_parser.py",
    lines: [
      { kind: "context", text: "from agentbench_demo.parser import parse_expression" },
      { kind: "added", text: "" },
      { kind: "added", text: "@pytest.mark.parametrize('source', ['', '   ', '\\n'])" },
      { kind: "added", text: "def test_empty_expression(source):" },
      { kind: "added", text: "    assert parse_expression(source) == EmptyExpression()" },
    ],
  },
];

const parserTests: TestCase[] = [
  { name: "test_empty_expression", status: "passed", durationMs: 8 },
  { name: "test_whitespace_expression", status: "passed", durationMs: 5 },
  { name: "test_nested_expression", status: "passed", durationMs: 12 },
  { name: "test_invalid_token", status: "passed", durationMs: 7 },
];

const completedLogs: LogEvent[] = [
  { time: "00:00", kind: "info", message: "Run claimed by demo-worker-01." },
  {
    time: "00:02",
    kind: "info",
    message: "Repository resolved to commit 8f42c1a. Isolated workspace prepared.",
  },
  { time: "00:05", kind: "tool", message: "read_file  src/parser.py" },
  { time: "00:07", kind: "tool", message: "read_file  tests/test_parser.py" },
  {
    time: "00:18",
    kind: "info",
    message: "Empty input reaches the parser without a sentinel. Adding an explicit guard.",
  },
  { time: "00:42", kind: "tool", message: "edit_file  src/parser.py  (+3 / -1)" },
  { time: "00:56", kind: "tool", message: "edit_file  tests/test_parser.py  (+4 / -0)" },
  {
    time: "01:12",
    kind: "info",
    message: "Patch captured. Starting configured test command: python -m pytest.",
  },
  { time: "01:38", kind: "info", message: "4 passed in 0.032s. Exit code: 0." },
  { time: "01:42", kind: "info", message: "Artifacts saved. Workspace removed. Run completed." },
];

function run(model: number, overrides: Partial<ModelRun> = {}): ModelRun {
  const option = DEMO_MODELS[model];
  return {
    id: `${option.id.split("/")[1]}-run`,
    modelId: option.id,
    modelName: option.name,
    status: "completed",
    durationSeconds: 102,
    inputTokens: 8420,
    outputTokens: 2140,
    costUsd: 0.12,
    logs: completedLogs,
    tests: parserTests,
    requiredTestIds: [],
    diff: parserDiff,
    ...overrides,
  };
}

// Fictional repository names, model presets, outcomes and costs. Never sent to an API.
const SAMPLE_EVALUATIONS: Omit<Evaluation, "benchmarkTask">[] = [
  {
    id: "eval-001",
    title: "Handle empty input in the expression parser",
    repositoryUrl: "https://github.com/agentbench-demo/expression-kit",
    task: "The expression parser raises an IndexError for empty or whitespace-only input. Return an EmptyExpression instead, preserve existing parsing behavior, and add regression tests.",
    commitSha: "8f42c1a94b609d482397f56a31947a582c680b2e",
    createdAt: "2026-10-07T16:42:00Z",
    testCommand: ["python", "-m", "pytest"],
    runs: [
      run(0),
      run(1, { durationSeconds: 148, inputTokens: 11400, outputTokens: 3200, costUsd: 0.24 }),
    ],
  },
  {
    id: "eval-002",
    title: "Add cursor pagination to the activity endpoint",
    repositoryUrl: "https://github.com/agentbench-demo/activity-api",
    task: "Add cursor-based pagination to GET /activity. Preserve descending timestamp order and cover empty pages and duplicate timestamps with tests.",
    commitSha: "c93ed25eaa493e3b7a339d0ca3f0baaaab6e7ad4",
    createdAt: "2026-10-07T16:18:00Z",
    testCommand: ["python", "-m", "pytest", "tests/test_activity.py"],
    runs: [
      run(1, {
        status: "running",
        durationSeconds: null,
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        logs: [
          {
            time: "00:00",
            kind: "info",
            message: "Run claimed. Workspace prepared at commit c93ed25.",
          },
          { time: "00:04", kind: "tool", message: "read_file  app/routes/activity.py" },
          { time: "00:11", kind: "tool", message: "read_file  tests/test_activity.py" },
          {
            time: "00:28",
            kind: "info",
            message: "Reviewing timestamp ordering and cursor boundaries.",
          },
        ],
        tests: [],
        diff: [],
      }),
    ],
  },
  {
    id: "eval-003",
    title: "Prevent duplicate entries in the in-memory cache",
    repositoryUrl: "https://github.com/agentbench-demo/cache-tools",
    task: "Repeated writes to the same key should replace the cached value without adding a duplicate entry. Keep eviction order deterministic and test replacement behavior.",
    commitSha: "3a91db72daa82591a9b47e9f0c1d70a80d9d2ba9",
    createdAt: "2026-10-07T15:55:00Z",
    testCommand: ["npm", "test"],
    runs: [
      run(0, {
        durationSeconds: 86,
        costUsd: 0.09,
        logs: [
          { time: "00:00", kind: "info", message: "Workspace prepared at commit 3a91db7." },
          { time: "00:12", kind: "tool", message: "read_file  src/cache.ts" },
          { time: "00:46", kind: "tool", message: "edit_file  src/cache.ts" },
          { time: "01:26", kind: "info", message: "4 tests passed. Run completed." },
        ],
        tests: [
          { name: "replaces an existing key", status: "passed", durationMs: 2 },
          { name: "preserves eviction order", status: "passed", durationMs: 3 },
          { name: "returns the latest value", status: "passed", durationMs: 1 },
          { name: "handles an empty cache", status: "passed", durationMs: 1 },
        ],
        diff: [
          {
            path: "src/cache.ts",
            lines: [
              { kind: "context", text: "set(key: string, value: T) {" },
              { kind: "added", text: "  this.entries.delete(key);" },
              { kind: "context", text: "  this.entries.set(key, value);" },
              { kind: "context", text: "}" },
            ],
          },
        ],
      }),
      run(2, {
        durationSeconds: 44,
        inputTokens: 4200,
        outputTokens: 1120,
        costUsd: 0.03,
        logs: [
          { time: "00:00", kind: "info", message: "Workspace prepared at commit 3a91db7." },
          { time: "00:15", kind: "tool", message: "edit_file  src/cache.ts" },
          {
            time: "00:44",
            kind: "warning",
            message: "3 passed, 1 failed. Exit code: 1. Grading completed.",
          },
        ],
        tests: [
          { name: "replaces an existing key", status: "passed", durationMs: 2 },
          {
            name: "preserves eviction order",
            status: "failed",
            durationMs: 3,
            detail: "Expected eviction order: [b, a]\nReceived eviction order: [a, b]",
          },
          { name: "returns the latest value", status: "passed", durationMs: 1 },
          { name: "handles an empty cache", status: "passed", durationMs: 1 },
        ],
        diff: [
          {
            path: "src/cache.ts",
            lines: [
              { kind: "context", text: "set(key: string, value: T) {" },
              { kind: "removed", text: "  this.entries.push([key, value]);" },
              { kind: "added", text: "  this.entries.set(key, value);" },
              { kind: "context", text: "}" },
            ],
          },
        ],
      }),
    ],
  },
  {
    id: "eval-004",
    title: "Improve keyboard navigation in the command palette",
    repositoryUrl: "https://github.com/agentbench-demo/ui-primitives",
    task: "Support ArrowUp, ArrowDown, Enter and Escape in the command palette. Keep focus in the dialog and restore focus to the trigger when it closes.",
    commitSha: null,
    createdAt: "2026-10-07T15:34:00Z",
    testCommand: ["npm", "test"],
    runs: [
      run(0, {
        status: "queued",
        durationSeconds: null,
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        logs: [],
        tests: [],
        diff: [],
      }),
      run(1, {
        status: "queued",
        durationSeconds: null,
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        logs: [],
        tests: [],
        diff: [],
      }),
    ],
  },
  {
    id: "eval-005",
    title: "Normalize trailing slashes in the URL resolver",
    repositoryUrl: "https://github.com/agentbench-demo/route-utils",
    task: "Normalize trailing slashes consistently in the URL resolver while preserving the root URL and query parameters. Add tests for both absolute and relative URLs.",
    commitSha: "f2710dd6c9a9ec7fe4711aa437e3b657e809ea41",
    createdAt: "2026-10-06T18:12:00Z",
    testCommand: ["python", "-m", "pytest"],
    runs: [
      run(2, {
        status: "failed",
        durationSeconds: 31,
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        error: "Dependency installation exceeded the configured timeout.",
        logs: [
          { time: "00:00", kind: "info", message: "Workspace prepared at commit f2710dd." },
          { time: "00:01", kind: "info", message: "Installing repository dependencies." },
          {
            time: "00:31",
            kind: "error",
            message: "Dependency installation timed out. Agent and grader did not start.",
          },
        ],
        tests: [],
        diff: [],
      }),
    ],
  },
  {
    id: "eval-006",
    title: "Add a health check for background workers",
    repositoryUrl: "https://github.com/agentbench-demo/activity-api",
    task: "Add a worker health endpoint that reports readiness based on a recent heartbeat. Return an unavailable status when the worker lease has expired.",
    commitSha: "47aa10f82fe94d57f3a715c8892da3bca4f115bb",
    createdAt: "2026-10-06T17:06:00Z",
    testCommand: ["python", "-m", "pytest", "tests/test_health.py"],
    runs: [
      run(1, {
        durationSeconds: 119,
        costUsd: 0.18,
        logs: [
          { time: "00:00", kind: "info", message: "Workspace prepared at commit 47aa10f." },
          { time: "00:12", kind: "tool", message: "read_file  app/health.py" },
          { time: "00:51", kind: "tool", message: "edit_file  app/health.py" },
          { time: "01:59", kind: "info", message: "3 tests passed. Run completed." },
        ],
        tests: [
          { name: "test_recent_heartbeat", status: "passed", durationMs: 10 },
          { name: "test_expired_lease", status: "passed", durationMs: 8 },
          { name: "test_missing_worker", status: "passed", durationMs: 5 },
        ],
        diff: [
          {
            path: "app/health.py",
            lines: [
              { kind: "context", text: "def worker_health(heartbeat):" },
              { kind: "added", text: "    if heartbeat is None or heartbeat.expired:" },
              { kind: "added", text: "        return {'ready': False}, 503" },
              { kind: "added", text: "    return {'ready': True}, 200" },
            ],
          },
        ],
      }),
    ],
  },
];

// These fictional validation reports illustrate the contract; no commits/images were checked.
export const DEMO_TASKS: BenchmarkTask[] = SAMPLE_EVALUATIONS.map((evaluation, index) => {
  const recordedTests = evaluation.runs[0].tests.map((test) => test.name);
  const regressionCount = index === 0 || index === 2 ? 2 : 1;
  const failToPass = recordedTests.length
    ? recordedTests.slice(0, regressionCount)
    : ["test_task_regression"];
  const passToPass = recordedTests.slice(regressionCount);
  return {
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    title: evaluation.title,
    repository_url: evaluation.repositoryUrl,
    base_commit: evaluation.commitSha ?? "1111111111111111111111111111111111111111",
    reference_commit: "abcdef"[index] + (evaluation.commitSha ?? "1".repeat(40)).slice(1),
    prompt: evaluation.task,
    grading_paths: [evaluation.testCommand[0] === "npm" ? "test" : "tests"],
    fail_to_pass: failToPass,
    pass_to_pass: passToPass,
    test_command: evaluation.testCommand,
    environment: {
      image: `ghcr.io/agentbench/demo@sha256:${"0".repeat(64)}`,
      setup_commands: [],
    },
    created_at: evaluation.createdAt,
    validation: {
      status: "validated",
      grading_bundle_sha256: String(index + 1).repeat(64),
      base_results: Object.fromEntries([
        ...failToPass.map((id) => [id, "failed"]),
        ...passToPass.map((id) => [id, "passed"]),
      ]),
      reference_results: Object.fromEntries(
        [...failToPass, ...passToPass].map((id) => [id, "passed"]),
      ),
      errors: [],
    },
  };
});

export const DEMO_EVALUATIONS: Evaluation[] = SAMPLE_EVALUATIONS.map((evaluation, index) => ({
  ...evaluation,
  benchmarkTask: DEMO_TASKS[index],
  commitSha: DEMO_TASKS[index].base_commit,
  runs: evaluation.runs.map((run) => ({
    ...run,
    requiredTestIds: [...DEMO_TASKS[index].fail_to_pass, ...DEMO_TASKS[index].pass_to_pass],
  })),
}));
