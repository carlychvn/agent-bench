export type RunStatus =
  | "queued"
  | "preparing"
  | "running"
  | "grading"
  | "completed"
  | "failed"
  | "cancelled";
export type EvaluationStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type TestStatus = "passed" | "failed" | "skipped" | "error";

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface LogEvent {
  time: string;
  kind: "info" | "tool" | "warning" | "error";
  message: string;
}

export interface TestCase {
  name: string;
  status: TestStatus;
  durationMs: number;
  detail?: string;
}

export interface DiffLine {
  kind: "context" | "added" | "removed";
  text: string;
}

export interface FileDiff {
  path: string;
  lines: DiffLine[];
}

export interface ModelRun {
  id: string;
  modelId: string;
  modelName: string;
  status: RunStatus;
  durationSeconds: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  logs: LogEvent[];
  tests: TestCase[];
  requiredTestIds: string[];
  diff: FileDiff[];
  error?: string;
}

export interface Evaluation {
  id: string;
  benchmarkTask: BenchmarkTask;
  title: string;
  repositoryUrl: string;
  task: string;
  commitSha: string | null;
  createdAt: string;
  testCommand: string[];
  runs: ModelRun[];
}

export type ValidationStatus = "unvalidated" | "validating" | "validated" | "rejected";

export interface BenchmarkTaskInput {
  title: string;
  repository_url: string;
  base_commit: string;
  reference_commit: string;
  prompt: string;
  grading_paths: string[];
  fail_to_pass: string[];
  pass_to_pass: string[];
  test_command: string[];
  environment: { image: string; setup_commands: string[][] };
}

export interface BenchmarkTask extends BenchmarkTaskInput {
  id: string;
  created_at: string;
  validation: {
    status: ValidationStatus;
    grading_bundle_sha256: string | null;
    base_results: Record<string, TestStatus>;
    reference_results: Record<string, TestStatus>;
    errors: string[];
  };
}

export interface EvaluationInput {
  benchmark_task_id: string;
  models: string[];
}
