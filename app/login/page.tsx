import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/calendar");

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(20,33,61,0.10)]">
        <div className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">D</div>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Daymark</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-2 text-slate-500">Sign in to view and manage your calendar.</p>
        <LoginForm />
        <p className="mt-6 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">The demo credentials are pre-filled after you run the database seed command.</p>
      </section>
    </main>
  );
}
