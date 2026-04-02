import Link from "next/link";
import { Pill } from "@/components/interview/Pill";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-sky-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-200/70">
          <div className="border-b border-zinc-200 bg-linear-to-r from-zinc-950 via-zinc-900 to-sky-900 px-6 py-8 text-white sm:px-8 sm:py-10">
            <Pill tone="accent">AI Interview Practice</Pill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Practice job interviews with realistic questions and clear
              feedback.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
              Choose a role, answer one question at a time, and get actionable
              feedback to improve every session. Save your progress and continue
              practicing anytime.
            </p>
          </div>

          <div className="flex flex-col gap-4 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Your next practice step
              </p>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Start a new interview session or continue where you left off
                from your practice dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Start practicing
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                Continue practice
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-6 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                Open session
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Practice with purpose
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Focus on role-specific interview questions that match what you
              want to improve next.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Learn after every answer
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Get quick feedback and a stronger sample response so you can
              improve immediately.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Track your progress
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Review past sessions, compare answers, and keep building interview
              confidence over time.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
