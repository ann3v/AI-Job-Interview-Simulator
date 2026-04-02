"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext";
import {
  hasAuthErrors,
  validateSignupValues,
  type AuthFieldErrors,
} from "@/lib/auth-validation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
};

const INITIAL_VALUES: SignupFormValues = {
  fullName: "",
  email: "",
  password: "",
};

export function SignupForm() {
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  function handleChange(field: keyof SignupFormValues, value: string) {
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
    setSuccessMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedValues = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
    };
    const nextErrors = validateSignupValues(trimmedValues);

    if (hasAuthErrors(nextErrors)) {
      setFieldErrors(nextErrors);
      return;
    }

    setPending(true);
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: trimmedValues.email,
      password: trimmedValues.password,
      options: {
        data: {
          full_name: trimmedValues.fullName,
        },
      },
    });

    if (error) {
      setFormError(error.message);
      setPending(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Account created. Check your inbox to confirm your email, then log in to start practicing."
    );
    setPending(false);
  }

  return (
    <AuthShell
      badge="Start Practicing"
      title="Create your account to save every session."
      description="Track your interview progress, review feedback anytime, and continue sessions where you left off."
      alternateLabel="Log in instead"
      alternateHref="/login"
      alternateText="Already have an account?"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Create account
        </h2>
        <p className="text-sm leading-6 text-zinc-600">
          It only takes a minute to start your first interview session.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="text-sm font-semibold text-zinc-800"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={values.fullName}
            onChange={(event) => handleChange("fullName", event.target.value)}
            disabled={pending || loading}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-50"
            placeholder="Your full name"
            autoComplete="name"
          />
          {fieldErrors.fullName ? (
            <p className="text-sm text-red-600" role="alert">
              {fieldErrors.fullName}
            </p>
          ) : null}
        </div>

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
            placeholder="Create a password"
            autoComplete="new-password"
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

        {successMessage ? (
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {successMessage}
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
              Creating your account...
            </>
          ) : (
            "Start practicing"
          )}
        </button>
      </form>

      <p className="mt-6 text-sm leading-6 text-zinc-500">
        Want to review the product overview first?{" "}
        <Link
          href="/"
          className="font-semibold text-sky-700 transition hover:text-sky-800"
        >
          Go to home
        </Link>
        .
      </p>
    </AuthShell>
  );
}
