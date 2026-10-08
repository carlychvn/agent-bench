import type { Evaluation, EvaluationStatus, ModelRun } from "./types";

export function evaluationStatus(evaluation: Evaluation): EvaluationStatus {
  const statuses = evaluation.runs.map((run) => run.status);
  if (statuses.every((status) => status === "queued")) return "queued";
  if (statuses.some((status) => ["preparing", "running", "grading", "queued"].includes(status)))
    return "running";
  if (statuses.every((status) => status === "cancelled")) return "cancelled";
  if (statuses.some((status) => status === "failed")) return "failed";
  return "completed";
}

export function testOutcome(run: ModelRun): "passed" | "failed" | "pending" {
  if (run.status !== "completed" || !run.requiredTestIds.length) return "pending";
  const matches = run.requiredTestIds.map((id) => run.tests.filter((test) => test.name === id));
  if (matches.some((tests) => tests.length !== 1)) return "pending";
  const required = matches.map((tests) => tests[0]);
  if (required.some((test) => test.status === "error")) return "pending";
  if (required.some((test) => test.status !== "passed")) return "failed";
  return "passed";
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export function formatCost(cost: number | null): string {
  return cost === null ? "—" : `$${cost.toFixed(2)}`;
}

export function repositoryName(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/\.git$/, "");
  } catch {
    return url;
  }
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

// Display only. Execution always receives the original argument array.
export function formatCommand(argv: string[]): string {
  return argv.map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}
