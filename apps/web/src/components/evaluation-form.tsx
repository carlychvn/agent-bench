"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { DEMO_MODELS } from "@/lib/demo-data";
import { formatCommand, repositoryName } from "@/lib/evaluations";
import type { ModelOption } from "@/lib/types";
import { useDemo } from "./demo-provider";
import { Icon } from "./icon";

export function EvaluationForm({ initialTaskId }: { initialTaskId?: string }) {
  const router = useRouter();
  const { tasks, createEvaluation } = useDemo();
  const [taskId, setTaskId] = useState(initialTaskId ?? "");
  const task = tasks.find((item) => item.id === taskId);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(DEMO_MODELS);
  const [selectedModels, setSelectedModels] = useState<string[]>([DEMO_MODELS[0].id]);
  const [customModel, setCustomModel] = useState("");
  const [customError, setCustomError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function addCustomModel() {
    const id = customModel.trim();
    if (!id || modelOptions.some((model) => model.id === id)) {
      setCustomError("Enter a new, non-empty model identifier.");
      return;
    }
    if (modelOptions.length >= 10) {
      setCustomError("Use up to 10 models per evaluation.");
      return;
    }
    setModelOptions((previous) => [
      ...previous,
      { id, name: id, description: "Custom demo model. No provider is connected." },
    ]);
    setSelectedModels((previous) => [...previous, id]);
    setCustomModel("");
    setCustomError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!task || task.validation.status !== "validated") {
      setError("Choose a validated benchmark task. New tasks require real worker validation.");
      document.getElementById("benchmark-task")?.focus();
      return;
    }
    if (!selectedModels.length || selectedModels.length > 10) {
      setError("Select between 1 and 10 models.");
      document.getElementById("selected-models")?.focus();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const id = createEvaluation({ benchmark_task_id: task.id, models: selectedModels });
      router.push(`/evaluations/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create evaluation.");
      setSubmitting(false);
    }
  }

  return (
    <form className="create-layout" onSubmit={submit} noValidate>
      <div className="form-sections">
        <section className="panel form-section">
          <div className="form-section-heading">
            <span className="step-number">1</span>
            <div>
              <h2>Choose a benchmark task</h2>
              <p>Reuse a pinned task, environment and trusted test bundle.</p>
            </div>
            <Link href="/tasks/new" className="text-link example-button">
              Define a task
              <Icon name="plus" size={14} />
            </Link>
          </div>
          <div className="field">
            <label htmlFor="benchmark-task">
              Benchmark task <span className="required-marker">*</span>
            </label>
            <select
              id="benchmark-task"
              value={taskId}
              onChange={(event) => {
                setTaskId(event.target.value);
                setError("");
              }}
              aria-describedby="benchmark-help"
              className="full-width"
            >
              <option value="">Select a task…</option>
              {tasks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ·{" "}
                  {item.validation.status === "validated"
                    ? "validated demo"
                    : item.validation.status}
                </option>
              ))}
            </select>
            <p id="benchmark-help" className="field-help">
              Only validated tasks can be evaluated. Sample tasks have fictional validation
              evidence.
            </p>
          </div>
          {task ? (
            <div className="selected-task-summary">
              <span className="repository-line">
                <Icon name="repo" size={14} />
                {repositoryName(task.repository_url)}
              </span>
              <h3>{task.title}</h3>
              <p>{task.prompt}</p>
              <dl className="revision-list">
                <div>
                  <dt>Agent starting commit</dt>
                  <dd>
                    <code>{task.base_commit}</code>
                  </dd>
                </div>
                <div>
                  <dt>Reference for grading tests</dt>
                  <dd>
                    <code>{task.reference_commit}</code>
                  </dd>
                </div>
              </dl>
              <div className="command-preview">
                <Icon name="terminal" size={15} />
                <code>{formatCommand(task.test_command)}</code>
              </div>
              <Link href={`/tasks/${task.id}`} className="text-link">
                Inspect task and validation evidence
                <Icon name="arrow" size={14} />
              </Link>
              {task.validation.status !== "validated" ? (
                <div className="neutral-callout">
                  <Icon name="info" size={17} />
                  <span>
                    This task is unvalidated. The validation worker is not implemented, so it cannot
                    be evaluated yet.
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
        <section className="panel form-section">
          <div className="form-section-heading">
            <span className="step-number">2</span>
            <div>
              <h2>Choose your models</h2>
              <p>Each agent receives the same base commit and prompt.</p>
            </div>
            <span className="subtle-tag">{selectedModels.length} selected</span>
          </div>
          <fieldset id="selected-models" tabIndex={-1}>
            <legend className="sr-only">Models to evaluate</legend>
            <div className="model-options">
              {modelOptions.map((model, index) => (
                <label
                  key={model.id}
                  className={`model-option ${selectedModels.includes(model.id) ? "checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.id)}
                    onChange={() =>
                      setSelectedModels((previous) =>
                        previous.includes(model.id)
                          ? previous.filter((id) => id !== model.id)
                          : [...previous, model.id],
                      )
                    }
                  />
                  <span className={`model-option-avatar model-color-${index % 3}`}>
                    <Icon name="code" size={20} />
                  </span>
                  <span className="model-option-copy">
                    <strong>{model.name}</strong>
                    <code>{model.id}</code>
                    <small>{model.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="field-help">Demo model presets are fictional; no model calls are made.</p>
          <div className="custom-model-field">
            <label htmlFor="custom-model">Add a custom model</label>
            <div className="custom-model-row">
              <input
                id="custom-model"
                placeholder="provider/model-identifier"
                value={customModel}
                onChange={(event) => setCustomModel(event.target.value)}
                aria-invalid={Boolean(customError)}
                aria-describedby={customError ? "custom-error" : undefined}
              />
              <button type="button" className="button button-secondary" onClick={addCustomModel}>
                <Icon name="plus" size={15} />
                Add model
              </button>
            </div>
            {customError ? (
              <p id="custom-error" className="field-error">
                {customError}
              </p>
            ) : null}
          </div>
        </section>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          <Link href="/evaluations" className="button button-secondary">
            Cancel
          </Link>
          <button
            className="button button-primary"
            type="submit"
            disabled={submitting || Boolean(task && task.validation.status !== "validated")}
          >
            <Icon name="plus" size={17} />
            {submitting ? "Creating…" : "Create demo evaluation"}
          </button>
        </div>
      </div>
      <aside className="form-aside">
        <div className="panel review-panel">
          <span className="small-eyebrow">EVALUATION PLAN</span>
          <h2>One task. Equal inputs.</h2>
          <p>
            The grading tests come from the reference fix. Agents work from the base revision
            without access to that fix.
          </p>
          <dl>
            <div>
              <dt>Model runs</dt>
              <dd>{selectedModels.length}</dd>
            </div>
            <div>
              <dt>Fix tests</dt>
              <dd>{task?.fail_to_pass.length ?? "—"} fail → pass</dd>
            </div>
            <div>
              <dt>Regression tests</dt>
              <dd>{task?.pass_to_pass.length ?? "—"} pass → pass</dd>
            </div>
            <div>
              <dt>Validation</dt>
              <dd>{task?.validation.status ?? "Select a task"}</dd>
            </div>
          </dl>
          <div className="review-note">
            <Icon name="info" size={16} />
            <span>
              Demo runs stay queued and reset on refresh. Reference commits and tests are
              evaluator-only in the planned execution pipeline.
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}
