"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatCommand,
  formatCost,
  formatDate,
  formatDuration,
  repositoryName,
  testOutcome,
} from "@/lib/evaluations";
import type { BenchmarkTask, ModelRun } from "@/lib/types";
import { useDemo } from "./demo-provider";
import { Icon } from "./icon";
import { EmptyState, StatusBadge } from "./ui";

const tabs = ["overview", "logs", "tests", "diff"] as const;

function RunTests({ run, task }: { run: ModelRun; task: BenchmarkTask }) {
  const [filter, setFilter] = useState("all");
  if (!run.tests.length)
    return (
      <EmptyState
        icon="check"
        title="No test results yet"
        description={
          run.status === "failed"
            ? "Execution failed before grading. Check the logs for details."
            : "Test results appear after the configured grading command finishes."
        }
      />
    );
  const filtered = run.tests.filter((test) => filter === "all" || test.status === filter);
  return (
    <div className="tests-view">
      <div className="tests-toolbar">
        <div className="test-summary">
          <span className="accent-text">
            {run.tests.filter((test) => test.status === "passed").length} passed
          </span>
          <span className="danger-text">
            {run.tests.filter((test) => test.status === "failed").length} failed
          </span>
          <span className="muted-text">
            {run.tests.filter((test) => test.status === "skipped").length} skipped
          </span>
          <span className="danger-text">
            {run.tests.filter((test) => test.status === "error").length} errors
          </span>
        </div>
        <select
          aria-label="Filter test outcomes"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All tests</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
          <option value="error">Errors</option>
        </select>
      </div>
      {filtered.length ? (
        <div className="test-cases">
          {filtered.map((test) => (
            <div className="test-case" key={test.name}>
              <div className="test-case-heading">
                <span className={`test-icon test-${test.status}`}>
                  <Icon
                    name={
                      test.status === "passed"
                        ? "check"
                        : test.status === "failed"
                          ? "close"
                          : "clock"
                    }
                    size={15}
                  />
                </span>
                <code>{test.name}</code>
                <span className="subtle-tag">
                  {task.fail_to_pass.includes(test.name)
                    ? "Fix test"
                    : task.pass_to_pass.includes(test.name)
                      ? "Regression"
                      : "Additional"}
                </span>
                <span className="test-duration">{test.durationMs} ms</span>
                <span className={`test-outcome test-${test.status}`}>{test.status}</span>
              </div>
              {test.detail ? <pre className="test-error">{test.detail}</pre> : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tests with this outcome"
          description="Choose another test filter to see the recorded results."
        />
      )}
    </div>
  );
}

function RunLogs({ run }: { run: ModelRun }) {
  const [search, setSearch] = useState("");
  const { notify } = useDemo();
  const filtered = run.logs.filter((event) =>
    `${event.kind} ${event.message}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function copyLogs() {
    try {
      await navigator.clipboard.writeText(
        run.logs
          .map((event) => `[${event.time}] ${event.kind.toUpperCase()} ${event.message}`)
          .join("\n"),
      );
      notify("Run logs copied to clipboard.");
    } catch {
      notify("Could not access the clipboard. Select the logs to copy them manually.");
    }
  }
  if (!run.logs.length)
    return (
      <EmptyState
        icon="terminal"
        title="Waiting for the first event"
        description="When execution is connected, repository setup, agent actions and grading output will appear here."
      />
    );
  return (
    <div className="logs-view">
      <div className="logs-toolbar">
        <div className="search-input">
          <Icon name="search" size={16} />
          <input
            aria-label="Search run logs"
            placeholder="Filter log output…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button className="button button-secondary button-small" onClick={copyLogs}>
          <Icon name="copy" size={14} />
          Copy logs
        </button>
      </div>
      <div className="terminal-panel">
        <div className="terminal-title">
          <span>
            <Icon name="terminal" size={14} />
            {run.modelName} / execution log
          </span>
          <span>{filtered.length} events</span>
        </div>
        <div className="log-lines">
          {filtered.length ? (
            filtered.map((event, index) => (
              <div className="log-line" key={`${event.time}-${index}`}>
                <span className="log-time">{event.time}</span>
                <span className={`log-kind log-${event.kind}`}>{event.kind}</span>
                <span className="log-message">{event.message}</span>
              </div>
            ))
          ) : (
            <p className="log-empty">No events match your search.</p>
          )}
        </div>
      </div>
      <p className="footnote">Recorded demo output. This is not a live stream.</p>
    </div>
  );
}

function RunDiff({ run }: { run: ModelRun }) {
  const { notify } = useDemo();
  if (!run.diff.length)
    return (
      <EmptyState
        icon="code"
        title="No patch recorded"
        description="Code changes will be captured as a patch before the workspace is cleaned up."
      />
    );
  const added = run.diff
    .flatMap((file) => file.lines)
    .filter((line) => line.kind === "added").length;
  const removed = run.diff
    .flatMap((file) => file.lines)
    .filter((line) => line.kind === "removed").length;
  async function copyDiff() {
    const patch = run.diff
      .map(
        (file) =>
          `--- a/${file.path}\n+++ b/${file.path}\n${file.lines.map((line) => `${line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "}${line.text}`).join("\n")}`,
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(patch);
      notify("Demo diff excerpt copied. This excerpt is not a complete apply-ready patch.");
    } catch {
      notify("Could not access the clipboard. Select the diff to copy it manually.");
    }
  }
  return (
    <div className="diff-view">
      <div className="diff-toolbar">
        <span>
          {run.diff.length} changed files <strong className="accent-text">+{added}</strong>
          <strong className="danger-text">−{removed}</strong>
        </span>
        <button className="button button-secondary button-small" onClick={copyDiff}>
          <Icon name="copy" size={14} />
          Copy excerpt
        </button>
      </div>
      {run.diff.map((file) => (
        <section className="diff-file" key={file.path}>
          <h3>
            <Icon name="code" size={15} />
            <code>{file.path}</code>
          </h3>
          <div className="diff-scroll">
            <pre>
              {file.lines.map((line, index) => (
                <span className={`diff-line diff-${line.kind}`} key={index}>
                  <span className="line-number">{index + 1}</span>
                  <span className="diff-prefix">
                    {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}
                  </span>
                  <span>{line.text || " "}</span>
                  {"\n"}
                </span>
              ))}
            </pre>
          </div>
        </section>
      ))}
      <p className="footnote">
        Demo excerpts. Line numbers show excerpt positions; full patch artifacts will come from the
        execution service.
      </p>
    </div>
  );
}

export function EvaluationDetail({ id }: { id: string }) {
  const { evaluations, notify } = useDemo();
  const evaluation = evaluations.find((item) => item.id === id);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("overview");
  if (!evaluation)
    return (
      <section className="panel missing-evaluation">
        <EmptyState
          title="Evaluation not found"
          description="Demo submissions are kept for this session only. A refresh clears them, or this ID may not exist."
          action={
            <Link className="button button-primary" href="/evaluations">
              Back to evaluations
            </Link>
          }
        />
      </section>
    );
  const run = evaluation.runs.find((item) => item.id === selectedRun) ?? evaluation.runs[0];
  const outcome = testOutcome(run);
  const passed = run.tests.filter((test) => test.status === "passed").length;
  const stages = ["queued", "preparing", "running", "grading", "completed"] as const;
  const stageIndex = stages.findIndex((stage) => stage === run.status);

  function exportEvaluation() {
    if (!evaluation) return;
    const blob = new Blob([JSON.stringify({ mode: "demo", evaluation }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${evaluation.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Demo evaluation exported as JSON.");
  }

  return (
    <>
      <Link href="/evaluations" className="back-link">
        <Icon name="arrow" size={14} className="rotate-arrow" />
        All evaluations
      </Link>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">
            EVALUATION /{" "}
            <span className="mono">
              {evaluation.id.length > 20 ? evaluation.id.slice(0, 18) + "…" : evaluation.id}
            </span>
          </p>
          <h1>{evaluation.title}</h1>
          <div className="detail-meta">
            <span>
              <Icon name="repo" size={14} />
              {repositoryName(evaluation.repositoryUrl)}
            </span>
            <span>
              <Icon name="branch" size={14} />
              {evaluation.commitSha?.slice(0, 7) ?? "Commit unresolved"}
            </span>
            <span>
              <Icon name="clock" size={14} />
              {formatDate(evaluation.createdAt)} UTC
            </span>
          </div>
        </div>
        <button onClick={exportEvaluation} className="button button-secondary">
          <Icon name="download" size={16} />
          Export JSON
        </button>
      </div>
      <div className="run-selector" aria-label="Select a model run">
        {evaluation.runs.map((item, index) => (
          <button
            key={item.id}
            className={`run-card ${item.id === run.id ? "selected" : ""}`}
            aria-pressed={item.id === run.id}
            onClick={() => setSelectedRun(item.id)}
          >
            <div className="run-card-top">
              <span className={`model-avatar model-color-${index % 3}`}>{item.modelName[0]}</span>
              <strong>{item.modelName}</strong>
              <StatusBadge status={item.status} />
            </div>
            <div className="run-card-bottom">
              <span className={`run-result result-${testOutcome(item)}`}>
                <Icon
                  name={
                    testOutcome(item) === "passed"
                      ? "check"
                      : testOutcome(item) === "failed"
                        ? "close"
                        : "clock"
                  }
                  size={14}
                />
                {testOutcome(item) === "passed"
                  ? "Required tests passed"
                  : testOutcome(item) === "failed"
                    ? "Required checks failed"
                    : item.status === "failed"
                      ? "Execution failed"
                      : item.status === "completed"
                        ? "Unscored"
                        : "Awaiting results"}
              </span>
              <span>{formatDuration(item.durationSeconds)}</span>
              <span>{formatCost(item.costUsd)}</span>
            </div>
          </button>
        ))}
      </div>
      <section className="panel run-panel">
        <div className="detail-tabs" role="tablist" aria-label="Run details">
          {tabs.map((item) => (
            <button
              key={item}
              id={`tab-${item}`}
              role="tab"
              aria-selected={tab === item}
              aria-controls="run-tabpanel"
              onClick={() => setTab(item)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : (tabs.indexOf(item) + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                        tabs.length;
                setTab(tabs[next]);
                document.getElementById(`tab-${tabs[next]}`)?.focus();
              }}
              tabIndex={tab === item ? 0 : -1}
              className={tab === item ? "selected" : ""}
            >
              <Icon
                name={
                  item === "overview"
                    ? "grid"
                    : item === "logs"
                      ? "terminal"
                      : item === "tests"
                        ? "check"
                        : "code"
                }
                size={16}
              />
              {item === "diff" ? "Code diff" : item.charAt(0).toUpperCase() + item.slice(1)}
              {item !== "overview" ? (
                <span>
                  {item === "logs"
                    ? run.logs.length
                    : item === "tests"
                      ? run.tests.length
                      : run.diff.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div
          id="run-tabpanel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="run-tab-content"
          tabIndex={0}
        >
          {tab === "overview" ? (
            <div className="run-overview">
              <div className="run-overview-main">
                <div className="section-label">RUN PROGRESS</div>
                <ol className="run-progress">
                  {stages.map((stage, index) => (
                    <li
                      key={stage}
                      className={
                        stageIndex > index ? "done" : stageIndex === index ? "current" : ""
                      }
                    >
                      <span>
                        {stageIndex > index || run.status === "completed" ? (
                          <Icon name="check" size={13} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <small>{stage.charAt(0).toUpperCase() + stage.slice(1)}</small>
                    </li>
                  ))}
                </ol>
                {run.error ? (
                  <div className="error-callout">
                    <Icon name="info" size={18} />
                    <div>
                      <strong>Execution failed</strong>
                      <p>{run.error}</p>
                    </div>
                  </div>
                ) : run.status === "queued" ? (
                  <div className="neutral-callout">
                    <Icon name="clock" size={18} />
                    <span>This demo run is queued. No execution service is connected.</span>
                  </div>
                ) : run.status === "running" ? (
                  <div className="neutral-callout">
                    <Icon name="info" size={18} />
                    <span>
                      This recorded sample shows a run in progress. It does not update live.
                    </span>
                  </div>
                ) : outcome === "pending" ? (
                  <div className="neutral-callout">
                    <Icon name="info" size={18} />
                    <span>Required test outcomes are missing. This run is unscored.</span>
                  </div>
                ) : (
                  <div className={`outcome-callout ${outcome === "failed" ? "failed" : ""}`}>
                    <Icon name={outcome === "passed" ? "check" : "close"} size={19} />
                    <div>
                      <strong>
                        {outcome === "passed"
                          ? "All required benchmark tests passed"
                          : "Grading finished with unmet benchmark checks"}
                      </strong>
                      <p>
                        {passed} of {run.tests.length} tests passed. Review the test output and
                        patch before drawing conclusions.
                      </p>
                    </div>
                  </div>
                )}
                <div className="section-label task-label">CODING TASK</div>
                <p className="task-description">{evaluation.task}</p>
                <Link
                  href={`/tasks/${evaluation.benchmarkTask.id}`}
                  className="text-link task-definition-link"
                >
                  Inspect benchmark definition <Icon name="arrow" size={14} />
                </Link>
                <dl className="revision-list">
                  <div>
                    <dt>Base commit · agent inputs</dt>
                    <dd>
                      <code>{evaluation.benchmarkTask.base_commit}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Reference · evaluator only</dt>
                    <dd>
                      <code>{evaluation.benchmarkTask.reference_commit}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Grading paths</dt>
                    <dd>
                      <code>{evaluation.benchmarkTask.grading_paths.join(", ")}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Required cohorts</dt>
                    <dd>
                      {evaluation.benchmarkTask.fail_to_pass.length} fail → pass ·{" "}
                      {evaluation.benchmarkTask.pass_to_pass.length} pass → pass
                    </dd>
                  </div>
                </dl>
                <div className="section-label task-label">TEST COMMAND</div>
                <div className="command-preview">
                  <Icon name="terminal" size={16} />
                  <code>{formatCommand(evaluation.testCommand)}</code>
                </div>
              </div>
              <aside className="run-metadata">
                <h3>Run details</h3>
                <dl>
                  <div>
                    <dt>Model</dt>
                    <dd className="mono">{run.modelId}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusBadge status={run.status} />
                    </dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{formatDuration(run.durationSeconds)}</dd>
                  </div>
                  <div>
                    <dt>Input tokens</dt>
                    <dd>{run.inputTokens?.toLocaleString() ?? "Unreported"}</dd>
                  </div>
                  <div>
                    <dt>Output tokens</dt>
                    <dd>{run.outputTokens?.toLocaleString() ?? "Unreported"}</dd>
                  </div>
                  <div>
                    <dt>Recorded cost</dt>
                    <dd>{formatCost(run.costUsd)}</dd>
                  </div>
                  <div>
                    <dt>Commit</dt>
                    <dd className="mono">{evaluation.commitSha?.slice(0, 7) ?? "Unresolved"}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          ) : tab === "logs" ? (
            <RunLogs key={run.id} run={run} />
          ) : tab === "tests" ? (
            <RunTests key={run.id} run={run} task={evaluation.benchmarkTask} />
          ) : (
            <RunDiff run={run} />
          )}
        </div>
      </section>
      <p className="footnote">
        Model metrics and artifacts on this page are sample data. Unknown metrics are shown as
        unreported.
      </p>
    </>
  );
}
