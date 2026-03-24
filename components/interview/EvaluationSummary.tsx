import { SectionCard } from "@/components/interview/SectionCard";
import { VisibleEvaluation } from "@/lib/interview";

type EvaluationSummaryProps = {
  evaluation: VisibleEvaluation | null;
};

export function EvaluationSummary({
  evaluation,
}: EvaluationSummaryProps) {
  if (!evaluation) {
    return null;
  }

  const items = [
    { label: "Score", value: evaluation.score },
    { label: "Correctness", value: evaluation.correctness },
    { label: "Clarity", value: evaluation.clarity },
    { label: "Depth", value: evaluation.depth },
  ].filter((item) => item.value);

  if (items.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title="Evaluation Summary"
      subtitle="A quick snapshot of how your last answer performed."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
