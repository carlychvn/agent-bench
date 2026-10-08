"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEMO_EVALUATIONS, DEMO_MODELS, DEMO_TASKS } from "@/lib/demo-data";
import type { BenchmarkTask, BenchmarkTaskInput, Evaluation, EvaluationInput } from "@/lib/types";
import { Icon } from "./icon";

interface DemoContextValue {
  evaluations: Evaluation[];
  tasks: BenchmarkTask[];
  createTask: (request: BenchmarkTaskInput) => string;
  createEvaluation: (request: EvaluationInput) => string;
  notify: (message: string) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [evaluations, setEvaluations] = useState(DEMO_EVALUATIONS);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const notify = useCallback((message: string) => setToast({ message, key: Date.now() }), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const createTask = useCallback(
    (request: BenchmarkTaskInput) => {
      const id = crypto.randomUUID();
      const task: BenchmarkTask = {
        ...request,
        id,
        created_at: new Date().toISOString(),
        validation: {
          status: "unvalidated",
          grading_bundle_sha256: null,
          base_results: {},
          reference_results: {},
          errors: [],
        },
      };
      setTasks((previous) => [task, ...previous]);
      notify("Demo task saved as unvalidated. Commit extraction and validation are not connected.");
      return id;
    },
    [notify],
  );

  const createEvaluation = useCallback(
    (request: EvaluationInput) => {
      const benchmarkTask = tasks.find((task) => task.id === request.benchmark_task_id);
      if (!benchmarkTask || benchmarkTask.validation.status !== "validated") {
        throw new Error("Select a validated benchmark task before creating an evaluation.");
      }
      const id = `demo-${crypto.randomUUID()}`;
      const evaluation: Evaluation = {
        id,
        benchmarkTask,
        title: benchmarkTask.title,
        repositoryUrl: benchmarkTask.repository_url,
        task: benchmarkTask.prompt,
        commitSha: benchmarkTask.base_commit,
        createdAt: new Date().toISOString(),
        testCommand: benchmarkTask.test_command,
        runs: request.models.map((modelId) => ({
          id: crypto.randomUUID(),
          modelId,
          modelName: DEMO_MODELS.find((model) => model.id === modelId)?.name ?? modelId,
          status: "queued",
          durationSeconds: null,
          inputTokens: null,
          outputTokens: null,
          costUsd: null,
          logs: [],
          tests: [],
          requiredTestIds: [...benchmarkTask.fail_to_pass, ...benchmarkTask.pass_to_pass],
          diff: [],
        })),
      };
      setEvaluations((previous) => [evaluation, ...previous]);
      notify("Demo evaluation created. Execution is not connected.");
      return id;
    },
    [notify, tasks],
  );

  const value = useMemo(
    () => ({ evaluations, tasks, createTask, createEvaluation, notify }),
    [evaluations, tasks, createTask, createEvaluation, notify],
  );

  return (
    <DemoContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="toast" role="status">
          <Icon name="info" />
          <span>{toast.message}</span>
          <button
            className="icon-button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : null}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
