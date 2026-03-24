import { ChatMessage, isRecord } from "@/lib/interview";

type RequestInterviewParams = {
  candidateAnswer: string;
  history: ChatMessage[];
  targetRole: string;
};

export async function requestInterview({
  candidateAnswer,
  history,
  targetRole,
}: RequestInterviewParams) {
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
}
