import Link from "next/link";
import { Icon } from "@/components/icon";
import { PageHeading, SectionHeader } from "@/components/ui";

export const metadata = { title: "Getting started" };

export default function GuidePage() {
  return (
    <>
      <PageHeading
        eyebrow="GETTING STARTED"
        title="A task. A fair test. A clear result."
        description="AgentBench brings the inputs and evidence of an agent evaluation into one workspace."
      />
      <section className="guide-hero">
        <div>
          <span className="small-eyebrow">EXPLORE THE PREVIEW</span>
          <h2>Take the workflow for a spin.</h2>
          <p>
            The demo workspace contains sample evaluations covering successful runs, failing tests,
            queued work and execution errors. No credentials are needed.
          </p>
          <Link href="/evaluations/eval-001" className="button button-primary">
            Open a sample evaluation
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="guide-terminal">
          <span>
            <i />
            <i />
            <i />
            <small>evaluation / demo</small>
          </span>
          <pre>
            <span className="terminal-muted">AgentBench / evaluation preview</span>
            {"\n\n"}repository <span>expression-kit</span>
            {"\n"}models <span>2 selected</span>
            {"\n"}tests <span className="terminal-green">4 passed</span>
            {"\n"}artifacts <span>logs · results · diff</span>
            {"\n\n"}
            <span className="terminal-muted">Same task. Same commit. Different agents.</span>
          </pre>
        </div>
      </section>
      <div className="guide-grid">
        {[
          {
            number: "01",
            icon: "repo" as const,
            title: "Define the task",
            description:
              "Pin the base and reference commits. Describe the behavior and select the reference tests and fixtures. Validate fail-to-pass and pass-to-pass outcomes before evaluating agents.",
            href: "/tasks/new",
            link: "Define a demo benchmark",
          },
          {
            number: "02",
            icon: "terminal" as const,
            title: "Follow the run",
            description:
              "Each model gets the same base code and prompt. The reference fix, hidden grading tests and future Git history stay outside its workspace. The trusted grader evaluates its source changes in a clean checkout.",
            href: "/evaluations/eval-001",
            link: "Inspect sample runs",
          },
          {
            number: "03",
            icon: "chart" as const,
            title: "Review the evidence",
            description:
              "Required fix tests must pass, and regression tests must stay passing. Missing test IDs cannot count as success. A completed run means grading finished, not that the benchmark was solved.",
            href: "/compare",
            link: "Compare sample models",
          },
        ].map((step) => (
          <section className="panel guide-step" key={step.number}>
            <div>
              <span className="guide-number">{step.number}</span>
              <Icon name={step.icon} size={23} />
            </div>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
            <Link href={step.href} className="text-link">
              {step.link}
              <Icon name="arrow" size={14} />
            </Link>
          </section>
        ))}
      </div>
      <section className="panel">
        <SectionHeader title="What is available in this preview?" />
        <div className="capability-list">
          <div>
            <Icon name="check" />
            <strong>Explore evaluation history</strong>
            <span>Search, filter and open sample evaluations.</span>
            <span className="subtle-tag">Available</span>
          </div>
          <div>
            <Icon name="check" />
            <strong>Create a demo evaluation</strong>
            <span>Choose a validated sample task and add model runs to this session.</span>
            <span className="subtle-tag">Available</span>
          </div>
          <div>
            <Icon name="check" />
            <strong>Review model evidence</strong>
            <span>Switch runs, read logs and tests, and inspect demo diffs.</span>
            <span className="subtle-tag">Available</span>
          </div>
          <div>
            <Icon name="check" />
            <strong>Define benchmark tasks</strong>
            <span>Save pinned inputs as unvalidated demo tasks and inspect sample evidence.</span>
            <span className="subtle-tag">Available</span>
          </div>
          <div>
            <Icon name="clock" />
            <strong>Validate and execute real tasks</strong>
            <span>
              Test extraction, baseline/reference validation, model calls and grading are planned.
            </span>
            <span className="subtle-tag muted-tag">Coming next</span>
          </div>
          <div>
            <Icon name="clock" />
            <strong>Save results across sessions</strong>
            <span>Persistent history and shared workspaces are planned.</span>
            <span className="subtle-tag muted-tag">Coming next</span>
          </div>
        </div>
      </section>
      <div className="guide-bottom">
        <Icon name="book" size={22} />
        <div>
          <h3>Building AgentBench?</h3>
          <p>
            The repository README includes setup instructions, the implementation sequence and
            optional additions. Start with persistence and one complete evaluation flow.
          </p>
        </div>
      </div>
    </>
  );
}
