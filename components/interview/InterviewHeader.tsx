import { Pill } from "@/components/interview/Pill";
import { InterviewState, getMeaningfulText } from "@/lib/interview";

type InterviewHeaderProps = {
  role: string;
  state: InterviewState | undefined;
  onReset: () => void;
  resetDisabled?: boolean;
};

export function InterviewHeader({
  role,
  state,
  onReset,
  resetDisabled = false,
}: InterviewHeaderProps) {
  const questionNumber =
    typeof state?.question_number === "number"
      ? `Question ${state.question_number}`
      : "Interview in progress";
  const difficulty = getMeaningfulText(state?.difficulty);
  const topic = getMeaningfulText(state?.topic);

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">{role}</Pill>
            <Pill>{questionNumber}</Pill>
            {difficulty ? <Pill>{difficulty}</Pill> : null}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Interview Progress
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Stay focused on the current question and answer clearly. Feedback
              and coaching tips will appear after each submission.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {topic ? (
            <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
              Current topic:{" "}
              <span className="font-semibold text-zinc-950">{topic}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            disabled={resetDisabled}
            title={
              resetDisabled
                ? "Wait for the current response before changing roles."
                : undefined
            }
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:hover:bg-transparent"
          >
            Change Role
          </button>
        </div>
      </div>
    </section>
  );
}
