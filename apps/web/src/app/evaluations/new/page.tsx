import { EvaluationForm } from "@/components/evaluation-form";
import { PageHeading } from "@/components/ui";

export const metadata = { title: "New evaluation" };

export default async function NewEvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const { task } = await searchParams;
  return (
    <>
      <PageHeading
        eyebrow="EVALUATIONS / NEW"
        title="Evaluate a benchmark task"
        description="Choose a validated task and compare models against its pinned inputs and trusted grading tests."
      />
      <EvaluationForm initialTaskId={task} />
    </>
  );
}
