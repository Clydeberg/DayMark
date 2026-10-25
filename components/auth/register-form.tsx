"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type RegisterFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>();

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={handleSubmit(async (values) => {
        setServerError("");
        if (values.password !== values.confirmPassword) {
          setError("confirmPassword", { type: "validate", message: "Passwords do not match" });
          return;
        }

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          for (const [field, messages] of Object.entries(body.issues?.fieldErrors ?? {})) {
            const message = Array.isArray(messages) ? messages[0] : undefined;
            if (message && (field === "name" || field === "email" || field === "password")) {
              setError(field, { type: "server", message: String(message) });
            }
          }
          setServerError(body.error ?? "Account could not be created.");
          return;
        }

        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        if (result?.error) {
          setServerError("Your account was created. Please sign in.");
          router.push("/login");
          return;
        }
        router.push("/calendar");
        router.refresh();
      })}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Name *</span>
        <input {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } })} autoComplete="name" className="field h-12" />
        {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span>
        <input {...register("email", { required: "Email is required" })} type="email" autoComplete="email" className="field h-12" />
        {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Password *</span>
        <input {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} type="password" autoComplete="new-password" className="field h-12" />
        {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm password *</span>
        <input {...register("confirmPassword", { required: "Please confirm your password" })} type="password" autoComplete="new-password" className="field h-12" />
        {errors.confirmPassword ? <span className="field-error">{errors.confirmPassword.message}</span> : null}
      </label>

      {serverError ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
      <button type="submit" disabled={isSubmitting} className="button-primary h-12 w-full">{isSubmitting ? "Creating account…" : "Create account"}</button>
      <p className="text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link></p>
    </form>
  );
}
