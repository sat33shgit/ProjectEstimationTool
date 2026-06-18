"use client";

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

  return (
    <aside className="w-52 shrink-0 border-r border-gray-100 bg-white min-h-screen px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-base font-bold text-brand-700 tracking-tight">
          EstimatePro
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href))
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="text-gray-400">{it.icon}</span>
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
