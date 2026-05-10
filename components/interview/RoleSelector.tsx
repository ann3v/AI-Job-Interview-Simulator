"use client";

import {
  FEATURED_ROLE_OPTIONS,
  MAX_ROLE_LENGTH,
  ROLE_OPTIONS,
} from "@/lib/interview";

type RoleSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

function getRoleMatchRank(option: string, query: string) {
  const normalizedOption = option.toLowerCase();

  if (normalizedOption.startsWith(query)) {
    return 0;
  }

  if (normalizedOption.split(" ").some((word) => word.startsWith(query))) {
    return 1;
  }

  return 2;
}

export function RoleSelector({
  value,
  onChange,
  disabled,
}: RoleSelectorProps) {
  const normalizedValue = value.trim().toLowerCase();
  const suggestedRoles = normalizedValue
    ? ROLE_OPTIONS.filter((option) =>
        option.toLowerCase().includes(normalizedValue)
      )
        .sort(
          (firstOption, secondOption) =>
            getRoleMatchRank(firstOption, normalizedValue) -
              getRoleMatchRank(secondOption, normalizedValue) ||
            firstOption.localeCompare(secondOption)
        )
        .slice(0, 8)
    : FEATURED_ROLE_OPTIONS;

  return (
    <div className="space-y-3">
      <label htmlFor="role-input" className="text-sm font-medium text-zinc-700">
        Type your target role
      </label>
      <input
        id="role-input"
        list="role-options"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_ROLE_LENGTH}
        placeholder="e.g. Police Officer, Mechanic, Nurse"
        className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-sky-500 focus:bg-white"
        aria-describedby="role-hint role-suggestions-label"
        disabled={disabled}
      />
      <datalist id="role-options">
        {ROLE_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <p id="role-hint" className="text-sm leading-6 text-zinc-500">
        Use a real job title from any field. Suggestions are only shortcuts.
      </p>
      {suggestedRoles.length > 0 ? (
        <div className="space-y-2">
          <p
            id="role-suggestions-label"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500"
          >
            Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedRoles.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                disabled={disabled}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
