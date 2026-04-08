import { MAX_ROLE_LENGTH, ROLE_OPTIONS } from "@/lib/interview";

type RoleSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

export function RoleSelector({
  value,
  onChange,
  disabled,
}: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="role-input" className="text-sm font-medium text-zinc-700">
        Choose your target role
      </label>
      <input
        id="role-input"
        list="role-options"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_ROLE_LENGTH}
        placeholder="e.g. Junior React Developer"
        className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-sky-500 focus:bg-white"
        aria-describedby="role-hint"
        disabled={disabled}
      />
      <datalist id="role-options">
        {ROLE_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <p id="role-hint" className="text-sm leading-6 text-zinc-500">
        Pick one of the suggested roles or type your own custom role to shape
        the interview.
      </p>
    </div>
  );
}
