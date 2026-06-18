"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/projects", label: "Projects", icon: "◫" },
  { href: "/templates", label: "Templates", icon: "❐" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV_ITEMS.map((it) => {
    const active =
      pathname === it.href ||
      (it.href !== "/" && pathname.startsWith(it.href));
    return (
      <Link
        key={it.href}
        href={it.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <span className="text-gray-400">{it.icon}</span>
        {it.label}
      </Link>
    );
  });

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="md:hidden flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sticky top-0 z-30">
        <span className="text-base font-bold text-brand-700 tracking-tight">
          EstimatePro
        </span>
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex flex-col gap-1.5 p-1"
        >
          <span className={`block h-0.5 w-5 bg-gray-600 transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-gray-600 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-gray-600 transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </header>

      {/* ── Mobile dropdown menu ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[49px] z-20 bg-white border-b border-gray-100 shadow-md px-4 py-3 flex flex-col gap-1">
          {links}
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col w-52 shrink-0 border-r border-gray-100 bg-white min-h-screen px-3 py-6">
        <div className="mb-8 px-3">
          <span className="text-base font-bold text-brand-700 tracking-tight">
            EstimatePro
          </span>
        </div>
        <nav className="flex flex-col gap-1">{links}</nav>
      </aside>
    </>
  );
}
