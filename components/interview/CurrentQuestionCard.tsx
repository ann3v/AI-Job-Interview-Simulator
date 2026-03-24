import { SectionCard } from "@/components/interview/SectionCard";

type CurrentQuestionCardProps = {
  question: string | null;
  focusPoints: string[];
  loading: boolean;
};

export function CurrentQuestionCard({
  question,
  focusPoints,
  loading,
}: CurrentQuestionCardProps) {
  return (
    <SectionCard
      title="Your Interview Question"
      subtitle="Read the prompt first, then use the answer box below to respond as if you were in a live interview."
    >
      {loading && !question ? (
        <div className="rounded-3xl bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Generating your first question...
        </div>
      ) : question ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-zinc-50 p-6">
            <p className="whitespace-pre-wrap text-lg leading-8 text-zinc-900 sm:text-xl">
              {question}
            </p>
          </div>

          {focusPoints.length > 0 ? (
            <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                Helpful Focus Areas
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-sky-900">
                {focusPoints.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm leading-7 text-zinc-500">
          Start the interview to receive your first question.
        </div>
      )}
    </SectionCard>
  );
}
