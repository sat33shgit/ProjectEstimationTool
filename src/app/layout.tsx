import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Project Estimation Tool",
  description: "Estimate projects with reusable templates, tasks, and subtasks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 px-8 py-8 max-w-6xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
