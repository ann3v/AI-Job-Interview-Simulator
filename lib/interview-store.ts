import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  ChatMessage,
  CurrentQuestionState,
  InterviewState,
  LastReviewState,
  VisibleEvaluation,
} from "@/lib/interview";

export type PersistedInterviewSessionStatus =
  | "in_progress"
  | "completed"
  | "abandoned";

type InterviewSessionRow = {
  id: string;
  user_id: string;
  target_role: string;
  status: PersistedInterviewSessionStatus;
  current_question_number: number | null;
  current_question_text: string | null;
  current_focus_areas: unknown;
  current_topic: string | null;
  current_difficulty: string | null;
  candidate_level_estimate: string | null;
  submitted_answers_count: number | null;
  conversation_history: unknown;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type InterviewTurnRow = {
  id: string;
  session_id: string;
  user_id: string;
  turn_number: number;
  question_text: string;
  focus_areas: unknown;
  submitted_answer: string;
  evaluation_score: number | null;
  correctness: string | null;
  clarity: string | null;
  depth: string | null;
  feedback: string | null;
  follow_up: string | null;
  strong_answer_example: string | null;
  created_at: string;
  updated_at: string;
};

export type PersistedInterviewSession = {
  id: string;
  userId: string;
  targetRole: string;
  status: PersistedInterviewSessionStatus;
  currentQuestionNumber: number | null;
  currentQuestionText: string | null;
  currentFocusAreas: string[];
  currentTopic: string | null;
  currentDifficulty: string | null;
  candidateLevelEstimate: string | null;
  submittedAnswersCount: number;
  conversationHistory: ChatMessage[];
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersistedInterviewTurn = {
  id: string;
  sessionId: string;
  userId: string;
  turnNumber: number;
  questionText: string;
  focusAreas: string[];
  submittedAnswer: string;
  evaluation: VisibleEvaluation | null;
  feedback: string | null;
  followUp: string | null;
  strongAnswerExample: string | null;
  createdAt: string;
  updatedAt: string;
};

type SaveInterviewSessionParams = {
  sessionId: string;
  userId: string;
  targetRole: string;
  currentQuestionState: CurrentQuestionState;
  interviewMeta: InterviewState | undefined;
  history: ChatMessage[];
  submittedAnswersCount: number;
  status: PersistedInterviewSessionStatus;
};

type CreateInterviewSessionParams = Omit<SaveInterviewSessionParams, "sessionId">;

type SaveInterviewTurnParams = {
  sessionId: string;
  userId: string;
  turnNumber: number;
  questionText: string;
  focusAreas: string[];
  submittedAnswer: string;
  review: LastReviewState | null;
};

const INTERVIEW_SESSION_COLUMNS =
  "id, user_id, target_role, status, current_question_number, current_question_text, current_focus_areas, current_topic, current_difficulty, candidate_level_estimate, submitted_answers_count, conversation_history, started_at, completed_at, created_at, updated_at";

const INTERVIEW_TURN_COLUMNS =
  "id, session_id, user_id, turn_number, question_text, focus_areas, submitted_answer, evaluation_score, correctness, clarity, depth, feedback, follow_up, strong_answer_example, created_at, updated_at";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];
}

function normalizeChatMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  const role = value.role;
  const content = value.content;

  if (
    (role !== "user" && role !== "assistant") ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return null;
  }

  return {
    role,
    content,
  };
}

function normalizeConversationHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const normalized = normalizeChatMessage(item);
    return normalized ? [normalized] : [];
  });
}

