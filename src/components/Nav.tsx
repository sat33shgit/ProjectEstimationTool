"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", icon: "▣" },
  { href: "/templates", label: "Templates", icon: "▤" },
  { href: "/projects", label: "Projects", icon: "▦" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white px-4 py-6">
      <div className="px-2 mb-8">
        <div className="text-lg font-semibold text-gray-900">Estimator</div>
        <div className="text-xs text-gray-400">Project Estimation Tool</div>
      </div>
      <nav className="space-y-1">
        {items.map((it) => {
          const active =
            it.href === "/"
              ? pathname === "/"
              : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-gray-400">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
