import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { withTimeout } from "@/lib/async";
import {
  MAX_ANSWER_LENGTH,
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_MESSAGE_LENGTH,
  MAX_ROLE_LENGTH,
  getCurrentQuestionText,
  parseInterviewResponse,
} from "@/lib/interview";

const MODEL_TIMEOUT_MS = 20000;
let groqClient: Groq | null = null;

const SYSTEM_PROMPT = `You are InterviewSim AI, a realistic interviewer for people preparing for job interviews across many real-world careers.

Your job is to run a multi-turn job interview and return everything needed for a web app to display the interview state, evaluation, feedback, and next step.

Rules:
- Ask exactly one interview question at a time.
- Stay in character as a professional but supportive interviewer.
- Evaluate only the candidate's most recent answer.
- Adapt difficulty based on the candidate's performance.
- Keep the interview focused on the selected role's real responsibilities, tools, expectations, soft skills, domain knowledge, and realistic workplace scenarios.
- If the selected role is technical, include role-appropriate technical questions. If it is not technical, do not force software engineering topics.
- Do not ask multiple questions in one response.
- Do not reveal the ideal answer before the candidate answers.
- If the candidate answer is missing, this is the first turn: start the interview.
- If the candidate answer is weak or incomplete, give constructive feedback and ask a follow-up or easier next question.
- If the candidate answer is strong, acknowledge it briefly and continue with a relevant next question.
- Score strictly and fairly. Random text, gibberish, placeholder text, unrelated answers, copied question text, or "I don't know" style non-answers must receive a score of 0.
- Give scores from 1 to 3 only when the answer is a real attempt but mostly incorrect, too vague, or missing key details.
- Give scores from 4 to 6 for partially correct answers with meaningful gaps, 7 to 8 for solid answers, and 9 to 10 only for excellent, specific, interview-ready answers.
- Keep responses concise, structured, and practical for UI rendering.
- Keep the review of the previous answer completely separate from the next active question.
- Never put the strong answer example for the next unanswered question inside the review of the previous answer.
- The current active question must only contain the next question to answer and optional safe focus areas.

Default interview settings:
- Role: Entry-Level Professional
- Level: Junior or early-career
- Scope: Realistic interview questions for the selected job title

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.

Use this exact JSON shape:

{
  "interview_meta": {
    "status": "in_progress",
    "question_number": 1,
    "difficulty": "easy",
    "candidate_level_estimate": "junior",
    "topic": "string"
  },
  "current_question": {
    "question_text": "string",
    "focus_areas": [
      "string",
      "string",
      "string"
    ]
  },
  "last_review": null
}

Behavior:
- On the first turn, there is no candidate answer yet. Set "last_review" to null and generate the first question inside "current_question".
- On later turns, evaluate the candidate's latest answer and fill "last_review" with feedback for the PREVIOUS question only, while "current_question" contains the NEXT question to answer.
- "last_review" must use this exact shape when a review exists:
  {
    "reviewed_question_text": "string",
    "evaluation": {
      "score": 7,
      "correctness": "string",
      "clarity": "string",
      "depth": "string"
    },
    "feedback": "string",
    "follow_up": "string",
    "strong_answer_example": "string"
  }
- "score" must be an integer from 0 to 10 when evaluating an answer. Use 0 for non-answers, gibberish, empty filler, or unrelated responses.
- "difficulty" must be one of: easy, medium, hard.
- "candidate_level_estimate" must be one of: beginner, junior, intermediate.
- "follow_up" should be "NONE" if no follow-up is needed.
- "strong_answer_example" must be short and practical, and it must belong only to the reviewed previous answer.
- Always return JSON that can be parsed directly by a frontend.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    "content" in value &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getLetterCount(value: string) {
  return value.replace(/[^a-z]/gi, "").length;
}

function getLongestConsonantRun(value: string) {
  const consonantRuns = value.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]{5,}/g);

  return consonantRuns?.reduce(
    (longestRun, run) => Math.max(longestRun, run.length),
    0
  ) ?? 0;
}

function isObviousNonAnswer(answer: string) {
  const normalized = answer.toLowerCase().replace(/[\s._-]+/g, " ").trim();
  const compactLetters = normalized.replace(/[^a-z]/g, "");
  const words = normalized
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word));
  const uniqueLetters = new Set(compactLetters).size;
  const letterCount = getLetterCount(normalized);
  const vowelCount = (compactLetters.match(/[aeiou]/g) ?? []).length;
  const vowelRatio = letterCount > 0 ? vowelCount / letterCount : 0;
  const uniqueLetterRatio =
    letterCount > 0 ? uniqueLetters / letterCount : 0;

  if (!normalized || letterCount < 3) {
    return true;
  }

  if (
    /^(i don'?t know|idk|no idea|not sure|skip|pass|test|testing|asdf+|qwerty+|n\/a|none|null|nothing|blah+|random)$/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (words.length <= 2 && letterCount >= 8) {
    return (
      getLongestConsonantRun(normalized) >= 5 ||
      uniqueLetterRatio <= 0.45 ||
      vowelRatio <= 0.12
    );
  }

  return false;
}

function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMeaningfulWords(value: string) {
  return normalizeForComparison(value)
    .split(" ")
    .filter((word) => word.length > 3);
}

function isCopiedQuestionAnswer(answer: string, question: string | null) {
  if (!question) {
    return false;
  }

  const normalizedAnswer = normalizeForComparison(answer);
  const normalizedQuestion = normalizeForComparison(question);

  if (!normalizedAnswer || !normalizedQuestion) {
    return false;
  }

  if (normalizedAnswer === normalizedQuestion) {
    return true;
  }

  const answerWords = new Set(getMeaningfulWords(normalizedAnswer));
  const questionWords = new Set(getMeaningfulWords(normalizedQuestion));

  if (answerWords.size < 5 || questionWords.size < 5) {
    return false;
  }

  const overlappingWords = [...answerWords].filter((word) =>
    questionWords.has(word)
  ).length;

  return (
    overlappingWords / answerWords.size >= 0.8 &&
    overlappingWords / questionWords.size >= 0.5
  );
}

function getLatestQuestionFromHistory(history: ChatMessage[]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];

    if (message.role !== "assistant") {
      continue;
    }

    try {
      const parsed = JSON.parse(message.content) as unknown;
      const question = getCurrentQuestionText(parseInterviewResponse(parsed));

      if (question) {
        return question;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function applyNonAnswerEvaluation(parsed: unknown) {
  if (!isRecord(parsed)) {
    return;
  }

  const review = isRecord(parsed.last_review) ? parsed.last_review : {};
  const existingStrongAnswer =
    typeof review.strong_answer_example === "string"
      ? review.strong_answer_example
      : "";

  review.evaluation = {
    score: 0,
    correctness:
      "No usable answer was provided, so it cannot be considered correct.",
    clarity:
      "The response is random, empty filler, or does not communicate a real answer.",
    depth:
      "There is no relevant explanation, example, reasoning, or role-specific detail.",
  };
  review.feedback =
    "This response does not answer the interview question. Random text, placeholder text, or unrelated input receives a 0 because there is nothing meaningful to evaluate.";
  review.follow_up =
    "Try again with a real answer that directly addresses the question, even if it is short.";
  review.strong_answer_example =
    existingStrongAnswer ||
    "A stronger answer would directly address the question, explain your reasoning, and include a concrete example from the role or a realistic workplace situation.";
  parsed.last_review = review;
}

function getInterviewApiErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("timed out")
  ) {
    return "The request is taking longer than expected. Please try again.";
  }

  return "The interview assistant could not generate a response. Please try again.";
}

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload. Please try again." },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request payload. Please try again." },
        { status: 400 }
      );
    }

    const candidateAnswer =
      typeof body.candidateAnswer === "string" ? body.candidateAnswer : "";
    const targetRole = typeof body.targetRole === "string" ? body.targetRole : "";

    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history.filter(isChatMessage).slice(-MAX_HISTORY_MESSAGES)
      : [];

    const trimmedAnswer = candidateAnswer.trim();
    const trimmedRole = targetRole.trim();
    const hasHistory = history.length > 0;

    if (trimmedRole.length > MAX_ROLE_LENGTH) {
      return NextResponse.json(
        { error: "That role is too long. Please shorten it and try again." },
        { status: 400 }
      );
    }

    if (trimmedAnswer.length > MAX_ANSWER_LENGTH) {
      return NextResponse.json(
        {
          error:
            "That input is too long. Please shorten it and try again.",
        },
        { status: 413 }
      );
    }

    if (
      history.some((message) => message.content.trim().length > MAX_HISTORY_MESSAGE_LENGTH)
    ) {
      return NextResponse.json(
        {
          error:
            "This interview is too large to continue right now. Please start a new session.",
        },
        { status: 413 }
      );
    }

    if (hasHistory && !trimmedAnswer) {
      return NextResponse.json(
        { error: "Please enter something before submitting." },
        { status: 400 }
      );
    }

    const groq = getGroqClient();

    if (!groq) {
      return NextResponse.json(
        {
          error:
            "The interview assistant is unavailable right now. Please try again later.",
        },
        { status: 503 }
      );
    }

    const roleContext = trimmedRole || "Entry-Level Professional";
    const latestQuestion = getLatestQuestionFromHistory(history);
    const startPrompt = trimmedRole
      ? `Start the interview for the role "${trimmedRole}". Ask a realistic first interview question that fits this role and keep the interview focused on the responsibilities, tools, and expectations for that position.`
      : "Start the interview for an entry-level professional candidate. Ask a realistic first interview question that fits a general job interview.";
    const gradingContext = latestQuestion
      ? `Previous active interview question: ${latestQuestion}\n`
      : "";
    const answerPrompt = trimmedRole
      ? `Candidate is interviewing for the role "${roleContext}". ${gradingContext}Candidate answer: ${trimmedAnswer}\nEvaluate this answer against the previous active interview question. Continue the interview.`
      : `${gradingContext}Candidate answer: ${trimmedAnswer}\nEvaluate this answer against the previous active interview question. Continue the interview.`;

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history,
      {
        role: "user" as const,
        content: trimmedAnswer
          ? hasHistory
            ? answerPrompt
            : `Start the interview for an entry-level professional candidate. Candidate preferences: ${trimmedAnswer}`
          : startPrompt,
      },
    ];

    const completion = await withTimeout(
      groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0.3,
        messages,
      }),
      MODEL_TIMEOUT_MS,
      "Interview request timed out."
    );

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error:
            "The interview assistant returned an empty response. Please try again.",
        },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        {
          error:
            "The interview assistant returned an invalid response. Please try again.",
        },
        { status: 502 }
      );
    }

    const parsedResponse = parseInterviewResponse(parsed);

    if (!getCurrentQuestionText(parsedResponse)) {
      return NextResponse.json(
        {
          error:
            "The interview assistant returned an incomplete response. Please try again.",
        },
        { status: 502 }
      );
    }

    if (
      hasHistory &&
      (isObviousNonAnswer(trimmedAnswer) ||
        isCopiedQuestionAnswer(trimmedAnswer, latestQuestion))
    ) {
      applyNonAnswerEvaluation(parsed);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Interview API error:", error);
    return NextResponse.json(
      { error: getInterviewApiErrorMessage(error) },
      {
        status:
          error instanceof Error &&
          error.message.toLowerCase().includes("timed out")
            ? 504
            : 500,
      }
    );
  }
}
