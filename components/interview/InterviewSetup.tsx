import { FormEvent } from "react";
import { FEATURED_ROLE_OPTIONS, ROLE_OPTIONS } from "@/lib/interview";
import { Pill } from "@/components/interview/Pill";
import { RoleSelector } from "@/components/interview/RoleSelector";

type InterviewSetupProps = {
  role: string;
  onRoleChange: (value: string) => void;
  onRolePick: (value: string) => void;
  onStart: (event: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  loading: boolean;
};

export function InterviewSetup({
  role,
  onRoleChange,
  onRolePick,
  onStart,
  error,
  loading,
}: InterviewSetupProps) {
  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-200/70">
        <div className="border-b border-zinc-200 bg-linear-to-r from-zinc-950 via-zinc-900 to-sky-900 px-6 py-8 text-white sm:px-8 sm:py-10">
          <Pill tone="accent">Interview Practice</Pill>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Walk into your next technical interview with a clear game plan.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
            Choose your target role, start the session, and answer one interview
            question at a time. The app will reveal useful feedback as the
            interview progresses.
          </p>
        </div>

        <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={onStart}>
          <RoleSelector
            value={role}
            onChange={onRoleChange}
            disabled={loading}
          />

          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onRolePick(option)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                disabled={loading}
              >
                {option}
              </button>
            ))}
          </div>

          {error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-zinc-500">
              The first question will be generated after you start, so the
              screen stays focused until you are ready.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-48 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Starting interview...
                </>
              ) : (
                "Start Interview"
              )}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {FEATURED_ROLE_OPTIONS.map((featuredRole) => (
          <div
            key={featuredRole}
            className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-zinc-950">{featuredRole}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              A good choice if you want focused, role-specific interview
              questions without extra setup.
            </p>
          </div>
        ))}
      </section>
    </>
  );
}
