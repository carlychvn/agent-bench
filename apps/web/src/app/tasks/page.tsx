"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { Icon } from "@/components/icon";
import { EmptyState, PageHeading, ValidationBadge } from "@/components/ui";
import { repositoryName } from "@/lib/evaluations";

export default function TasksPage() {
  const { tasks } = useDemo();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = tasks.filter(
    (task) =>
      (status === "all" || task.validation.status === status) &&
      `${task.title} ${task.repository_url} ${task.base_commit} ${task.reference_commit}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="BENCHMARK TASKS"
        title="Reusable tasks. Reproducible inputs."
        description="A task fixes the base revision, prompt, trusted tests and environment before models are compared."
        action={
          <Link href="/tasks/new" className="button button-primary">
            <Icon name="plus" size={16} />
            Define task
          </Link>
        }
      />
      <section className="panel">
        <div className="search-toolbar">
          <div className="search-input">
            <Icon name="search" size={16} />
            <input
              aria-label="Search benchmark tasks"
              placeholder="Search tasks, repositories or commit SHAs…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            aria-label="Filter validation status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All tasks</option>
            <option value="validated">Validated samples</option>
            <option value="unvalidated">Unvalidated</option>
            <option value="validating">Validating</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="evaluation-table">
              <thead>
                <tr>
                  <th scope="col">Benchmark task</th>
                  <th scope="col">Base → reference</th>
                  <th scope="col">Required tests</th>
                  <th scope="col">Validation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <Link href={`/tasks/${task.id}`} className="evaluation-title">
                        {task.title}
                        <Icon name="arrow" size={14} />
                      </Link>
                      <span className="repository-line">
                        <Icon name="repo" size={12} />
                        {repositoryName(task.repository_url)}
                      </span>
                    </td>
                    <td className="mono secondary-text">
                      {task.base_commit.slice(0, 7)} → {task.reference_commit.slice(0, 7)}
                    </td>
                    <td>
                      {task.fail_to_pass.length} fix · {task.pass_to_pass.length} regression
                    </td>
                    <td>
                      <ValidationBadge status={task.validation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching benchmark tasks"
            description="Clear your filters or define a new reusable task."
          />
        )}
        <div className="table-footer">
          <span>{filtered.length} tasks</span>
          <span>New tasks start unvalidated · Sample validation is fictional</span>
        </div>
      </section>
    </>
  );
}
