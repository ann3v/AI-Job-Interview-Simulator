import { NextResponse } from "next/server";

const FEEDBACK_RECIPIENT_EMAIL =
  process.env.FEEDBACK_EMAIL_TO ?? "arditavdiu699@gmail.com";
const MAX_FEEDBACK_LENGTH = 4000;
const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildFeedbackText({
  email,
  message,
  submittedAt,
  userId,
}: {
  email: string | null;
  message: string;
  submittedAt: string;
  userId: string | null;
}) {
  return [
    "New AI Job Interview Simulator feedback",
    "",
    `Submitted at: ${submittedAt}`,
    `User email: ${email ?? "Not signed in or unavailable"}`,
    `User ID: ${userId ?? "Not signed in or unavailable"}`,
    "",
    "Message:",
    message,
  ].join("\n");
}

function buildFeedbackHtml({
  email,
  message,
  submittedAt,
  userId,
}: {
  email: string | null;
  message: string;
  submittedAt: string;
  userId: string | null;
}) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #18181b;">
      <h1 style="font-size: 20px;">New AI Job Interview Simulator feedback</h1>
      <p><strong>Submitted at:</strong> ${escapeHtml(submittedAt)}</p>
      <p><strong>User email:</strong> ${escapeHtml(email ?? "Not signed in or unavailable")}</p>
      <p><strong>User ID:</strong> ${escapeHtml(userId ?? "Not signed in or unavailable")}</p>
      <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid feedback payload. Please try again." },
      { status: 400 }
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Invalid feedback payload. Please try again." },
      { status: 400 }
    );
  }

  const message = getOptionalText(body.message);
  const email = getOptionalText(body.email);
  const userId = getOptionalText(body.userId);
  const submittedAt = new Date().toISOString();

  if (!message) {
    return NextResponse.json(
      { error: "Please enter your feedback before submitting." },
      { status: 400 }
    );
  }

  if (message.length > MAX_FEEDBACK_LENGTH) {
    return NextResponse.json(
      { error: "That feedback is too long. Please shorten it and try again." },
      { status: 413 }
    );
  }

  if (!process.env.RESEND_API_KEY || !process.env.FEEDBACK_EMAIL_FROM) {
    return NextResponse.json(
      {
        error:
          "Feedback email is not configured yet. Add RESEND_API_KEY and FEEDBACK_EMAIL_FROM to your environment variables.",
      },
      { status: 503 }
    );
  }

  const text = buildFeedbackText({
    email,
    message,
    submittedAt,
    userId,
  });

  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FEEDBACK_EMAIL_FROM,
      to: [FEEDBACK_RECIPIENT_EMAIL],
      subject: "New InterviewSim feedback",
      text,
      html: buildFeedbackHtml({
        email,
        message,
        submittedAt,
        userId,
      }),
      reply_to: email ?? undefined,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          "Feedback could not be emailed right now. Please check the email service configuration and try again.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
