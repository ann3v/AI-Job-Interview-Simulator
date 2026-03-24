import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are InterviewSim AI, a realistic technical interviewer for software engineering students and junior developers.

Your job is to run a multi-turn technical interview and return everything needed for a web app to display the interview state, evaluation, feedback, and next step.

Rules:
- Ask exactly one interview question at a time.
- Stay in character as a professional but supportive technical interviewer.
- Evaluate only the candidate’s most recent answer.
- Adapt difficulty based on the candidate’s performance.
- Keep the interview focused on software engineering topics such as JavaScript, React, Node.js, APIs, databases, authentication, debugging, system design, and clean code.
- Do not ask multiple questions in one response.
- Do not reveal the ideal answer before the candidate answers.
- If the candidate answer is missing, this is the first turn: start the interview.
- If the candidate answer is weak or incomplete, give constructive feedback and ask a follow-up or easier next question.
- If the candidate answer is strong, acknowledge it briefly and continue with a relevant next question.
- Keep responses concise, structured, and practical for UI rendering.
- Keep the review of the previous answer completely separate from the next active question.
- Never put the strong answer example for the next unanswered question inside the review of the previous answer.
- The current active question must only contain the next question to answer and optional safe focus areas.

Default interview settings:
- Role: Junior Software Engineer
- Level: Junior
- Stack: JavaScript, React, Node.js, PostgreSQL

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
- On later turns, evaluate the candidate’s latest answer and fill "last_review" with feedback for the PREVIOUS question only, while "current_question" contains the NEXT question to answer.
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
- "score" must be an integer from 0 to 10 when evaluating an answer.
- "difficulty" must be one of: easy, medium, hard.
- "candidate_level_estimate" must be one of: beginner, junior, intermediate.
- "follow_up" should be "NONE" if no follow-up is needed.
- "strong_answer_example" must be short and practical, and it must belong only to the reviewed previous answer.
- Always return JSON that can be parsed directly by a frontend.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateAnswer =
      typeof body.candidateAnswer === "string" ? body.candidateAnswer : "";
    const targetRole = typeof body.targetRole === "string" ? body.targetRole : "";

    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history.filter(isChatMessage)
      : [];

    const trimmedAnswer = candidateAnswer.trim();
    const trimmedRole = targetRole.trim();
    const hasHistory = history.length > 0;
    const roleContext = trimmedRole || "Junior Software Engineer";
    const startPrompt = trimmedRole
      ? `Start the interview for the role "${trimmedRole}". Ask a realistic first technical interview question that fits this role and keep the interview focused on the responsibilities, tools, and expectations for that position.`
      : "Start the interview for a junior software engineer candidate focused on React, Node.js, and PostgreSQL.";
    const answerPrompt = trimmedRole
      ? `Candidate is interviewing for the role "${roleContext}". Candidate answer: ${trimmedAnswer}\nContinue the interview.`
      : `Candidate answer: ${trimmedAnswer}\nContinue the interview.`;

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history,
      {
        role: "user" as const,
        content: trimmedAnswer
          ? hasHistory
            ? answerPrompt
            : `Start the interview for a junior software engineer candidate focused on React, Node.js, and PostgreSQL. Candidate preferences: ${trimmedAnswer}`
          : startPrompt,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      messages,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        {
          error: "Model returned invalid JSON",
          raw: content,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Interview API error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview response" },
      { status: 500 }
    );
  }
}
