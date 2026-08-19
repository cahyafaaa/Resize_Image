"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "../actions/auth";
import type { AuthFormState } from "../lib/validation";

const initialState: AuthFormState = {
  message: "",
};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-5">
      {state.message ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm font-semibold text-red-700 shadow-xs"
        >
          {state.message}
        </div>
      ) : null}

      <label className="grid gap-1.5 text-xs font-bold text-slate-700">
        Full Name
        <input
          className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="e.g. Alex Pratama"
          required
        />
        {state.fieldErrors?.name ? (
          <span className="text-xs font-bold text-red-600">{state.fieldErrors.name}</span>
        ) : null}
      </label>

      <label className="grid gap-1.5 text-xs font-bold text-slate-700">
        Email Address
        <input
          className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
        {state.fieldErrors?.email ? (
          <span className="text-xs font-bold text-red-600">{state.fieldErrors.email}</span>
        ) : null}
      </label>

      <label className="grid gap-1.5 text-xs font-bold text-slate-700">
        Password
        <input
          className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          minLength={8}
          required
        />
        {state.fieldErrors?.password ? (
          <span className="text-xs font-bold text-red-600">
            {state.fieldErrors.password}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-xs text-slate-600">
        Already have an account?{" "}
        <Link className="font-bold text-blue-600 hover:text-blue-800 hover:underline" href="/login">
          Sign In
        </Link>
      </p>
    </form>
  );
}
