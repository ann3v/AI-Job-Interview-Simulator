"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { requestInterview } from "@/lib/interview-client";
import {
  ChatMessage,
  CurrentQuestionState,
  InterviewState,
  LastReviewState,
  serializeAssistantResponse,
  splitInterviewTurn,
} from "@/lib/interview";
import {
  createInterviewSession,
  createInterviewTurn,
  getInterviewSessionById,
  getLatestInProgressInterviewSession,
  getLatestInterviewTurn,
  type PersistedInterviewSession,
  type PersistedInterviewSessionStatus,
  type PersistedInterviewTurn,
  updateInterviewSession,
  updateInterviewSessionStatus,
} from "@/lib/interview-store";

type RequestState = "idle" | "starting" | "answering";

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
  const [persistenceRevision, setPersistenceRevision] = useState(0);
  const hasAttemptedRestoreRef = useRef(false);

  const isStarting = requestState === "starting";
  const isAnswering = requestState === "answering";
  const hasReviewContent = Boolean(
    lastReviewState &&
      (lastReviewState.evaluation ||
        lastReviewState.feedback ||
        lastReviewState.followUp ||
        lastReviewState.strongAnswerExample)
  );

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
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      hasAttemptedRestoreRef.current = false;
      setIsRestoringSession(false);
      return;
    }

    if (hasAttemptedRestoreRef.current) {
      return;
    }

    hasAttemptedRestoreRef.current = true;
    setIsRestoringSession(true);
    const userId = user.id;

    let isActive = true;

    async function restoreInProgressSession() {
      try {
        const storedSession = await getLatestInProgressInterviewSession(userId);

        if (!isActive || !storedSession) {
          return;
        }

        const latestTurn = await getLatestInterviewTurn(storedSession.id, userId);

        if (!isActive) {
          return;
        }

        applyPersistedSessionState(storedSession, latestTurn);
      } catch (restoreError) {
        console.error("Failed to restore interview session:", restoreError);
      } finally {
        if (isActive) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreInProgressSession();

    return () => {
      isActive = false;
    };
  }, [authLoading, user]);

  async function startInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (requestState !== "idle") {
      return;
    }

    const trimmedRole = selectedRole.trim();

    if (!trimmedRole) {
      setError("Please choose or enter a target role before starting.");
      return;
    }

    setError(null);
    setRequestState("starting");

    try {
      const parsedResponse = await requestInterview({
        candidateAnswer: "",
        history: [],
        targetRole: trimmedRole,
      });
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

          setActiveSessionId(session.id);
          setActiveSessionStatus(session.status);
          setPersistenceRevision((currentRevision) => currentRevision + 1);
        } catch (persistenceError) {
          console.error("Failed to create interview session:", persistenceError);
          setActiveSessionId(null);
        }
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while starting the interview."
      );
    } finally {
      setRequestState("idle");
    }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (requestState !== "idle") {
      return;
    }

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setError("Please enter an answer before submitting.");
      return;
    }

    setError(null);
    setRequestState("answering");

    try {
      const nextSubmittedAnswers = submittedAnswers + 1;
      const parsedResponse = await requestInterview({
        candidateAnswer: trimmedAnswer,
        history,
        targetRole: selectedRole.trim(),
      });
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
          setPersistenceRevision((currentRevision) => currentRevision + 1);
        } catch (persistenceError) {
          console.error("Failed to save interview progress:", persistenceError);
        }
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting your answer."
      );
    } finally {
      setRequestState("idle");
    }
  }

  function resetInterview() {
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
  }

  async function resumeSession(sessionId: string) {
    if (!user || requestState !== "idle") {
      return;
    }

    setIsRestoringSession(true);
    setError(null);

    try {
      const storedSession = await getInterviewSessionById(sessionId, user.id);

      if (!storedSession || storedSession.status !== "in_progress") {
        throw new Error("Only in-progress sessions can be resumed.");
      }

      const latestTurn = await getLatestInterviewTurn(sessionId, user.id);
      applyPersistedSessionState(storedSession, latestTurn);
    } catch (resumeError) {
      setError(
        resumeError instanceof Error
          ? resumeError.message
          : "Unable to resume this interview right now."
      );
    } finally {
      setIsRestoringSession(false);
    }
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
    resumeSession,
    selectedRole,
    setAnswer,
    setSelectedRole,
    startInterview,
    submitAnswer,
    submittedAnswers,
  };
}
