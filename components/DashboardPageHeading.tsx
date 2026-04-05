import { Pill } from "@/components/interview/Pill";

type DashboardPageHeadingProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function DashboardPageHeading({
  description,
  eyebrow,
  title,
}: DashboardPageHeadingProps) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <Pill tone="accent">{eyebrow}</Pill>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
