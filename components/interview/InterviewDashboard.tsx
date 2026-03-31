"use client";

import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnswerComposer } from "@/components/interview/AnswerComposer";
import { CurrentQuestionCard } from "@/components/interview/CurrentQuestionCard";
import { EvaluationSummary } from "@/components/interview/EvaluationSummary";
import { InterviewFeedbackPanel } from "@/components/interview/InterviewFeedbackPanel";
import { InterviewHeader } from "@/components/interview/InterviewHeader";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { Pill } from "@/components/interview/Pill";
import { SectionCard } from "@/components/interview/SectionCard";
import { useAuth } from "@/context/AuthContext";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import {
  deleteInterviewSession,
  listInterviewSessions,
  listInterviewTurns,
  type PersistedInterviewSession,
  type PersistedInterviewTurn,
} from "@/lib/interview-store";

function getDisplayName(fullName: unknown, fallbackEmail: string | undefined) {
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  return fallbackEmail ?? "Candidate";
}

function formatSessionStatus(status: PersistedInterviewSession["status"]) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "abandoned":
      return "Abandoned";
    default:
      return "Saved";
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function InterviewDashboard() {
  const { loading, user } = useAuth();
  const {
    activeSessionId,
    activeSessionStatus,
    answer,
    currentQuestionState,
    error,
    hasReviewContent,
    hasStarted,
    interviewMeta,
    isAnswering,
    isRestoringSession,
    isStarting,
    lastReviewState,
    plainTextResponse,
    persistenceRevision,
    resetInterview,
    resumeSession,
    selectedRole,
    setAnswer,
    setSelectedRole,
    startInterview,
    submitAnswer,
    submittedAnswers,
  } = useInterviewSession();
  const [savedSessions, setSavedSessions] = useState<PersistedInterviewSession[]>(
    []
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionTurns, setSelectedSessionTurns] = useState<
    PersistedInterviewTurn[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const review = hasReviewContent ? lastReviewState : null;
  const selectedSession =
    savedSessions.find((session) => session.id === selectedSessionId) ?? null;
  const displayName = getDisplayName(
    user?.user_metadata?.full_name,
    user?.email
  );

  useEffect(() => {
    if (loading || isRestoringSession) {
      return;
    }

    if (!user) {
      setSavedSessions([]);
      setSelectedSessionId(null);
      setSelectedSessionTurns([]);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }

    const userId = user.id;
    let isActive = true;

    async function loadSavedSessions() {
      setHistoryLoading(true);

      try {
        const sessions = await listInterviewSessions(userId);

        if (!isActive) {
          return;
        }

        setSavedSessions(sessions);
        setHistoryError(null);
        setSelectedSessionId((currentSelection) => {
          if (currentSelection && sessions.some((session) => session.id === currentSelection)) {
            return currentSelection;
          }

          return sessions[0]?.id ?? null;
        });
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setHistoryError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your interview history right now."
        );
      } finally {
        if (isActive) {
          setHistoryLoading(false);
        }
      }
    }

    void loadSavedSessions();

    return () => {
      isActive = false;
    };
  }, [isRestoringSession, loading, persistenceRevision, user]);

  useEffect(() => {
    if (loading || !user || !selectedSessionId) {
      setSelectedSessionTurns([]);
      setSessionDetailLoading(false);
      return;
    }

    const sessionId = selectedSessionId;
    const userId = user.id;
    let isActive = true;

    async function loadSessionTurns() {
      setSessionDetailLoading(true);

      try {
        const turns = await listInterviewTurns(sessionId, userId);

        if (!isActive) {
          return;
        }

        setSelectedSessionTurns(turns);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setHistoryError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the selected interview session."
        );
      } finally {
        if (isActive) {
          setSessionDetailLoading(false);
        }
      }
    }

    void loadSessionTurns();

    return () => {
      isActive = false;
    };
  }, [loading, selectedSessionId, user]);

  async function handleDeleteSession(sessionId: string) {
    if (!user || deletingSessionId) {
      return;
    }

    const userId = user.id;
    setDeletingSessionId(sessionId);
    setHistoryError(null);

    try {
      await deleteInterviewSession(sessionId, userId);

      const sessions = await listInterviewSessions(userId);
      setSavedSessions(sessions);
      setSelectedSessionId((currentSelection) => {
        if (currentSelection && currentSelection !== sessionId) {
          return currentSelection;
        }

        return sessions[0]?.id ?? null;
      });

      if (selectedSessionId === sessionId) {
        setSelectedSessionTurns([]);
      }
    } catch (deleteError) {
      setHistoryError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this interview session right now."
      );
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleResumeSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    await resumeSession(sessionId);
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-sky-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Pill tone="accent">Protected Dashboard</Pill>
                <Pill>{displayName}</Pill>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  AI Job Interview Simulator
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                  Practice role-specific interview questions, stay focused on
                  one answer at a time, and review the AI feedback after each
                  submission.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
                Signed in as{" "}
                <span className="font-semibold text-zinc-950">
                  {user?.email ?? "your account"}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </section>

        {isRestoringSession ? (
          <SectionCard
            title="Restoring Session"
            subtitle="Checking Supabase for an in-progress interview so you can pick up where you left off."
          >
            <div className="flex items-center gap-3 rounded-3xl bg-zinc-50 p-5 text-sm font-medium text-zinc-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
              Restoring your latest interview...
            </div>
          </SectionCard>
        ) : !hasStarted ? (
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

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <SectionCard
            title="Interview History"
            subtitle="Review the sessions saved to Supabase for this signed-in account."
          >
            {historyError ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {historyError}
              </div>
            ) : null}

            {historyLoading ? (
              <div className="flex items-center gap-3 rounded-3xl bg-zinc-50 p-5 text-sm font-medium text-zinc-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
                Loading saved sessions...
              </div>
            ) : savedSessions.length === 0 ? (
              <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                No interview sessions saved yet. Start an interview to create
                your first persistent record.
              </div>
            ) : (
              <div className="space-y-3">
                {savedSessions.map((session) => {
                  const isSelected = session.id === selectedSessionId;
                  const isActiveSession = session.id === activeSessionId;
                  const canResume =
                    session.status === "in_progress" &&
                    !hasStarted &&
                    !isRestoringSession;
                  const isDeleting = deletingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedSessionId(session.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedSessionId(session.id);
                        }
                      }}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        isSelected
                          ? "border-sky-300 bg-sky-50"
                          : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone={session.status === "in_progress" ? "accent" : "neutral"}>
                            {formatSessionStatus(session.status)}
                          </Pill>
                          {isActiveSession ? <Pill>Current Session</Pill> : null}
                        </div>

                        <div className="space-y-1">
                          <p className="text-base font-semibold text-zinc-950">
                            {session.targetRole}
                          </p>
                          <p className="text-sm text-zinc-600">
                            Updated {formatDateTime(session.updatedAt)}
                          </p>
                          <p className="text-sm text-zinc-600">
                            {session.submittedAnswersCount} answered question
                            {session.submittedAnswersCount === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canResume ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleResumeSession(session.id);
                              }}
                              className="inline-flex items-center rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800"
                            >
                              Resume
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isDeleting || (isActiveSession && hasStarted)) {
                                return;
                              }
                              void handleDeleteSession(session.id);
                            }}
                            disabled={isDeleting || (isActiveSession && hasStarted)}
                            className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                              isDeleting || (isActiveSession && hasStarted)
                                ? "cursor-not-allowed border-zinc-200 text-zinc-400"
                                : "cursor-pointer border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-white"
                            }`}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Session Details"
            subtitle="Open a saved interview to review each recorded turn, answer, and score."
          >
            {!selectedSession ? (
              <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                Select a saved interview session to inspect its turns.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl bg-zinc-50 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill
                      tone={
                        selectedSession.status === "in_progress" ? "accent" : "neutral"
                      }
                    >
                      {formatSessionStatus(selectedSession.status)}
                    </Pill>
                    {selectedSession.id === activeSessionId ? <Pill>Current Session</Pill> : null}
                    {activeSessionStatus === "completed" &&
                    selectedSession.id === activeSessionId ? (
                      <Pill>Finished</Pill>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xl font-semibold text-zinc-950">
                      {selectedSession.targetRole}
                    </p>
                    <p className="text-sm text-zinc-600">
                      Last updated {formatDateTime(selectedSession.updatedAt)}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {selectedSession.submittedAnswersCount} answered question
                      {selectedSession.submittedAnswersCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {sessionDetailLoading ? (
                  <div className="flex items-center gap-3 rounded-3xl bg-zinc-50 p-5 text-sm font-medium text-zinc-600">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
                    Loading interview turns...
                  </div>
                ) : selectedSessionTurns.length === 0 ? (
                  <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                    This session has started, but no answered turns have been
                    saved yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedSessionTurns.map((turn) => (
                      <article
                        key={turn.id}
                        className="rounded-3xl border border-zinc-200 bg-white p-5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone="accent">Question {turn.turnNumber}</Pill>
                          {turn.evaluation?.score ? <Pill>Score {turn.evaluation.score}</Pill> : null}
                        </div>

                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                              Question
                            </p>
                            <p className="mt-2 text-sm leading-7 text-zinc-700">
                              {turn.questionText}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                              Answer
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                              {turn.submittedAnswer}
                            </p>
                          </div>

                          {turn.feedback ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                Feedback
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                                {turn.feedback}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
