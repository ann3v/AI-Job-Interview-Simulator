"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isTransientRequestError, withTimeout } from "@/lib/async";
import { requestInterview } from "@/lib/interview-client";
import {
  ChatMessage,
  CurrentQuestionState,
  InterviewState,
  LastReviewState,
  MAX_ANSWER_LENGTH,
  MAX_ROLE_LENGTH,
  hasRenderableCurrentQuestion,
  serializeAssistantResponse,
  splitInterviewTurn,
} from "@/lib/interview";
import {
  createInterviewSession,
  createInterviewTurn,
  getInterviewSessionById,
  getLatestContinuableInterviewSession,
  getLatestInterviewTurn,
  type PersistedInterviewSession,
  type PersistedInterviewSessionStatus,
  type PersistedInterviewTurn,
  updateInterviewSession,
  updateInterviewSessionStatus,
} from "@/lib/interview-store";

type RequestState = "idle" | "starting" | "answering";
type RestoreState = "loading" | "empty" | "loaded" | "error";
const RESTORE_TIMEOUT_MS = 12000;

const EMPTY_CURRENT_QUESTION: CurrentQuestionState = {
  questionText: null,
  questionNumber: null,
  topic: null,
  difficulty: null,
  focusAreas: [],
};

function getPersistedSessionStatus(
  status: string | undefined,
  fallback: PersistedInterviewSessionStatus = "in_progress"
): PersistedInterviewSessionStatus {
  if (
    status === "in_progress" ||
    status === "completed" ||
    status === "abandoned"
  ) {
    return status;
  }

  return fallback;
}

function getInterviewMetaFromStoredSession(
  session: PersistedInterviewSession
): InterviewState | undefined {
  const interviewMeta: InterviewState = {
    status: session.status,
  };

  if (typeof session.currentQuestionNumber === "number") {
    interviewMeta.question_number = session.currentQuestionNumber;
  }

  if (session.currentDifficulty) {
    interviewMeta.difficulty = session.currentDifficulty;
  }

  if (session.candidateLevelEstimate) {
    interviewMeta.candidate_level_estimate = session.candidateLevelEstimate;
  }

  if (session.currentTopic) {
    interviewMeta.topic = session.currentTopic;
  }

  return Object.keys(interviewMeta).length > 0 ? interviewMeta : undefined;
}

function getCurrentQuestionStateFromStoredSession(
  session: PersistedInterviewSession
): CurrentQuestionState {
  return {
    questionText: session.currentQuestionText,
    questionNumber: session.currentQuestionNumber,
    topic: session.currentTopic,
    difficulty: session.currentDifficulty,
    focusAreas: session.currentFocusAreas,
  };
}

function getLastReviewStateFromStoredTurn(
  turn: PersistedInterviewTurn | null
): LastReviewState | null {
  if (!turn) {
    return null;
  }

  return {
    reviewedQuestionText: turn.questionText,
    reviewedQuestionNumber: turn.turnNumber,
    submittedAnswer: turn.submittedAnswer,
    evaluation: turn.evaluation,
    feedback: turn.feedback,
    followUp: turn.followUp,
    strongAnswerExample: turn.strongAnswerExample,
  };
}

function getFriendlyRestoreErrorMessage(error: unknown) {
  if (isTransientRequestError(error)) {
    return "Unable to reach Supabase right now. Please check your connection and try again.";
  }

  return "Unable to restore your latest interview right now. Please try again.";
}

