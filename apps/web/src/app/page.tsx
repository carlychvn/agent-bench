"use client";

import Link from "next/link";
import { useDemo } from "@/components/demo-provider";
import { EvaluationTable } from "@/components/evaluation-table";
import { Icon } from "@/components/icon";
import { PageHeading, SectionHeader, StatCard } from "@/components/ui";
import { evaluationStatus, formatCost, testOutcome } from "@/lib/evaluations";

export default function Home() {
  const { evaluations } = useDemo();
  const runs = evaluations.flatMap((evaluation) => evaluation.runs);
  const graded = runs.filter((run) => testOutcome(run) !== "pending");
  const passed = graded.filter((run) => testOutcome(run) === "passed").length;
  const active = runs.filter((run) =>
    ["preparing", "running", "grading"].includes(run.status),
  ).length;
  const queued = runs.filter((run) => run.status === "queued").length;
  const failed = runs.filter((run) => run.status === "failed").length;
  const costs = runs.flatMap((run) => (run.costUsd === null ? [] : [run.costUsd]));

  return (
    <>
      <PageHeading
        eyebrow="YOUR BENCHMARK WORKSPACE"
        title="Evaluation overview"
        description="A clear picture of what your agents can do, and where they need work."
        action={
          <Link href="/evaluations/new" className="button button-primary">
            <Icon name="plus" size={17} />
            New evaluation
          </Link>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Total evaluations"
          value={evaluations.length}
          caption={`${runs.length} model runs across your tasks`}
          icon="layers"
        />
        <StatCard
          label="Task success rate"
          value={graded.length ? `${Math.round((passed / graded.length) * 100)}%` : "—"}
          caption={`${passed} of ${graded.length} graded runs passed required tests`}
          icon="check"
          accent
        />
        <StatCard
          label="Active runs"
          value={active}
          caption={`${queued} queued · ${failed} infrastructure failure${failed === 1 ? "" : "s"}`}
          icon="bolt"
        />
        <StatCard
          label="Recorded spend"
          value={costs.length ? formatCost(costs.reduce((sum, cost) => sum + cost, 0)) : "—"}
          caption={`Demo costs · ${runs.length - costs.length} runs unreported`}
          icon="dollar"
        />
      </div>
      <section className="panel">
        <SectionHeader
          title="Recent evaluations"
          caption="One task. Multiple models. Comparable results."
          href="/evaluations"
        />
        <EvaluationTable evaluations={evaluations.slice(0, 5)} />
      </section>
      <div className="overview-bottom">
        <section className="panel outcome-panel">
          <SectionHeader
            title="Run outcomes"
            caption="Test outcomes stay separate from execution status."
          />
          <div className="outcome-content">
            <div className="outcome-total">
              <strong>{runs.length}</strong>
              <span>model runs</span>
            </div>
            <div
              className="outcome-bar"
              aria-label={`${passed} passed, ${graded.length - passed} test failures, ${failed} infrastructure failures, ${active} active, ${queued} queued`}
            >
              {[
                { count: passed, color: "passed", label: "Tests passed" },
                { count: graded.length - passed, color: "test-failed", label: "Tests failed" },
                { count: failed, color: "failed", label: "Infrastructure failed" },
                { count: active, color: "running", label: "Active" },
                { count: queued, color: "queued", label: "Queued" },
              ].map((item) =>
                item.count ? (
                  <span
                    key={item.color}
                    className={`outcome-${item.color}`}
                    style={{ flex: item.count }}
                    title={`${item.label}: ${item.count}`}
                  />
                ) : null,
              )}
            </div>
            <dl className="outcome-legend">
              <div>
                <dt>
                  <i className="legend-dot outcome-passed" />
                  Tests passed
                </dt>
                <dd>{passed}</dd>
              </div>
              <div>
                <dt>
                  <i className="legend-dot outcome-test-failed" />
                  Tests failed
                </dt>
                <dd>{graded.length - passed}</dd>
              </div>
              <div>
                <dt>
                  <i className="legend-dot outcome-failed" />
                  Infrastructure failed
                </dt>
                <dd>{failed}</dd>
              </div>
              <div>
                <dt>
                  <i className="legend-dot outcome-running" />
                  Active / queued
                </dt>
                <dd>{active + queued}</dd>
              </div>
            </dl>
          </div>
        </section>
        <section className="panel workflow-panel">
          <SectionHeader
            title="From task to evidence"
            caption="Every evaluation follows the same workflow."
          />
          <ol className="workflow-list">
            <li>
              <span>01</span>
              <div>
                <strong>Define and validate a benchmark task</strong>
                <p>Pin base/reference commits and trusted grading tests.</p>
              </div>
              <Icon name="repo" />
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Run agents in isolation</strong>
                <p>Give each model the same base code and prompt.</p>
              </div>
              <Icon name="terminal" />
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Inspect the results</strong>
                <p>Review tests, logs and the exact patch.</p>
              </div>
              <Icon name="chart" />
            </li>
          </ol>
          <Link href="/guide" className="workflow-link">
            Explore the workflow <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
      <p className="footnote">
        All figures reflect the current demo session. A completed run can still have failing tests.{" "}
        {evaluations.filter((evaluation) => evaluationStatus(evaluation) === "completed").length}{" "}
        evaluations have finished grading.
      </p>
    </>
  );
}
