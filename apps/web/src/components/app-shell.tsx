"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "grid" },
  { href: "/tasks", label: "Benchmark tasks", icon: "book" },
  { href: "/evaluations", label: "Evaluations", icon: "layers" },
  { href: "/compare", label: "Model comparison", icon: "chart" },
  { href: "/guide", label: "Getting started", icon: "book" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = navigation.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="AgentBench overview">
          <span className="brand-mark">
            <Icon name="terminal" size={21} />
          </span>
          <span>
            AgentBench<span className="brand-version"> / alpha</span>
          </span>
        </Link>
        <div className="workspace-switch">
          <span className="workspace-avatar">AB</span>
          <div>
            <strong>Demo workspace</strong>
            <small>Personal workspace</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation" className="navigation">
          {navigation.map((item) => {
            const active = item === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-eyebrow">
              <span className="status-dot" /> FRONTEND PREVIEW
            </span>
            <p>A place to explore the evaluation workflow.</p>
            <Link href="/guide">
              See how it works <Icon name="arrow" size={14} />
            </Link>
          </div>
          <div className="workspace-footer">
            <span className="workspace-avatar muted">D</span>
            <div>
              <strong>Demo session</strong>
              <small>Resets on refresh</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <Icon name="chevron" size={13} />
            <strong>{current?.label ?? "Evaluations"}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment-label">
              <span className="status-dot" /> Demo mode
            </span>
            <Link href="/evaluations/new" className="button button-primary button-small">
              <Icon name="plus" size={15} />
              New evaluation
            </Link>
          </div>
        </header>
        <div className="demo-banner">
          <Icon name="info" size={15} />
          <span>
            Demo data. Model runs, costs and outcomes are illustrative; submissions stay in this
            browser session.
          </span>
          <Link href="/guide">
            Implementation guide <Icon name="arrow" size={13} />
          </Link>
        </div>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="page-footer">
          <span>AgentBench · Open-source agent evaluation</span>
          <span>Build. Run. Measure.</span>
        </footer>
      </div>
    </div>
  );
}
