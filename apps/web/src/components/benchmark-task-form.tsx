"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { DEMO_TASKS } from "@/lib/demo-data";
import { parseSetupCommands, validateBenchmarkTask } from "@/lib/benchmarks";
import type { BenchmarkTaskInput } from "@/lib/types";
import { useDemo } from "./demo-provider";
import { Icon } from "./icon";

const initial: BenchmarkTaskInput = {
  title: "",
  repository_url: "",
  base_commit: "",
  reference_commit: "",
  prompt: "",
  grading_paths: [],
  fail_to_pass: [],
  pass_to_pass: [],
  test_command: ["python", "-m", "pytest"],
  environment: { image: "", setup_commands: [] },
};
const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function BenchmarkTaskForm() {
  const router = useRouter();
  const { createTask } = useDemo();
  const [spec, setSpec] = useState(initial);
  const [setup, setSetup] = useState("[]");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lists, setLists] = useState({
    grading_paths: "",
    fail_to_pass: "",
    pass_to_pass: "",
    test_command: "python\n-m\npytest",
  });

  function loadExample() {
    const {
      title,
      repository_url,
      base_commit,
      reference_commit,
      prompt,
      grading_paths,
      fail_to_pass,
      pass_to_pass,
      test_command,
      environment,
    } = DEMO_TASKS[0];
    setSpec({
      title,
      repository_url,
      base_commit,
      reference_commit,
      prompt,
      grading_paths,
      fail_to_pass,
      pass_to_pass,
      test_command,
      environment,
    });
    setLists({
      grading_paths: grading_paths.join("\n"),
      fail_to_pass: fail_to_pass.join("\n"),
      pass_to_pass: pass_to_pass.join("\n"),
      test_command: test_command.join("\n"),
    });
    setSetup(JSON.stringify(environment.setup_commands, null, 2));
    setErrors({});
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const request: BenchmarkTaskInput = {
      ...spec,
      title: spec.title.trim(),
      repository_url: spec.repository_url.trim(),
      prompt: spec.prompt.trim(),
      base_commit: spec.base_commit.trim().toLowerCase(),
      reference_commit: spec.reference_commit.trim().toLowerCase(),
      grading_paths: lines(lists.grading_paths),
      fail_to_pass: lines(lists.fail_to_pass),
      pass_to_pass: lines(lists.pass_to_pass),
      test_command: lines(lists.test_command),
      environment: { ...spec.environment, image: spec.environment.image.trim() },
    };
    const nextErrors = validateBenchmarkTask(request);
    try {
      request.environment.setup_commands = parseSetupCommands(setup);
    } catch (cause) {
      nextErrors.setup = cause instanceof Error ? cause.message : "Invalid setup commands.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(`task-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    const id = createTask(request);
    router.push(`/tasks/${id}`);
  }

  function textField(
    field: "title" | "repository_url" | "base_commit" | "reference_commit" | "prompt",
    label: string,
    help: string,
    multiline = false,
  ) {
    const common = {
      id: `task-${field}`,
      value: spec[field],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setSpec((previous) => ({ ...previous, [field]: event.target.value })),
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": `help-${field}`,
    };
    return (
      <div className="field">
        <label htmlFor={`task-${field}`}>
          {label} <span className="required-marker">*</span>
        </label>
        {multiline ? (
          <textarea {...common} rows={5} maxLength={50000} />
        ) : (
          <input
            {...common}
            className={field.includes("commit") ? "mono" : ""}
            maxLength={field === "title" ? 200 : undefined}
            placeholder={
              field === "repository_url" ? "https://github.com/owner/repository" : undefined
            }
          />
        )}
        <p id={`help-${field}`} className={errors[field] ? "field-error" : "field-help"}>
          {errors[field] ?? help}
        </p>
      </div>
    );
  }

  function listField(field: keyof typeof lists, label: string, help: string) {
    return (
      <div className="field">
        <label htmlFor={`task-${field}`}>{label}</label>
        <textarea
          id={`task-${field}`}
          className="mono"
          rows={3}
          value={lists[field]}
          onChange={(event) =>
            setLists((previous) => ({ ...previous, [field]: event.target.value }))
          }
          aria-invalid={Boolean(errors[field])}
          aria-describedby={`help-${field}`}
        />
        <p id={`help-${field}`} className={errors[field] ? "field-error" : "field-help"}>
          {errors[field] ?? help}
        </p>
      </div>
    );
  }

  return (
    <form className="create-layout" onSubmit={submit} noValidate>
      <div className="form-sections">
        <section className="panel form-section">
          <div className="form-section-heading">
            <span className="step-number">1</span>
            <div>
              <h2>Pin the problem and reference fix</h2>
              <p>Agents start before the fix; the evaluator holds the reference.</p>
            </div>
            <button type="button" className="text-link example-button" onClick={loadExample}>
              Use fictional example
              <Icon name="arrow" size={14} />
            </button>
          </div>
          {textField("title", "Task title", "Give this reusable benchmark a concise name.")}
          {textField(
            "repository_url",
            "GitHub repository",
            "A public repository containing both revisions.",
          )}
          <div className="command-fields">
            {textField(
              "base_commit",
              "Base commit",
              "Full SHA before the fix. This is the agent's starting code.",
            )}
            {textField(
              "reference_commit",
              "Reference commit",
              "Full SHA of the known-good fix. Evaluator-only.",
            )}
          </div>
          {textField(
            "prompt",
            "Natural-language task",
            "Describe the required behavior without revealing the reference solution. The tests must not demand unstated details.",
            true,
          )}
        </section>
        <section className="panel form-section">
          <div className="form-section-heading">
            <span className="step-number">2</span>
            <div>
              <h2>Define trusted grading tests</h2>
              <p>Select the test files and fixtures to extract from the reference commit.</p>
            </div>
          </div>
          {listField(
            "grading_paths",
            "Reference test / fixture paths",
            "One exact repository-relative file or directory per line. Include fixture dependencies; exclude the solution's source files.",
          )}
          {listField(
            "fail_to_pass",
            "Fix tests · fail → pass",
            "At least one exact collected test ID per line. These must fail on base and pass on reference.",
          )}
          {listField(
            "pass_to_pass",
            "Regression tests · pass → pass",
            "Exact test IDs that must pass on both revisions and on the agent's patch. Leave empty only when no regression cohort exists.",
          )}
          {listField(
            "test_command",
            "Grading command",
            "One argument per line, executable first. Use a test runner/parser that reports these exact test IDs.",
          )}
        </section>
        <section className="panel form-section">
          <div className="form-section-heading">
            <span className="step-number">3</span>
            <div>
              <h2>Pin the environment</h2>
              <p>Use identical runtime and setup for baseline, reference and candidate.</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="task-image">Docker image digest</label>
            <input
              id="task-image"
              className="mono"
              value={spec.environment.image}
              onChange={(event) =>
                setSpec((previous) => ({
                  ...previous,
                  environment: { ...previous.environment, image: event.target.value },
                }))
              }
              placeholder="registry/image@sha256:…"
              aria-invalid={Boolean(errors.image)}
              aria-describedby="help-image"
            />
            <p id="help-image" className={errors.image ? "field-error" : "field-help"}>
              {errors.image ??
                "Use an immutable image digest. The fictional example is not a runnable image."}
            </p>
          </div>
          <div className="field">
            <label htmlFor="task-setup">Dependency setup commands</label>
            <textarea
              id="task-setup"
              className="mono"
              rows={4}
              value={setup}
              onChange={(event) => setSetup(event.target.value)}
              aria-invalid={Boolean(errors.setup)}
              aria-describedby="help-setup"
            />
            <p id="help-setup" className={errors.setup ? "field-error" : "field-help"}>
              {errors.setup ??
                'JSON command arrays, e.g. [["python", "-m", "pip", "install", "-e", ".[test]"]]. No implicit shell.'}
            </p>
          </div>
        </section>
        <div className="form-actions">
          <Link href="/tasks" className="button button-secondary">
            Cancel
          </Link>
          <button type="submit" className="button button-primary" disabled={submitting}>
            <Icon name="plus" size={16} />
            {submitting ? "Saving…" : "Save unvalidated demo task"}
          </button>
        </div>
      </div>
      <aside className="form-aside">
        <div className="panel review-panel">
          <span className="small-eyebrow">BENCHMARK LIFECYCLE</span>
          <h2>Validate before comparing.</h2>
          <p>
            The worker must prove the new tests fail before the fix and pass after it. Existing
            regression tests must stay passing.
          </p>
          <dl>
            <div>
              <dt>Agent inputs</dt>
              <dd>Base code + prompt</dd>
            </div>
            <div>
              <dt>Evaluator inputs</dt>
              <dd>Reference tests + fixtures</dd>
            </div>
            <div>
              <dt>Initial status</dt>
              <dd>Unvalidated</dd>
            </div>
          </dl>
          <div className="review-note">
            <Icon name="info" size={16} />
            <span>
              This form validates input shape only. No Git objects, image, tests or baseline
              outcomes are checked. New tasks cannot run until a validation worker is implemented.
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}