function parseEvaluationScore(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toVisibleEvaluation(row: InterviewTurnRow): VisibleEvaluation | null {
  const score =
    typeof row.evaluation_score === "number" ? String(row.evaluation_score) : null;
  const correctness = normalizeText(row.correctness);
  const clarity = normalizeText(row.clarity);
  const depth = normalizeText(row.depth);

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

function mapSessionRow(row: InterviewSessionRow): PersistedInterviewSession {
  return {
    id: row.id,
    userId: row.user_id,
    targetRole: row.target_role,
    status: row.status,
    currentQuestionNumber: row.current_question_number,
    currentQuestionText: normalizeText(row.current_question_text),
    currentFocusAreas: normalizeStringArray(row.current_focus_areas),
    currentTopic: normalizeText(row.current_topic),
    currentDifficulty: normalizeText(row.current_difficulty),
    candidateLevelEstimate: normalizeText(row.candidate_level_estimate),
    submittedAnswersCount:
      typeof row.submitted_answers_count === "number"
        ? row.submitted_answers_count
        : 0,
    conversationHistory: normalizeConversationHistory(row.conversation_history),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTurnRow(row: InterviewTurnRow): PersistedInterviewTurn {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    turnNumber: row.turn_number,
    questionText: row.question_text,
    focusAreas: normalizeStringArray(row.focus_areas),
    submittedAnswer: row.submitted_answer,
    evaluation: toVisibleEvaluation(row),
    feedback: normalizeText(row.feedback),
    followUp: normalizeText(row.follow_up),
    strongAnswerExample: normalizeText(row.strong_answer_example),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildSessionPayload({
  userId,
  targetRole,
  currentQuestionState,
  interviewMeta,
  history,
  submittedAnswersCount,
  status,
}: CreateInterviewSessionParams) {
  return {
    user_id: userId,
    target_role: targetRole,
    status,
    current_question_number:
      currentQuestionState.questionNumber ?? interviewMeta?.question_number ?? null,
    current_question_text: currentQuestionState.questionText,
    current_focus_areas: currentQuestionState.focusAreas,
    current_topic: currentQuestionState.topic ?? interviewMeta?.topic ?? null,
    current_difficulty:
      currentQuestionState.difficulty ?? interviewMeta?.difficulty ?? null,
    candidate_level_estimate: interviewMeta?.candidate_level_estimate ?? null,
    submitted_answers_count: submittedAnswersCount,
    conversation_history: history.map(({ role, content }) => ({ role, content })),
    completed_at: status === "in_progress" ? null : new Date().toISOString(),
  };
}

export async function createInterviewSession(
  params: CreateInterviewSessionParams
) {
  const supabase = getSupabaseBrowserClient();
  const payload = buildSessionPayload(params);
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert(payload)
    .select(INTERVIEW_SESSION_COLUMNS)
    .single<InterviewSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapSessionRow(data);
}

export async function updateInterviewSession(params: SaveInterviewSessionParams) {
  const supabase = getSupabaseBrowserClient();
  const payload = buildSessionPayload(params);
  const { data, error } = await supabase
    .from("interview_sessions")
    .update(payload)
    .eq("id", params.sessionId)
    .eq("user_id", params.userId)
    .select(INTERVIEW_SESSION_COLUMNS)
    .single<InterviewSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapSessionRow(data);
}

export async function updateInterviewSessionStatus({
  sessionId,
  userId,
  status,
}: {
  sessionId: string;
  userId: string;
  status: PersistedInterviewSessionStatus;
}) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .update({
      status,
      completed_at: status === "in_progress" ? null : new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select(INTERVIEW_SESSION_COLUMNS)
    .single<InterviewSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapSessionRow(data);
}

export async function createInterviewTurn({
  sessionId,
  userId,
  turnNumber,
  questionText,
  focusAreas,
  submittedAnswer,
  review,
}: SaveInterviewTurnParams) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_turns")
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_number: turnNumber,
      question_text: questionText,
      focus_areas: focusAreas,
      submitted_answer: submittedAnswer,
      evaluation_score: parseEvaluationScore(review?.evaluation?.score ?? null),
      correctness: review?.evaluation?.correctness ?? null,
      clarity: review?.evaluation?.clarity ?? null,
      depth: review?.evaluation?.depth ?? null,
      feedback: review?.feedback ?? null,
      follow_up: review?.followUp ?? null,
      strong_answer_example: review?.strongAnswerExample ?? null,
    })
    .select(INTERVIEW_TURN_COLUMNS)
    .single<InterviewTurnRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapTurnRow(data);
}

export async function getLatestInProgressInterviewSession(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<InterviewSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSessionRow(data) : null;
}

export async function getLatestContinuableInterviewSession(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("user_id", userId)
    .not("current_question_text", "is", null)
    .neq("current_question_text", "")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<InterviewSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSessionRow(data) : null;
}

export async function getLatestInterviewTurn(sessionId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_turns")
    .select(INTERVIEW_TURN_COLUMNS)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("turn_number", { ascending: false })
    .limit(1)
    .maybeSingle<InterviewTurnRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTurnRow(data) : null;
}

export async function listInterviewSessions(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<InterviewSessionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapSessionRow);
}

export async function getInterviewSessionById(sessionId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(INTERVIEW_SESSION_COLUMNS)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle<InterviewSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSessionRow(data) : null;
}

export async function listInterviewTurns(sessionId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("interview_turns")
    .select(INTERVIEW_TURN_COLUMNS)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("turn_number", { ascending: true })
    .returns<InterviewTurnRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTurnRow);
}

export async function deleteInterviewSession(sessionId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("interview_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
