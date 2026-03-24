import type { ReactNode } from "react";
import Link from "next/link";
import { Pill } from "@/components/interview/Pill";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  alternateLabel: string;
  alternateHref: string;
  alternateText: string;
  children: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  alternateLabel,
  alternateHref,
  alternateText,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-sky-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-200/70">
          <div className="border-b border-zinc-200 bg-linear-to-r from-zinc-950 via-zinc-900 to-sky-900 px-6 py-8 text-white sm:px-8 sm:py-10">
            <Pill tone="accent">{badge}</Pill>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-200 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div className="rounded-[1.75rem] bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-950">
                Why sign in first?
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Your interview dashboard stays separate from the public landing
                page, which keeps auth logic isolated from the simulator flow.
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-zinc-50 p-5">
              <p className="text-sm font-semibold text-zinc-950">
                What you can do inside the dashboard
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Start a role-specific interview, answer questions one at a
                time, and review AI feedback without changing the existing
                interview architecture.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          {children}

          <div className="mt-6 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
            {alternateText}{" "}
            <Link
              href={alternateHref}
              className="font-semibold text-sky-700 transition hover:text-sky-800"
            >
              {alternateLabel}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
