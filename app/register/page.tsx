import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/calendar");

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="fixed right-5 top-5"><ThemeToggle /></div>
      <section className="app-surface w-full max-w-md rounded-3xl border p-8 shadow-[0_24px_80px_rgba(20,33,61,0.10)]">
        <div className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">D</div>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Daymark</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-2 text-slate-500">Use your own details to start planning.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
