"use client";

import { FormEvent, useState } from "react";
import { requestInterview } from "@/lib/interview-client";
import {
  ChatMessage,
  CurrentQuestionState,
  InterviewState,
  LastReviewState,
  serializeAssistantResponse,
  splitInterviewTurn,
} from "@/lib/interview";

type RequestState = "idle" | "starting" | "answering";

const EMPTY_CURRENT_QUESTION: CurrentQuestionState = {
  questionText: null,
  questionNumber: null,
  topic: null,
  difficulty: null,
  focusAreas: [],
};

export function useInterviewSession() {
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

  const isStarting = requestState === "starting";
  const isAnswering = requestState === "answering";
  const hasReviewContent = Boolean(
    lastReviewState &&
      (lastReviewState.evaluation ||
        lastReviewState.feedback ||
        lastReviewState.followUp ||
        lastReviewState.strongAnswerExample)
  );

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

      setHistory([
        {
          role: "assistant",
          content: serializeAssistantResponse(parsedResponse),
        },
      ]);
      setCurrentQuestionState(splitTurn.currentQuestionState);
      setInterviewMeta(splitTurn.interviewMeta);
      setLastReviewState(null);
      setPlainTextResponse(splitTurn.plainTextResponse);
      setHasStarted(true);
      setSubmittedAnswers(0);
      setAnswer("");
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

      setHistory((currentHistory) => [
        ...currentHistory,
        { role: "user", content: trimmedAnswer },
        {
          role: "assistant",
          content: serializeAssistantResponse(parsedResponse),
        },
      ]);
      setLastReviewState(splitTurn.lastReviewState);
      setCurrentQuestionState(splitTurn.currentQuestionState);
      setInterviewMeta(splitTurn.interviewMeta);
      setPlainTextResponse(splitTurn.plainTextResponse);
      setSubmittedAnswers((count) => count + 1);
      setAnswer("");
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
  }

  return {
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
  };
}
