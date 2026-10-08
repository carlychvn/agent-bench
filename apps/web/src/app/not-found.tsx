import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="panel missing-evaluation">
      <EmptyState
        title="Page not found"
        description="This page does not exist. Head back to your evaluation workspace."
        action={
          <Link href="/" className="button button-primary">
            Back to overview
          </Link>
        }
      />
    </section>
  );
}
