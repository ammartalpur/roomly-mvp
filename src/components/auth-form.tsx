"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthState } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  return (
    <form action={formAction} className="mt-8 space-y-5">
      {mode === "signup" && <label className="field"><span>Full name</span><input name="name" autoComplete="name" placeholder="Ayesha Khan" required /></label>}
      <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
      <label className="field"><span>Password</span><input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="At least 8 characters" required /></label>
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.error}</p>}
      <button className="button button-primary w-full justify-center py-3" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
      <p className="text-center text-sm text-[#68736e]">{mode === "login" ? "New to Roomly?" : "Already have an account?"} <Link className="font-semibold text-[#1c5949] hover:underline" href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create account" : "Log in"}</Link></p>
    </form>
  );
}
