import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import { authOptions } from "@/lib/auth";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <CalendarShell
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
      }}
    />
  );
}
