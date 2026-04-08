import { ChatMessage, isRecord } from "@/lib/interview";

type RequestInterviewParams = {
  candidateAnswer: string;
  history: ChatMessage[];
  targetRole: string;
};

const INTERVIEW_REQUEST_TIMEOUT_MS = 25000;

export async function requestInterview({
  candidateAnswer,
  history,
  targetRole,
}: RequestInterviewParams) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("You're offline. Please reconnect and try again.");
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort();
  }, INTERVIEW_REQUEST_TIMEOUT_MS);

  try {
    const apiResponse = await fetch("/api/interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateAnswer,
        history,
        targetRole,
      }),
      signal: controller.signal,
    });

    const rawResponse = await apiResponse.text();
    let parsedResponse: unknown = null;

    if (rawResponse) {
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch {
        parsedResponse = rawResponse;
      }
    }

    if (!apiResponse.ok) {
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        throw new Error("Your session expired. Please sign in again.");
      }

      if (isRecord(parsedResponse) && typeof parsedResponse.error === "string") {
        throw new Error(parsedResponse.error);
      }

      if (typeof parsedResponse === "string" && parsedResponse.trim()) {
        throw new Error(parsedResponse);
      }

      throw new Error("The interview assistant is unavailable right now.");
    }

    if (parsedResponse === null) {
      throw new Error("The server returned an empty response. Please try again.");
    }

    return parsedResponse;
  } catch (requestError) {
    if (
      requestError instanceof Error &&
      requestError.name === "AbortError"
    ) {
      throw new Error("The request is taking longer than expected. Please try again.");
    }

    if (
      requestError instanceof Error &&
      (requestError.message.toLowerCase().includes("failed to fetch") ||
        requestError.message.toLowerCase().includes("network") ||
        requestError.message.toLowerCase().includes("load failed"))
    ) {
      throw new Error(
        "Unable to reach the interview service. Please check your connection and try again."
      );
    }

    if (requestError instanceof Error) {
      throw requestError;
    }

    throw new Error("Something went wrong. Please try again.");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
