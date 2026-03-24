import { SectionCard } from "@/components/interview/SectionCard";

type InterviewFeedbackPanelProps = {
  feedback: string | null;
  followUp: string | null;
  idealAnswer: string | null;
};

export function InterviewFeedbackPanel({
  feedback,
  followUp,
  idealAnswer,
}: InterviewFeedbackPanelProps) {
  const hasContent = feedback || followUp || idealAnswer;

  if (!hasContent) {
    return null;
  }

  return (
    <SectionCard
      title="Feedback on Your Answer"
      subtitle="Use this guidance to improve before moving on to the next question."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {feedback ? (
          <div className="rounded-3xl bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Feedback
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
              {feedback}
            </p>
          </div>
        ) : null}

        {followUp ? (
          <div className="rounded-3xl bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Next Step
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
              {followUp}
            </p>
          </div>
        ) : null}
      </div>

      {idealAnswer ? (
        <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Strong Answer Example
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-sky-950">
            {idealAnswer}
          </p>
        </div>
      ) : null}
    </SectionCard>
  );
}
