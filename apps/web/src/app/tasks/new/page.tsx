import { BenchmarkTaskForm } from "@/components/benchmark-task-form";
import { PageHeading } from "@/components/ui";

export const metadata = { title: "Define benchmark task" };

export default function NewTaskPage() {
  return (
    <>
      <PageHeading
        eyebrow="BENCHMARK TASKS / NEW"
        title="Turn a real fix into a benchmark"
        description="Pin the code before a fix, describe the task, and select trusted tests from the reference revision."
      />
      <BenchmarkTaskForm />
    </>
  );
}
