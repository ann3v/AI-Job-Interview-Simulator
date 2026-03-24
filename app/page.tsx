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
              Practice technical interviews in a protected dashboard with
              Supabase authentication.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
              Sign up or log in, head to the dashboard, and continue using the
              same interview simulator flow that powers the role setup,
              question-by-question practice, and feedback review.
            </p>
          </div>

          <div className="flex flex-col gap-4 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Demo-ready flow
              </p>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                The landing page stays public while the interview workspace now
                lives under <span className="font-semibold">/dashboard</span>.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                Log in
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-6 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Auth stays separate
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Supabase session state lives in a dedicated context so the
              interview hook and route handler stay focused on interview logic.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Dashboard stays familiar
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              The same simulator components now render inside the protected
              dashboard without changing the existing practice flow.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Simple school-project UX
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Validation, loading states, success messages, and a logout action
              are included without introducing a large rewrite.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
