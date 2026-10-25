"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("The email or password is incorrect.");
      return;
    }
    router.push("/calendar");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
        <input name="email" type="email" defaultValue="demo@example.com" required autoComplete="email" className="field h-12" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
        <input name="password" type="password" defaultValue="Demo123!" required autoComplete="current-password" className="field h-12" />
      </label>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={loading} className="button-primary h-12 w-full">{loading ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
