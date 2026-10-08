"use client";

import Link from "next/link";
import { useDemo } from "./demo-provider";
import { Icon } from "./icon";
import { EmptyState, SectionHeader, ValidationBadge } from "./ui";
import { formatCommand, repositoryName } from "@/lib/evaluations";

export function BenchmarkTaskDetail({ id }: { id: string }) {
  const { tasks } = useDemo();
  const task = tasks.find((item) => item.id === id);
  if (!task)
    return (
      <section className="panel">
        <EmptyState
          title="Task not found"
          description="Demo tasks reset on refresh. Check the ID or return to the catalog."
          action={
            <Link className="button button-primary" href="/tasks">
              Task catalog
            </Link>
          }
        />
      </section>
    );
  const validated = task.validation.status === "validated";
  const cohorts = [
    ...task.fail_to_pass.map((test) => ({ test, group: "Fail → pass" })),
    ...task.pass_to_pass.map((test) => ({ test, group: "Pass → pass" })),
  ];
  return (
    <>
      <Link href="/tasks" className="back-link">
        <Icon name="arrow" className="rotate-arrow" size={14} />
        Benchmark tasks
      </Link>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">IMMUTABLE BENCHMARK TASK / DEMO</p>
          <h1>{task.title}</h1>
          <div className="detail-meta">
            <span>
              <Icon name="repo" size={14} />
              {repositoryName(task.repository_url)}
            </span>
            <ValidationBadge status={task.validation.status} />
          </div>
        </div>
        {validated ? (
          <Link href={`/evaluations/new?task=${task.id}`} className="button button-primary">
            <Icon name="plus" size={16} />
            Evaluate sample task
          </Link>
        ) : (
          <span className="subtle-tag muted-tag">Validation required</span>
        )}
      </div>
      <section className="panel task-spec-panel">
        <SectionHeader
          title="Pinned task inputs"
          caption="Authors can inspect the reference here. The agent receives only the base code and prompt."
        />
        <div className="task-spec-content">
          <div className="section-label">NATURAL-LANGUAGE PROMPT</div>
          <p className="task-description">{task.prompt}</p>
          <dl className="revision-list">
            <div>
              <dt>Agent base commit</dt>
              <dd>
                <code>{task.base_commit}</code>
              </dd>
            </div>
            <div>
              <dt>Evaluator reference commit</dt>
              <dd>
                <code>{task.reference_commit}</code>
              </dd>
            </div>
            <div>
              <dt>Runtime image</dt>
              <dd>
                <code>{task.environment.image}</code>
              </dd>
            </div>
            <div>
              <dt>Reference grading paths</dt>
              <dd>
                <code>{task.grading_paths.join("\n")}</code>
              </dd>
            </div>
          </dl>
          <div className="section-label">GRADING COMMAND</div>
          <div className="command-preview">
            <Icon name="terminal" size={16} />
            <code>{formatCommand(task.test_command)}</code>
          </div>
          <div className="section-label task-label">DEPENDENCY SETUP</div>
          {task.environment.setup_commands.length ? (
            task.environment.setup_commands.map((command, index) => (
              <div className="command-preview" key={index}>
                <code>{formatCommand(command)}</code>
              </div>
            ))
          ) : (
            <p className="field-help">No setup commands configured.</p>
          )}
        </div>
      </section>
      <section className="panel task-validation-panel">
        <SectionHeader
          title="Benchmark validation evidence"
          caption="Required tests must have the expected outcomes on both immutable revisions."
        />
        <div className="task-validation-note">
          <div className="neutral-callout">
            <Icon name="info" size={18} />
            <span>
              {validated
                ? "Fictional sample evidence. No repository, image or tests were executed to produce this report."
                : "This task has no execution evidence. The validation endpoint and worker are placeholders; entering valid-looking inputs cannot mark it validated."}
            </span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Required test ID</th>
                <th scope="col">Cohort</th>
                <th scope="col">Base result</th>
                <th scope="col">Reference result</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map(({ test, group }) => (
                <tr key={test}>
                  <td className="mono">{test}</td>
                  <td>{group}</td>
                  <td>{task.validation.base_results[test] ?? "Not run"}</td>
                  <td>{task.validation.reference_results[test] ?? "Not run"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bundle-digest">
          <span className="section-label">TRUSTED BUNDLE SHA-256</span>
          <code>{task.validation.grading_bundle_sha256 ?? "Not extracted"}</code>
        </div>
      </section>
      <p className="footnote">
        Task definitions are immutable. To change the prompt, revisions, environment or grading
        configuration, create a new task and validate it again. The known-good solution is never
        used as the candidate.
      </p>
    </>
  );
}
