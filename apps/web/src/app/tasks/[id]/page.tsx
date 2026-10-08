import { BenchmarkTaskDetail } from "@/components/benchmark-task-detail";

export const metadata = { title: "Benchmark task" };

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BenchmarkTaskDetail id={id} />;
}
