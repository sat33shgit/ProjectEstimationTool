"use client";

import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-3.5 sm:py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}


export function days(n: number) {
  const v = Number(n) || 0;
  return `${v % 1 === 0 ? v : v.toFixed(2)}d`;
}
