import { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">
          {title}
        </p>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
