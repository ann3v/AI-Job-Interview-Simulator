"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const FEEDBACK_STORAGE_KEY = "interviewsim:last-feedback-note";
const MAX_FEEDBACK_LENGTH = 4000;

export function FeedbackForm() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFeedback = feedback.trim();

    if (!normalizedFeedback) {
      setError("Please enter your feedback before submitting.");
      setStatus(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    const feedbackPayload = {
      email: user?.email ?? null,
      message: normalizedFeedback,
      submittedAt: new Date().toISOString(),
      userId: user?.id ?? null,
    };

    try {
      window.localStorage.setItem(
        FEEDBACK_STORAGE_KEY,
        JSON.stringify(feedbackPayload)
      );

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackPayload),
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Unable to send feedback right now. Please try again."
        );
      }

      setFeedback("");
      setStatus("Feedback sent. Thank you for helping improve the app.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send feedback right now. Please try again."
      );
      setStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="feedback"
          className="text-sm font-medium text-zinc-700"
        >
          What should we improve?
        </label>
        <textarea
          id="feedback"
          rows={6}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={MAX_FEEDBACK_LENGTH}
          placeholder="Share bugs, confusing moments, or ideas for the next version."
          className="w-full rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || feedback.trim().length === 0}
          className="inline-flex items-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Send Feedback"}
        </button>
        <p className="text-sm text-zinc-600">
          Feedback is emailed to the project owner.
        </p>
        <p className="text-sm text-zinc-500">
          {feedback.length}/{MAX_FEEDBACK_LENGTH} characters
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-emerald-600" role="status">
          {status}
        </p>
      ) : null}
    </form>
  );
}