export function useInterviewSession() {
  const { loading: authLoading, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const [answer, setAnswer] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState(0);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [currentQuestionState, setCurrentQuestionState] =
    useState<CurrentQuestionState>(EMPTY_CURRENT_QUESTION);
  const [lastReviewState, setLastReviewState] = useState<LastReviewState | null>(
    null
  );
  const [plainTextResponse, setPlainTextResponse] = useState<string | null>(null);
  const [interviewMeta, setInterviewMeta] = useState<InterviewState | undefined>(
    undefined
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionStatus, setActiveSessionStatus] =
    useState<PersistedInterviewSessionStatus | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [restoreState, setRestoreState] = useState<RestoreState>("loading");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreRetryNonce, setRestoreRetryNonce] = useState(0);
  const [persistenceRevision, setPersistenceRevision] = useState(0);
  const requestLockRef = useRef(false);
  const requestTokenRef = useRef(0);

  const isStarting = requestState === "starting";
  const isAnswering = requestState === "answering";
  const hasReviewContent = Boolean(
    lastReviewState &&
      (lastReviewState.evaluation ||
        lastReviewState.feedback ||
        lastReviewState.followUp ||
        lastReviewState.strongAnswerExample)
  );

  function beginRequest(nextRequestState: RequestState) {
    if (requestState !== "idle" || requestLockRef.current) {
      return null;
    }

    requestLockRef.current = true;
    requestTokenRef.current += 1;
    setRequestState(nextRequestState);
    return requestTokenRef.current;
  }

  function isCurrentRequest(requestToken: number) {
    return requestLockRef.current && requestTokenRef.current === requestToken;
  }

  function completeRequest(requestToken: number) {
    if (!isCurrentRequest(requestToken)) {
      return;
    }

    requestLockRef.current = false;
    setRequestState("idle");
  }

  function applyPersistedSessionState(
    session: PersistedInterviewSession,
    latestTurn: PersistedInterviewTurn | null
  ) {
    setSelectedRole(session.targetRole);
    setAnswer("");
    setError(null);
    setHasStarted(true);
    setSubmittedAnswers(session.submittedAnswersCount);
    setHistory(session.conversationHistory);
    setCurrentQuestionState(getCurrentQuestionStateFromStoredSession(session));
    setLastReviewState(getLastReviewStateFromStoredTurn(latestTurn));
    setPlainTextResponse(null);
    setInterviewMeta(getInterviewMetaFromStoredSession(session));
    setActiveSessionId(session.id);
    setActiveSessionStatus(session.status);
    setRestoreError(null);
    setRestoreState("loaded");
  }

  useEffect(() => {
    const userId = user?.id ?? null;

    if (authLoading) {
      return;
    }

    if (!userId) {
      setIsRestoringSession(false);
      setRestoreError(null);
      setRestoreState("empty");
      return;
    }

    const resolvedUserId = userId;
    setIsRestoringSession(true);
    setRestoreError(null);
    setRestoreState("loading");

    let isActive = true;

    async function restoreContinuableSession() {
      try {
        const storedSession = await withTimeout(
          getLatestContinuableInterviewSession(resolvedUserId),
          RESTORE_TIMEOUT_MS,
          "Restore request timed out."
        );

        if (!isActive || !storedSession) {
          if (isActive) {
            setRestoreError(null);
            setRestoreState("empty");
          }
          return;
        }

        const resumableSession =
          storedSession.status === "in_progress"
            ? storedSession
            : await withTimeout(
                updateInterviewSessionStatus({
                  sessionId: storedSession.id,
                  userId: resolvedUserId,
                  status: "in_progress",
                }),
                RESTORE_TIMEOUT_MS,
                "Restore request timed out."
              );
        const latestTurn = await withTimeout(
          getLatestInterviewTurn(resumableSession.id, resolvedUserId),
          RESTORE_TIMEOUT_MS,
          "Restore request timed out."
        );

        if (!isActive) {
          return;
        }

        applyPersistedSessionState(resumableSession, latestTurn);
      } catch (restoreError) {
        console.error("Failed to restore interview session:", restoreError);
        if (isActive) {
          setRestoreError(getFriendlyRestoreErrorMessage(restoreError));
          setRestoreState("error");
        }
      } finally {
        if (isActive) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreContinuableSession();

    return () => {
      isActive = false;
    };
  }, [authLoading, restoreRetryNonce, user?.id]);

  async function startInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestToken = beginRequest("starting");

    if (requestToken === null) {
      return;
    }

    const trimmedRole = selectedRole.trim();

    if (!trimmedRole) {
      setError("Please choose or enter a target role before starting.");
      completeRequest(requestToken);
      return;
    }

    if (trimmedRole.length > MAX_ROLE_LENGTH) {
      setError("That input is too long. Please shorten it and try again.");
      completeRequest(requestToken);
      return;
    }

    setError(null);

    try {
      const parsedResponse = await requestInterview({
        candidateAnswer: "",
        history: [],
        targetRole: trimmedRole,
      });

      if (!isCurrentRequest(requestToken)) {
        return;
      }

      if (!hasRenderableCurrentQuestion(parsedResponse)) {
        throw new Error(
          "The interview assistant returned an incomplete response. Please try again."
        );
      }

      const splitTurn = splitInterviewTurn({
        payload: parsedResponse,
        previousQuestionState: null,
        submittedAnswer: null,
      });
      const nextHistory = [
        {
          role: "assistant" as const,
          content: serializeAssistantResponse(parsedResponse),
        },
      ];

      setHistory(nextHistory);
      setCurrentQuestionState(splitTurn.currentQuestionState);
      setInterviewMeta(splitTurn.interviewMeta);
      setLastReviewState(null);
      setPlainTextResponse(splitTurn.plainTextResponse);
      setHasStarted(true);
      setSubmittedAnswers(0);
      setAnswer("");
      setRestoreError(null);
      setRestoreState("loaded");
      setActiveSessionStatus(
        getPersistedSessionStatus(splitTurn.interviewMeta?.status)
      );

      if (user) {
        try {
          const session = await createInterviewSession({
            userId: user.id,
            targetRole: trimmedRole,
            currentQuestionState: splitTurn.currentQuestionState,
            history: nextHistory,
            interviewMeta: splitTurn.interviewMeta,
            submittedAnswersCount: 0,
            status: getPersistedSessionStatus(splitTurn.interviewMeta?.status),
          });

          if (!isCurrentRequest(requestToken)) {
            return;
          }

          setActiveSessionId(session.id);
          setActiveSessionStatus(session.status);
          setPersistenceRevision((currentRevision) => currentRevision + 1);
        } catch (persistenceError) {
          console.error("Failed to create interview session:", persistenceError);
          if (isCurrentRequest(requestToken)) {
            setActiveSessionId(null);
          }
        }
      }
    } catch (submissionError) {
      if (isCurrentRequest(requestToken)) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Something went wrong while starting the interview."
        );
      }
    } finally {
      completeRequest(requestToken);
    }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestToken = beginRequest("answering");

    if (requestToken === null) {
      return;
    }

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setError("Please enter an answer before submitting.");
      completeRequest(requestToken);
      return;
    }

    if (trimmedAnswer.length > MAX_ANSWER_LENGTH) {
      setError("That input is too long. Please shorten it and try again.");
      completeRequest(requestToken);
      return;
    }

    if (!currentQuestionState.questionText) {
      setError(
        "The current question is unavailable right now. Please restart the interview and try again."
      );
      completeRequest(requestToken);
      return;
    }

    setError(null);

    try {
      const nextSubmittedAnswers = submittedAnswers + 1;
      const parsedResponse = await requestInterview({
        candidateAnswer: trimmedAnswer,
        history,
        targetRole: selectedRole.trim(),
      });

      if (!isCurrentRequest(requestToken)) {
        return;
      }

      if (!hasRenderableCurrentQuestion(parsedResponse)) {
        throw new Error(
          "The interview assistant returned an incomplete response. Please try again."
        );
      }

      const splitTurn = splitInterviewTurn({
        payload: parsedResponse,
        previousQuestionState: currentQuestionState,
        submittedAnswer: trimmedAnswer,
      });
      const nextHistory = [
        ...history,
        { role: "user" as const, content: trimmedAnswer },
        {
          role: "assistant" as const,
          content: serializeAssistantResponse(parsedResponse),
        },
      ];
      const nextStatus = getPersistedSessionStatus(
        splitTurn.interviewMeta?.status,
        activeSessionStatus ?? "in_progress"
      );

      setHistory(nextHistory);
      setLastReviewState(splitTurn.lastReviewState);
      setCurrentQuestionState(splitTurn.currentQuestionState);
      setInterviewMeta(splitTurn.interviewMeta);
      setPlainTextResponse(splitTurn.plainTextResponse);
      setSubmittedAnswers(nextSubmittedAnswers);
      setAnswer("");
      setActiveSessionStatus(nextStatus);

      if (user && activeSessionId) {
        try {
          if (splitTurn.lastReviewState) {
            await createInterviewTurn({
              sessionId: activeSessionId,
              userId: user.id,
              turnNumber:
                splitTurn.lastReviewState.reviewedQuestionNumber ??
                currentQuestionState.questionNumber ??
                nextSubmittedAnswers,
              questionText:
                splitTurn.lastReviewState.reviewedQuestionText ??
                currentQuestionState.questionText ??
                "Interview question",
              focusAreas: currentQuestionState.focusAreas,
              submittedAnswer: trimmedAnswer,
              review: splitTurn.lastReviewState,
            });

            if (!isCurrentRequest(requestToken)) {
              return;
            }
          }

          if (!isCurrentRequest(requestToken)) {
            return;
          }

          await updateInterviewSession({
            sessionId: activeSessionId,
            userId: user.id,
            targetRole: selectedRole.trim(),
            currentQuestionState: splitTurn.currentQuestionState,
            history: nextHistory,
            interviewMeta: splitTurn.interviewMeta,
            submittedAnswersCount: nextSubmittedAnswers,
            status: nextStatus,
          });

          if (!isCurrentRequest(requestToken)) {
            return;
          }

          setPersistenceRevision((currentRevision) => currentRevision + 1);
        } catch (persistenceError) {
          console.error("Failed to save interview progress:", persistenceError);
        }
      }
    } catch (submissionError) {
      if (isCurrentRequest(requestToken)) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Something went wrong while submitting your answer."
        );
      }
    } finally {
      completeRequest(requestToken);
    }
  }

  function resetInterview() {
    if (requestState !== "idle" || requestLockRef.current) {
      setError(
        "Please wait for the current interview request to finish before changing roles."
      );
      return;
    }

    const nextStatus =
      activeSessionStatus === "completed"
        ? "completed"
        : submittedAnswers > 0
          ? "completed"
          : "abandoned";

    if (user && activeSessionId) {
      void updateInterviewSessionStatus({
        sessionId: activeSessionId,
        userId: user.id,
        status: nextStatus,
      })
        .then(() => {
          setPersistenceRevision((currentRevision) => currentRevision + 1);
        })
        .catch((persistenceError) => {
          console.error("Failed to finalize interview session:", persistenceError);
        });
    }

    setHasStarted(false);
    setRequestState("idle");
    setError(null);
    setAnswer("");
    setHistory([]);
    setCurrentQuestionState(EMPTY_CURRENT_QUESTION);
    setLastReviewState(null);
    setPlainTextResponse(null);
    setInterviewMeta(undefined);
    setSubmittedAnswers(0);
    setActiveSessionId(null);
    setActiveSessionStatus(null);
    setRestoreError(null);
    setRestoreState("empty");
  }

  async function resumeSession(sessionId: string) {
    if (!user || requestState !== "idle" || isRestoringSession) {
      return false;
    }

    setIsRestoringSession(true);
    setError(null);

    try {
      const storedSession = await getInterviewSessionById(sessionId, user.id);

      if (!storedSession) {
        throw new Error("Unable to find this interview session.");
      }

      if (!storedSession.currentQuestionText) {
        throw new Error(
          "This session does not have a next question saved, so it cannot be continued."
        );
      }

      const resumableSession =
        storedSession.status === "in_progress"
          ? storedSession
          : await updateInterviewSessionStatus({
              sessionId,
              userId: user.id,
              status: "in_progress",
            });
      const latestTurn = await getLatestInterviewTurn(sessionId, user.id);
      applyPersistedSessionState(resumableSession, latestTurn);
      setPersistenceRevision((currentRevision) => currentRevision + 1);
      return true;
    } catch (resumeError) {
      setError(
        resumeError instanceof Error
          ? resumeError.message
          : "Unable to resume this interview right now."
      );
      return false;
    } finally {
      setIsRestoringSession(false);
    }
  }

  function retryRestoreSession() {
    if (authLoading || !user || isRestoringSession) {
      return;
    }

    setRestoreError(null);
    setRestoreState("loading");
    setIsRestoringSession(true);
    setRestoreRetryNonce((currentValue) => currentValue + 1);
  }

  return {
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
    persistenceRevision,
    plainTextResponse,
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
    submittedAnswers,
  };
}
