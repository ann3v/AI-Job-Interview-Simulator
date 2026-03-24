import { ReactNode } from "react";

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={
        tone === "accent"
          ? "inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"
          : "inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600"
      }
    >
      {children}
    </span>
  );
}
