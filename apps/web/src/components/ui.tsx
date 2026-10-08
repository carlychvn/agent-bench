import Link from "next/link";
import type { ReactNode } from "react";
import type { EvaluationStatus, RunStatus, ValidationStatus } from "@/lib/types";
import { Icon, type IconName } from "./icon";

export function StatusBadge({ status }: { status: EvaluationStatus | RunStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="badge-dot" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action ? <div className="heading-action">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  caption,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: IconName;
  accent?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {label}
        <Icon name={icon} size={17} />
      </div>
      <div className={`stat-value ${accent ? "accent-text" : ""}`}>{value}</div>
      <p>{caption}</p>
    </div>
  );
}

export function EmptyState({
  icon = "layers",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  caption,
  href,
  linkLabel = "View all",
}: {
  title: string;
  caption?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {caption ? <p>{caption}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-link">
          {linkLabel}
          <Icon name="arrow" size={15} />
        </Link>
      ) : null}
    </div>
  );
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const color = status === "validated" ? "completed" : status === "rejected" ? "failed" : "queued";
  return (
    <span className={`status-badge status-${color}`}>
      <span className="badge-dot" />
      {status === "validated"
        ? "Validated sample"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
