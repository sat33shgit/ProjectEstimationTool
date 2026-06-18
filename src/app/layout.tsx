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
        <div className="flex min-h-screen flex-col md:flex-row">
          <Nav />
          <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 w-full min-w-0">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
