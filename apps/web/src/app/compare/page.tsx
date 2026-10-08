"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { Icon } from "@/components/icon";
import { EmptyState, PageHeading, SectionHeader, StatCard } from "@/components/ui";
import { formatCost, formatDuration, repositoryName, testOutcome } from "@/lib/evaluations";

export default function ComparePage() {
  const { evaluations } = useDemo();
  const [repository, setRepository] = useState("all");
  const [sort, setSort] = useState("success");
  const repositories = [...new Set(evaluations.map((evaluation) => evaluation.repositoryUrl))];
  const selected = evaluations.filter(
    (evaluation) => repository === "all" || evaluation.repositoryUrl === repository,
  );
  const runs = selected.flatMap((evaluation) => evaluation.runs);
  const modelIds = [...new Set(runs.map((run) => run.modelId))];
  const models = modelIds
    .map((id) => {
      const modelRuns = runs.filter((run) => run.modelId === id);
      const graded = modelRuns.filter((run) => testOutcome(run) !== "pending");
      const passed = graded.filter((run) => testOutcome(run) === "passed").length;
      const durations = graded.flatMap((run) =>
        run.durationSeconds === null ? [] : [run.durationSeconds],
      );
      const costs = modelRuns.flatMap((run) => (run.costUsd === null ? [] : [run.costUsd]));
      return {
        id,
        name: modelRuns[0].modelName,
        total: modelRuns.length,
        graded: graded.length,
        passed,
        successRate: graded.length ? (passed / graded.length) * 100 : null,
        averageDuration: durations.length
          ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          : null,
        averageCost: costs.length
          ? costs.reduce((sum, value) => sum + value, 0) / costs.length
          : null,
        costCount: costs.length,
        failures: modelRuns.filter((run) => run.status === "failed").length,
      };
    })
    .sort((a, b) =>
      sort === "success"
        ? (b.successRate ?? -1) - (a.successRate ?? -1)
        : sort === "duration"
          ? (a.averageDuration ?? Infinity) - (b.averageDuration ?? Infinity)
          : sort === "cost"
            ? (a.averageCost ?? Infinity) - (b.averageCost ?? Infinity)
            : a.name.localeCompare(b.name),
    );
  const graded = runs.filter((run) => testOutcome(run) !== "pending");
  const matched = selected.filter(
    (evaluation) => evaluation.runs.filter((run) => testOutcome(run) !== "pending").length > 1,
  );

  return (
    <>
      <PageHeading
        eyebrow="MODEL COMPARISON"
        title="Compare the work, not the promise"
        description="Explore task success, execution time and recorded cost across model runs."
      />
      <div className="comparison-controls">
        <label htmlFor="comparison-repository">Repository</label>
        <select
          id="comparison-repository"
          value={repository}
          onChange={(event) => setRepository(event.target.value)}
        >
          <option value="all">All repositories</option>
          {repositories.map((url) => (
            <option value={url} key={url}>
              {repositoryName(url)}
            </option>
          ))}
        </select>
        <label htmlFor="comparison-sort">Sort by</label>
        <select id="comparison-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="success">Success rate</option>
          <option value="duration">Average duration</option>
          <option value="cost">Average recorded cost</option>
          <option value="name">Model name</option>
        </select>
      </div>
      <div className="stats-grid stats-three">
        <StatCard
          label="Models compared"
          value={models.length}
          caption="In the selected repository scope"
          icon="code"
        />
        <StatCard
          label="Graded runs"
          value={graded.length}
          caption="Runs with recorded test outcomes"
          icon="check"
          accent
        />
        <StatCard
          label="Matched evaluations"
          value={matched.length}
          caption="Tasks graded by more than one model"
          icon="layers"
        />
      </div>
      <section className="panel">
        <SectionHeader
          title="Model performance"
          caption="Success means every required benchmark test passed in a graded run."
        />
        {models.length ? (
          <div className="table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Task success</th>
                  <th scope="col">Graded / total</th>
                  <th scope="col">Avg. duration</th>
                  <th scope="col">Avg. recorded cost</th>
                  <th scope="col">Infra. failures</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model, index) => (
                  <tr key={model.id}>
                    <td>
                      <div className="comparison-model">
                        <span className={`model-avatar model-color-${index % 3}`}>
                          {model.name[0]}
                        </span>
                        <div>
                          <strong>{model.name}</strong>
                          <code>{model.id}</code>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="success-cell">
                        <strong>
                          {model.successRate === null ? "—" : `${Math.round(model.successRate)}%`}
                        </strong>
                        <span className="rate-track">
                          <span style={{ width: `${model.successRate ?? 0}%` }} />
                        </span>
                      </div>
                      <small className="muted-text">
                        {model.passed} of {model.graded} passed
                      </small>
                    </td>
                    <td className="mono">
                      {model.graded} / {model.total}
                    </td>
                    <td className="mono">{formatDuration(model.averageDuration)}</td>
                    <td>
                      <span className="mono">{formatCost(model.averageCost)}</span>
                      <small className="metric-note">{model.costCount} reported runs</small>
                    </td>
                    <td>
                      <span className={model.failures ? "danger-text" : "muted-text"}>
                        {model.failures}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No runs to compare"
            description="Create an evaluation with multiple models to explore this view."
          />
        )}
      </section>
      <div className="comparison-note">
        <Icon name="info" size={20} />
        <div>
          <strong>Small samples are a starting point, not a ranking.</strong>
          <p>
            These are fictional demo results. Models have different task samples; use matched
            evaluations to compare the same immutable benchmark task. Missing costs are excluded
            from cost averages. Duration averages include graded runs only.
          </p>
        </div>
      </div>
      <section className="panel">
        <SectionHeader
          title="Compare on the same task"
          caption="Inspect side-by-side runs with shared inputs."
        />
        {matched.length ? (
          <div className="matched-evaluations">
            {matched.map((evaluation) => (
              <Link key={evaluation.id} href={`/evaluations/${evaluation.id}`}>
                <span className="matched-icon">
                  <Icon name="layers" size={19} />
                </span>
                <div>
                  <strong>{evaluation.title}</strong>
                  <small>
                    {repositoryName(evaluation.repositoryUrl)} · {evaluation.runs.length} models ·{" "}
                    {evaluation.commitSha?.slice(0, 7)}
                  </small>
                </div>
                <Icon name="arrow" size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matched graded runs yet"
            description="This scope has no tasks with graded results from more than one model."
          />
        )}
      </section>
    </>
  );
}
