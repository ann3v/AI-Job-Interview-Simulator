"use client";

import { AnswerComposer } from "@/components/interview/AnswerComposer";
import { CurrentQuestionCard } from "@/components/interview/CurrentQuestionCard";
import { EvaluationSummary } from "@/components/interview/EvaluationSummary";
import { InterviewFeedbackPanel } from "@/components/interview/InterviewFeedbackPanel";
import { InterviewHeader } from "@/components/interview/InterviewHeader";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { SectionCard } from "@/components/interview/SectionCard";
import { useInterviewSession } from "@/hooks/useInterviewSession";

export default function Home() {
  const {
    answer,
    currentQuestionState,
    error,
    hasReviewContent,
    hasStarted,
    interviewMeta,
    isAnswering,
    isStarting,
    lastReviewState,
    plainTextResponse,
    resetInterview,
    selectedRole,
    setAnswer,
    setSelectedRole,
    startInterview,
    submitAnswer,
    submittedAnswers,
  } = useInterviewSession();
  const review = hasReviewContent ? lastReviewState : null;

  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-sky-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {!hasStarted ? (
          <InterviewSetup
            role={selectedRole}
            onRoleChange={setSelectedRole}
            onRolePick={setSelectedRole}
            onStart={startInterview}
            error={error}
            loading={isStarting}
          />
        ) : (
          <>
            <InterviewHeader
              role={selectedRole.trim() || "Selected Role"}
              state={interviewMeta}
              onReset={resetInterview}
            />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <CurrentQuestionCard
                  question={currentQuestionState.questionText}
                  focusPoints={currentQuestionState.focusAreas}
                  loading={isStarting}
                />
                <AnswerComposer
                  value={answer}
                  onChange={setAnswer}
                  onSubmit={submitAnswer}
                  error={error}
                  loading={isAnswering}
                />
              </div>

              <SectionCard
                title="Session Guide"
                subtitle="A quick reminder of how this practice flow works."
              >
                <div className="space-y-4">
                  <div className="rounded-3xl bg-zinc-50 p-5">
                    <p className="text-sm font-semibold text-zinc-950">
                      Target role
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {selectedRole.trim()}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-zinc-50 p-5">
                    <p className="text-sm font-semibold text-zinc-950">
                      Interview flow
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      You answer the current question first. Coaching and
                      evaluation appear after each answer so the screen stays
                      focused on the interview itself.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-zinc-50 p-5">
                    <p className="text-sm font-semibold text-zinc-950">
                      Progress
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {submittedAnswers === 0
                        ? "No answers submitted yet."
                        : `${submittedAnswers} answer${submittedAnswers === 1 ? "" : "s"} reviewed so far.`}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {plainTextResponse ? (
              <SectionCard
                title="Interview Update"
                subtitle="The backend returned plain text for this step, so it is shown directly below."
              >
                <div className="rounded-3xl bg-zinc-50 p-6">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700">
                    {plainTextResponse}
                  </pre>
                </div>
              </SectionCard>
            ) : null}

            {review ? (
              <>
                <SectionCard
                  title="Review of Your Previous Answer"
                  subtitle={
                    review.reviewedQuestionNumber
                      ? `Feedback for Question ${review.reviewedQuestionNumber}.`
                      : "Feedback for the answer you just submitted."
                  }
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    {review.reviewedQuestionText ? (
                      <div className="rounded-3xl bg-zinc-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Previous question
                        </p>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                          {review.reviewedQuestionText}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-3xl bg-zinc-50 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Your submitted answer
                      </p>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                        {review.submittedAnswer}
                      </p>
                    </div>
                  </div>
                </SectionCard>
                <EvaluationSummary evaluation={review.evaluation} />
                <InterviewFeedbackPanel
                  feedback={review.feedback}
                  followUp={review.followUp}
                  idealAnswer={review.strongAnswerExample}
                />
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
