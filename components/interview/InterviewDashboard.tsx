"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerComposer } from "@/components/interview/AnswerComposer";
import { CurrentQuestionCard } from "@/components/interview/CurrentQuestionCard";
import { EvaluationSummary } from "@/components/interview/EvaluationSummary";
import { InterviewFeedbackPanel } from "@/components/interview/InterviewFeedbackPanel";
import { InterviewHeader } from "@/components/interview/InterviewHeader";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { OverlayModal } from "@/components/interview/OverlayModal";
import { Pill } from "@/components/interview/Pill";
import { SectionCard } from "@/components/interview/SectionCard";
import { useAuth } from "@/context/AuthContext";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { isTransientRequestError, withTimeout } from "@/lib/async";
import {
  deleteInterviewSession,
  listInterviewSessions,
  listInterviewTurns,
  type PersistedInterviewSession,
  type PersistedInterviewTurn,
} from "@/lib/interview-store";

type HistoryState = "loading" | "empty" | "loaded" | "error";
type ActiveModal = "feedback" | "history" | "details" | null;
const HISTORY_REQUEST_TIMEOUT_MS = 12000;

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

function getQuestionPreview(question: string, maxLength = 90) {
  const normalized = question.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function getFriendlyHistoryErrorMessage(error: unknown) {
  if (isTransientRequestError(error)) {
    return "Unable to reach Supabase right now. Please check your connection and retry.";
  }

  return "Unable to load your saved interview sessions right now. Please try again.";
}

function getDashboardActionButtonClass({
  isActive,
  disabled,
}: {
  isActive: boolean;
  disabled?: boolean;
}) {
  const baseClassName =
    "inline-flex min-w-36 items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold transition";

  if (disabled) {
    return `${baseClassName} cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400`;
  }

  if (isActive) {
    return `${baseClassName} border-sky-300 bg-sky-50 text-sky-800`;
  }

  return `${baseClassName} border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50`;
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
    restoreError,
    restoreState,
    retryRestoreSession,
    resumeSession,
    selectedRole,
    setAnswer,
    setSelectedRole,
    startInterview,
    submitAnswer,
  } = useInterviewSession();
  const [savedSessions, setSavedSessions] = useState<PersistedInterviewSession[]>(
    []
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionTurns, setSelectedSessionTurns] = useState<
    PersistedInterviewTurn[]
  >([]);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [historyState, setHistoryState] = useState<HistoryState>("loading");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [sessionDetailError, setSessionDetailError] = useState<string | null>(
    null
  );
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRetryNonce, setHistoryRetryNonce] = useState(0);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const hasFeedbackAutoOpenInitializedRef = useRef(false);
  const feedbackAutoOpenKeyRef = useRef<string | null>(null);

  const review = hasReviewContent ? lastReviewState : null;
  const latestReviewedQuestionNumber = review?.reviewedQuestionNumber ?? null;
  const latestSubmittedAnswer = review?.submittedAnswer ?? null;
  const hasLatestReview = Boolean(review);
  const selectedSession =
    savedSessions.find((session) => session.id === selectedSessionId) ?? null;
  const selectedTurn =
    selectedSessionTurns.find((turn) => turn.id === selectedTurnId) ??
    selectedSessionTurns[selectedSessionTurns.length - 1] ??
    null;

  useEffect(() => {
    const latestReviewKey = latestSubmittedAnswer
      ? `${latestReviewedQuestionNumber ?? "none"}:${latestSubmittedAnswer}`
      : null;

    if (!hasFeedbackAutoOpenInitializedRef.current) {
      hasFeedbackAutoOpenInitializedRef.current = true;
      feedbackAutoOpenKeyRef.current = latestReviewKey;
      return;
    }

    if (latestReviewKey && latestReviewKey !== feedbackAutoOpenKeyRef.current) {
      setActiveModal("feedback");
    }

    feedbackAutoOpenKeyRef.current = latestReviewKey;
  }, [latestReviewedQuestionNumber, latestSubmittedAnswer]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setSavedSessions([]);
      setSelectedSessionId(null);
      setSelectedSessionTurns([]);
      setHistoryError(null);
      setHistoryState("empty");
      setHistoryLoading(false);
      return;
    }

    const userId = user.id;
    let isActive = true;

    async function loadSavedSessions() {
      setHistoryLoading(true);
      setHistoryState("loading");
      setHistoryError(null);

      try {
        const sessions = await withTimeout(
          listInterviewSessions(userId),
          HISTORY_REQUEST_TIMEOUT_MS,
          "History request timed out."
        );

        if (!isActive) {
          return;
        }

        setSavedSessions(sessions);
        setHistoryState(sessions.length === 0 ? "empty" : "loaded");
        setSelectedSessionId((currentSelection) => {
          if (
            currentSelection &&
            sessions.some((session) => session.id === currentSelection)
          ) {
            return currentSelection;
          }

          return sessions[0]?.id ?? null;
        });
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setHistoryError(getFriendlyHistoryErrorMessage(loadError));
        setHistoryState("error");
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
  }, [historyRetryNonce, loading, persistenceRevision, user]);

  useEffect(() => {
    if (loading || !user || !selectedSessionId) {
      setSelectedSessionTurns([]);
      setSelectedTurnId(null);
      setSessionDetailError(null);
      setSessionDetailLoading(false);
      return;
    }

    const sessionId = selectedSessionId;
    const userId = user.id;
    let isActive = true;

    async function loadSessionTurns() {
      setSessionDetailLoading(true);
      setSessionDetailError(null);

      try {
        const turns = await withTimeout(
          listInterviewTurns(sessionId, userId),
          HISTORY_REQUEST_TIMEOUT_MS,
          "History request timed out."
        );

        if (!isActive) {
          return;
        }

        setSelectedSessionTurns(turns);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setSessionDetailError(
          getFriendlyHistoryErrorMessage(loadError)
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

  useEffect(() => {
    if (selectedSessionTurns.length === 0) {
      setSelectedTurnId(null);
      return;
    }

    setSelectedTurnId((currentSelectedTurnId) => {
      if (
        currentSelectedTurnId &&
        selectedSessionTurns.some((turn) => turn.id === currentSelectedTurnId)
      ) {
        return currentSelectedTurnId;
      }

      return selectedSessionTurns[selectedSessionTurns.length - 1].id;
    });
  }, [selectedSessionTurns]);

  async function handleDeleteSession(sessionId: string) {
    if (!user || deletingSessionId) {
      return;
    }

    const userId = user.id;
    setDeletingSessionId(sessionId);
    setHistoryError(null);

    try {
      await withTimeout(
        deleteInterviewSession(sessionId, userId),
        HISTORY_REQUEST_TIMEOUT_MS,
        "History request timed out."
      );

      const sessions = await withTimeout(
        listInterviewSessions(userId),
        HISTORY_REQUEST_TIMEOUT_MS,
        "History request timed out."
      );
      setSavedSessions(sessions);
      setHistoryState(sessions.length === 0 ? "empty" : "loaded");
      setHistoryError(null);
      setSelectedSessionId((currentSelection) => {
        if (currentSelection && currentSelection !== sessionId) {
          return currentSelection;
        }

        return sessions[0]?.id ?? null;
      });

      if (selectedSessionId === sessionId) {
        setSelectedSessionTurns([]);
        setSelectedTurnId(null);
      }
    } catch (deleteError) {
      setHistoryError(getFriendlyHistoryErrorMessage(deleteError));
      setHistoryState("error");
    } finally {
      setDeletingSessionId(null);
    }
  }

  function handleRetryHistoryLoad() {
    setHistoryRetryNonce((currentValue) => currentValue + 1);
  }

  async function handleResumeSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    await resumeSession(sessionId);
  }

  async function handleHistorySessionOpen(session: PersistedInterviewSession) {
    setSelectedSessionId(session.id);

    if (session.status === "in_progress") {
      await resumeSession(session.id);
      setActiveModal(null);
      return;
    }

    setActiveModal("details");
  }

  function openSessionDetailsModal() {
    if (!selectedSessionId && activeSessionId) {
      setSelectedSessionId(activeSessionId);
    }

    setActiveModal("details");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveModal("feedback")}
          disabled={!hasLatestReview}
          className={getDashboardActionButtonClass({
            isActive: activeModal === "feedback",
            disabled: !hasLatestReview,
          })}
        >
          View Feedback
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("history")}
          className={getDashboardActionButtonClass({
            isActive: activeModal === "history",
          })}
        >
          Session History
        </button>
        <button
          type="button"
          onClick={openSessionDetailsModal}
          className={getDashboardActionButtonClass({
            isActive: activeModal === "details",
          })}
        >
          Session Details
        </button>
      </div>

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
        <>
          {restoreState === "empty" ? (
            <SectionCard
              title="No In-Progress Interview"
              subtitle="No in-progress interview found. Start a new practice session or review your saved sessions below."
            >
              <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                No in-progress interview found.
              </div>
            </SectionCard>
          ) : null}
          {restoreState === "error" ? (
            <SectionCard
              title="Restore Failed"
              subtitle="The dashboard could not restore your latest in-progress interview."
            >
              <div className="space-y-4 rounded-3xl bg-zinc-50 p-5">
                <p className="text-sm leading-6 text-zinc-600">
                  {restoreError ??
                    "Unable to reach Supabase right now. Please try again."}
                </p>
                <button
                  type="button"
                  onClick={retryRestoreSession}
                  className="inline-flex items-center rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800"
                >
                  Retry Restore
                </button>
              </div>
            </SectionCard>
          ) : null}
          <InterviewSetup
            role={selectedRole}
            onRoleChange={setSelectedRole}
            onRolePick={setSelectedRole}
            onStart={startInterview}
            error={error}
            loading={isStarting}
          />
        </>
      ) : (
        <>
          <InterviewHeader
            role={selectedRole.trim() || "Selected Role"}
            state={interviewMeta}
            onReset={resetInterview}
            resetDisabled={isStarting || isAnswering}
          />
          <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr] xl:items-start">
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
        </>
      )}

      <OverlayModal
        isOpen={activeModal === "feedback"}
        onClose={() => setActiveModal(null)}
        title="Latest Feedback"
        canExpand
      >
        {!review ? (
          <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
            No reviewed answer yet. Submit an answer to unlock interview
            feedback.
          </div>
        ) : (
          <div className="space-y-6">
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
          </div>
        )}

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
      </OverlayModal>

      <OverlayModal
        isOpen={activeModal === "history"}
        onClose={() => setActiveModal(null)}
        title="Session History"
        canExpand
      >
        <div className="space-y-4">
          {historyLoading || historyState === "loading" ? (
            <div className="flex items-center gap-3 rounded-3xl bg-zinc-50 p-5 text-sm font-medium text-zinc-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
              Loading saved sessions...
            </div>
          ) : historyState === "error" ? (
            <div
              className="space-y-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
              role="alert"
            >
              <p>
                {historyError ??
                  "Unable to load your saved interview sessions right now."}
              </p>
              <button
                type="button"
                onClick={handleRetryHistoryLoad}
                className="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-700 transition hover:border-red-400"
              >
                Retry History Load
              </button>
            </div>
          ) : historyState === "empty" ? (
            <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
              No interview sessions saved yet. Start an interview to create your
              first persistent record.
            </div>
          ) : (
            <div className="space-y-3">
              {savedSessions.map((session) => {
                const isSelected = session.id === selectedSessionId;
                const isActiveSession = session.id === activeSessionId;
                const canResume =
                  session.status === "in_progress" &&
                  !isRestoringSession;
                const isDeleting = deletingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      void handleHistorySessionOpen(session);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void handleHistorySessionOpen(session);
                      }
                    }}
                    className={`w-full cursor-pointer rounded-3xl border p-4 text-left transition ${
                      isSelected
                        ? "border-sky-300 bg-sky-50"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill
                          tone={session.status === "in_progress" ? "accent" : "neutral"}
                        >
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
                            Open Session
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
        </div>
      </OverlayModal>

      <OverlayModal
        isOpen={activeModal === "details"}
        onClose={() => setActiveModal(null)}
        title="Session Details"
        canExpand
      >
        {!selectedSession ? (
          <div className="rounded-3xl bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
            Select a saved interview session from Session History to inspect its
            turns.
          </div>
        ) : (
          <div className="space-y-5">
            {sessionDetailError ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {sessionDetailError}
              </div>
            ) : null}
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
                This session has started, but no answered turns have been saved
                yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50">
                  <div className="border-b border-zinc-200 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Recorded Turns
                    </p>
                  </div>
                  <div className="max-h-[26rem] overflow-y-auto p-2">
                    <div className="space-y-2">
                      {selectedSessionTurns.map((turn) => {
                        const isTurnSelected = turn.id === selectedTurn?.id;

                        return (
                          <button
                            key={turn.id}
                            type="button"
                            onClick={() => setSelectedTurnId(turn.id)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              isTurnSelected
                                ? "border-sky-300 bg-sky-50"
                                : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill tone="accent">Question {turn.turnNumber}</Pill>
                              {turn.evaluation?.score ? (
                                <Pill>Score {turn.evaluation.score}</Pill>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-zinc-700">
                              {getQuestionPreview(turn.questionText)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {selectedTurn ? (
                  <article className="rounded-3xl border border-zinc-200 bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="accent">Question {selectedTurn.turnNumber}</Pill>
                      {selectedTurn.evaluation?.score ? (
                        <Pill>Score {selectedTurn.evaluation.score}</Pill>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Question
                        </p>
                        <p className="mt-2 text-sm leading-7 text-zinc-700">
                          {selectedTurn.questionText}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Answer
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                          {selectedTurn.submittedAnswer}
                        </p>
                      </div>

                      {selectedTurn.evaluation ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {selectedTurn.evaluation.score ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                              Score: {selectedTurn.evaluation.score}
                            </div>
                          ) : null}
                          {selectedTurn.evaluation.correctness ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                              Correctness: {selectedTurn.evaluation.correctness}
                            </div>
                          ) : null}
                          {selectedTurn.evaluation.clarity ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                              Clarity: {selectedTurn.evaluation.clarity}
                            </div>
                          ) : null}
                          {selectedTurn.evaluation.depth ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                              Depth: {selectedTurn.evaluation.depth}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {selectedTurn.feedback ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            Feedback
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                            {selectedTurn.feedback}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ) : null}
              </div>
            )}
          </div>
        )}
      </OverlayModal>
    </div>
  );
}
