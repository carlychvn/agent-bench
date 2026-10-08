import { EvaluationDetail } from "@/components/evaluation-detail";

export const metadata = { title: "Evaluation details" };

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EvaluationDetail id={id} />;
}
