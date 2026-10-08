import Link from "next/link";
import {
  evaluationStatus,
  formatDate,
  formatDuration,
  repositoryName,
  testOutcome,
} from "@/lib/evaluations";
import type { Evaluation } from "@/lib/types";
import { Icon } from "./icon";
import { EmptyState, StatusBadge } from "./ui";

export function EvaluationTable({ evaluations }: { evaluations: Evaluation[] }) {
  if (evaluations.length === 0)
    return (
      <EmptyState
        icon="search"
        title="No matching evaluations"
        description="Try another search or clear your filters."
      />
    );

  return (
    <div className="table-scroll">
      <table className="evaluation-table">
        <thead>
          <tr>
            <th scope="col">Evaluation</th>
            <th scope="col">Models</th>
            <th scope="col">Status</th>
            <th scope="col">Tasks solved</th>
            <th scope="col">Duration</th>
            <th scope="col">Created · UTC</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((evaluation) => {
            const graded = evaluation.runs.filter((run) => testOutcome(run) !== "pending");
            const passed = graded.filter((run) => testOutcome(run) === "passed").length;
            const durations = evaluation.runs.flatMap((run) =>
              run.durationSeconds === null ? [] : [run.durationSeconds],
            );
            return (
              <tr key={evaluation.id}>
                <td>
                  <Link className="evaluation-title" href={`/evaluations/${evaluation.id}`}>
                    {evaluation.title}
                    <Icon name="arrow" size={14} />
                  </Link>
                  <span className="repository-line">
                    <Icon name="repo" size={12} />
                    {repositoryName(evaluation.repositoryUrl)}
                  </span>
                </td>
                <td>
                  <div className="model-stack">
                    {evaluation.runs.map((run, index) => (
                      <span
                        key={run.id}
                        className={`model-avatar model-color-${index % 3}`}
                        title={run.modelName}
                      >
                        {run.modelName[0]}
                      </span>
                    ))}
                    <span className="model-count">
                      {evaluation.runs.length} {evaluation.runs.length === 1 ? "model" : "models"}
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge status={evaluationStatus(evaluation)} />
                </td>
                <td>
                  {graded.length ? (
                    <span
                      className={`test-ratio ${passed === graded.length ? "accent-text" : "warning-text"}`}
                    >
                      <Icon name={passed === graded.length ? "check" : "close"} size={14} />
                      {passed}/{graded.length} runs
                    </span>
                  ) : (
                    <span className="muted-text">—</span>
                  )}
                </td>
                <td className="mono secondary-text">
                  {durations.length ? formatDuration(Math.max(...durations)) : "—"}
                </td>
                <td className="date-cell">{formatDate(evaluation.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
