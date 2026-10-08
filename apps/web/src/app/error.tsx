"use client";

import { EmptyState } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel missing-evaluation">
      <EmptyState
        title="This view could not be loaded"
        description="Try opening the view again. Demo submissions reset if you refresh the browser."
        action={
          <button onClick={reset} className="button button-primary">
            Try again
          </button>
        }
      />
    </section>
  );
}
