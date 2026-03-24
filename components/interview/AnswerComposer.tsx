import { FormEvent } from "react";
import { SectionCard } from "@/components/interview/SectionCard";

type AnswerComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  loading: boolean;
};

export function AnswerComposer({
  value,
  onChange,
  onSubmit,
  error,
  loading,
}: AnswerComposerProps) {
  return (
    <SectionCard
      title="Your Answer"
      subtitle="Keep your answer concise, explain your reasoning, and include practical tradeoffs when relevant."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="answer-input"
            className="text-sm font-medium text-zinc-700"
          >
            Answer the current interview question
          </label>
          <textarea
            id="answer-input"
            name="answer-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Write the answer you would give in a real interview..."
            className="min-h-48 w-full rounded-3xl border border-zinc-300 bg-zinc-50 px-5 py-4 text-base leading-7 text-zinc-900 outline-none transition focus:border-sky-500 focus:bg-white"
            disabled={loading}
          />
        </div>

        {error ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-zinc-500">
            Submit one answer at a time. The next question will appear above
            after the AI evaluates this response.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-44 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                Reviewing answer...
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
