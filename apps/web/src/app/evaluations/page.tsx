"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { EvaluationTable } from "@/components/evaluation-table";
import { Icon } from "@/components/icon";
import { PageHeading } from "@/components/ui";
import { evaluationStatus, repositoryName } from "@/lib/evaluations";

const filters = ["all", "running", "queued", "completed", "failed"] as const;

export default function EvaluationsPage() {
  const { evaluations } = useDemo();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [model, setModel] = useState("all");
  const models = [
    ...new Map(
      evaluations.flatMap((evaluation) =>
        evaluation.runs.map((run) => [run.modelId, run.modelName] as const),
      ),
    ).entries(),
  ];
  const query = search.toLowerCase().trim();
  const filtered = evaluations.filter(
    (evaluation) =>
      (status === "all" || evaluationStatus(evaluation) === status) &&
      (model === "all" || evaluation.runs.some((run) => run.modelId === model)) &&
      (!query ||
        `${evaluation.title} ${evaluation.task} ${repositoryName(evaluation.repositoryUrl)} ${evaluation.id}`
          .toLowerCase()
          .includes(query)),
  );

  return (
    <>
      <PageHeading
        eyebrow="EVALUATIONS"
        title="Your evaluation history"
        description="Find a task, follow a run, and inspect the evidence behind every result."
        action={
          <Link href="/evaluations/new" className="button button-primary">
            <Icon name="plus" size={17} />
            New evaluation
          </Link>
        }
      />
      <section className="panel">
        <div className="list-toolbar">
          <div className="filter-tabs" aria-label="Filter by status">
            {filters.map((filter) => (
              <button
                key={filter}
                className={status === filter ? "selected" : ""}
                onClick={() => setStatus(filter)}
                aria-pressed={status === filter}
              >
                {filter === "all"
                  ? "All evaluations"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
                <span>
                  {filter === "all"
                    ? evaluations.length
                    : evaluations.filter((evaluation) => evaluationStatus(evaluation) === filter)
                        .length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="search-toolbar">
          <div className="search-input">
            <Icon name="search" size={17} />
            <input
              aria-label="Search evaluations"
              placeholder="Search tasks, repositories or evaluation IDs…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search ? (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <Icon name="close" size={15} />
              </button>
            ) : null}
          </div>
          <select
            aria-label="Filter by model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            <option value="all">All models</option>
            {models.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <button
            className="button button-quiet"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setModel("all");
            }}
          >
            Clear filters
          </button>
        </div>
        <EvaluationTable evaluations={filtered} />
        <div className="table-footer">
          <span>
            {filtered.length} of {evaluations.length} evaluations
          </span>
          <span>Newest first · Demo session</span>
        </div>
      </section>
    </>
  );
}
