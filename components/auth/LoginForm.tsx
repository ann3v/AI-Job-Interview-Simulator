"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext";
import {
  getSafeRedirectPath,
  hasAuthErrors,
  validateLoginValues,
  type AuthFieldErrors,
} from "@/lib/auth-validation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type LoginFormValues = {
  email: string;
  password: string;
};

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get("next"));

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  function handleChange(field: keyof LoginFormValues, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedValues = {
      email: values.email.trim(),
      password: values.password,
    };
    const nextErrors = validateLoginValues(trimmedValues);

    if (hasAuthErrors(nextErrors)) {
      setFieldErrors(nextErrors);
      return;
    }

    setPending(true);
    setFieldErrors({});
    setFormError(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedValues.email,
      password: trimmedValues.password,
    });

    if (error) {
      setFormError(error.message);
      setPending(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <AuthShell
      badge="Welcome Back"
      title="Continue your interview practice."
      description="Sign in to resume your latest session, review feedback, and keep improving."
      alternateLabel="Create an account"
      alternateHref="/signup"
      alternateText="Need an account?"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Log in
        </h2>
        <p className="text-sm leading-6 text-zinc-600">
          Continue your interview sessions in seconds.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-zinc-800"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
            disabled={pending || loading}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-50"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {fieldErrors.email ? (
            <p className="text-sm text-red-600" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-zinc-800"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) => handleChange("password", event.target.value)}
            disabled={pending || loading}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-50"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {fieldErrors.password ? (
            <p className="text-sm text-red-600" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending || loading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Signing you in...
            </>
          ) : (
            "Continue interview"
          )}
        </button>
      </form>

      <p className="mt-6 text-sm leading-6 text-zinc-500">
        Want to explore the app first?{" "}
        <Link
          href="/"
          className="font-semibold text-sky-700 transition hover:text-sky-800"
        >
          Return to the landing page
        </Link>
        .
      </p>
    </AuthShell>
  );
}
