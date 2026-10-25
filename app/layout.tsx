import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daymark Calendar",
  description: "Plan tasks, meetings, events, and deadlines in one calendar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
