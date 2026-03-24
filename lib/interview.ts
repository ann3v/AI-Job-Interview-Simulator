export const ROLE_OPTIONS = [
  "Junior React Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Junior Java Developer",
  "Junior Python Developer",
  "Node.js Developer",
  "DevOps Engineer",
  "Data Analyst",
  "Data Scientist",
  "Mobile Developer",
  "QA Engineer",
  "UI/UX Developer",
  "Machine Learning Engineer",
];

export const FEATURED_ROLE_OPTIONS = ROLE_OPTIONS.slice(0, 6);

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type InterviewState = {
  status?: string;
  question_number?: number;
  difficulty?: string;
  candidate_level_estimate?: string;
  topic?: string;
};

export type InterviewEvaluation = {
  score?: number | null;
  correctness?: string;
  clarity?: string;
  depth?: string;
};

export type InterviewResponse = {
  interview_state?: InterviewState;
  interview_meta?: InterviewState;
  question?: string;
  what_im_looking_for?: string[];
  evaluation?: InterviewEvaluation;
  feedback?: string;
  follow_up?: string;
  ideal_answer?: string;
  next_action?: string;
  current_question?: {
    question_text?: string;
    focus_areas?: string[];
  };
  last_review?: {
    reviewed_question_text?: string;
    evaluation?: InterviewEvaluation;
    feedback?: string;
    follow_up?: string;
    strong_answer_example?: string;
  } | null;
  [key: string]: unknown;
};

export type VisibleEvaluation = {
  score: string | null;
  correctness: string | null;
  clarity: string | null;
  depth: string | null;
};

export type CurrentQuestionState = {
  questionText: string | null;
  questionNumber: number | null;
  topic: string | null;
  difficulty: string | null;
  focusAreas: string[];
};

export type LastReviewState = {
  reviewedQuestionText: string | null;
  reviewedQuestionNumber: number | null;
  submittedAnswer: string;
  evaluation: VisibleEvaluation | null;
  feedback: string | null;
  followUp: string | null;
  strongAnswerExample: string | null;
};

export type SplitInterviewTurnResult = {
  interviewMeta: InterviewState | undefined;
  currentQuestionState: CurrentQuestionState;
  lastReviewState: LastReviewState | null;
  plainTextResponse: string | null;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getMeaningfulText(
  value: unknown,
  blockedValues: string[] = []
) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  return blockedValues.includes(text) ? null : text;
}

export function serializeAssistantResponse(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function parseInterviewResponse(value: unknown) {
  return isRecord(value) ? (value as InterviewResponse) : null;
}

export function getVisibleEvaluation(
  response: InterviewResponse | null
): VisibleEvaluation | null {
  if (!response || !isRecord(response.evaluation)) {
    return null;
  }

  const evaluation = response.evaluation as InterviewEvaluation;
  const score =
    typeof evaluation.score === "number" ? String(evaluation.score) : null;
  const correctness = getMeaningfulText(evaluation.correctness, ["N/A"]);
  const clarity = getMeaningfulText(evaluation.clarity, ["N/A"]);
  const depth = getMeaningfulText(evaluation.depth, ["N/A"]);

  if (!score && !correctness && !clarity && !depth) {
    return null;
  }

  return {
    score,
    correctness,
    clarity,
    depth,
  };
}

function getFocusAreas(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];
}

function getInterviewMeta(response: InterviewResponse | null) {
  return response?.interview_meta ?? response?.interview_state;
}

function getCurrentQuestionState(
  response: InterviewResponse | null
): CurrentQuestionState {
  const meta = getInterviewMeta(response);
  const nestedQuestion = isRecord(response?.current_question)
    ? response.current_question
    : null;

  return {
    questionText: getMeaningfulText(
      nestedQuestion?.question_text ?? response?.question
    ),
    questionNumber:
      typeof meta?.question_number === "number" ? meta.question_number : null,
    topic: getMeaningfulText(meta?.topic),
    difficulty: getMeaningfulText(meta?.difficulty),
    focusAreas: getFocusAreas(
      nestedQuestion?.focus_areas ?? response?.what_im_looking_for
    ),
  };
}

function getLastReviewState({
  response,
  previousQuestionState,
  submittedAnswer,
}: {
  response: InterviewResponse | null;
  previousQuestionState: CurrentQuestionState | null;
  submittedAnswer: string | null;
}): LastReviewState | null {
  if (!submittedAnswer) {
    return null;
  }

  const nestedReview = isRecord(response?.last_review) ? response.last_review : null;
  const evaluation = getVisibleEvaluation(
    nestedReview
      ? {
          evaluation: nestedReview.evaluation,
        }
      : response
  );
  const feedback = getMeaningfulText(
    nestedReview?.feedback ?? response?.feedback,
    ["N/A"]
  );
  const followUp = getMeaningfulText(
    nestedReview?.follow_up ?? response?.follow_up,
    ["NONE", "N/A"]
  );
  const strongAnswerExample = getMeaningfulText(
    nestedReview?.strong_answer_example,
    ["N/A"]
  );

  if (!evaluation && !feedback && !followUp && !strongAnswerExample) {
    return null;
  }

  return {
    reviewedQuestionText:
      getMeaningfulText(nestedReview?.reviewed_question_text) ??
      previousQuestionState?.questionText ??
      null,
    reviewedQuestionNumber: previousQuestionState?.questionNumber ?? null,
    submittedAnswer,
    evaluation,
    feedback,
    followUp,
    strongAnswerExample,
  };
}

export function splitInterviewTurn({
  payload,
  previousQuestionState,
  submittedAnswer,
}: {
  payload: unknown;
  previousQuestionState: CurrentQuestionState | null;
  submittedAnswer: string | null;
}): SplitInterviewTurnResult {
  const response = parseInterviewResponse(payload);

  if (!response) {
    return {
      interviewMeta: undefined,
      currentQuestionState:
        previousQuestionState ?? {
          questionText: null,
          questionNumber: null,
          topic: null,
          difficulty: null,
          focusAreas: [],
        },
      lastReviewState: null,
      plainTextResponse: typeof payload === "string" ? payload : null,
    };
  }

  return {
    interviewMeta: getInterviewMeta(response),
    currentQuestionState: getCurrentQuestionState(response),
    lastReviewState: getLastReviewState({
      response,
      previousQuestionState,
      submittedAnswer,
    }),
    plainTextResponse: typeof payload === "string" ? payload : null,
  };
}
