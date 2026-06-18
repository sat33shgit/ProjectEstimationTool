"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, Input } from "@/components/ui";

// Fallback rates if fetch fails (CAD base)
const FALLBACK = { USD: 0.74, INR: 61.5, CAD: 1 };

function fmtCurrency(amount: number, symbol: string, decimals = 0) {
  return symbol + amount.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

interface Rates { USD: number; INR: number; CAD: number }

export default function SettingsPage() {
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState<Rates>(FALLBACK);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    api.get("/api/settings").then((d) => setHourlyRate(String(d.bill_rate)));

    // Fetch live CAD-based exchange rates
    fetch("https://api.frankfurter.app/latest?base=CAD&symbols=USD,INR")
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) {
          setRates({ CAD: 1, USD: d.rates.USD, INR: d.rates.INR });
        }
      })
      .catch(() => {}) // silently fall back
      .finally(() => setRatesLoading(false));
  }, []);

  const hr = Number(hourlyRate);
  const valid = hourlyRate !== "" && !isNaN(hr) && hr >= 0;

  const perDayCAD = valid ? hr * 8 : null;
  const perHrUSD  = valid ? hr * rates.USD : null;
  const perDayUSD = valid ? hr * 8 * rates.USD : null;
  const perHrINR  = valid ? hr * rates.INR : null;
  const perDayINR = valid ? hr * 8 * rates.INR : null;

  async function save() {
    if (!valid) { setError("Enter a valid bill rate (≥ 0)."); return; }
    setSaving(true);
    setError(null);
    try {
      await api.put("/api/settings", { bill_rate: hr });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Global defaults applied across all projects." />

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-sm text-red-700">{error}</Card>
      )}

      <Card className="p-5 max-w-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Billing</h3>
        <div className="mb-5 space-y-3">

          {/* Input — CAD per hour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default bill rate (CAD / hour)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">CA$</span>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g. 125"
              />
              <span className="text-gray-400 text-sm whitespace-nowrap">/ hr</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Each project can override this rate individually.
            </p>
          </div>

          {/* Equivalent rates table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Equivalent rates
              </span>
              {ratesLoading
                ? <span className="text-xs text-gray-400">Fetching live rates…</span>
                : <span className="text-xs text-gray-400">Live rates · CAD base</span>
              }
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs">
                  <th className="px-4 py-2 text-left font-medium">Currency</th>
                  <th className="px-4 py-2 text-right font-medium">Per hour</th>
                  <th className="px-4 py-2 text-right font-medium">Per day (8 hrs)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50 bg-brand-50">
                  <td className="px-4 py-2 font-medium text-brand-700">🇨🇦 CAD</td>
                  <td className="px-4 py-2 text-right font-semibold text-brand-700">
                    {valid ? fmtCurrency(hr, "CA$") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-brand-700">
                    {perDayCAD != null ? fmtCurrency(perDayCAD, "CA$") : "—"}
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">🇺🇸 USD</td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {perHrUSD != null ? fmtCurrency(perHrUSD, "US$") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {perDayUSD != null ? fmtCurrency(perDayUSD, "US$") : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-700">🇮🇳 INR</td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {perHrINR != null ? fmtCurrency(perHrINR, "₹") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {perDayINR != null ? fmtCurrency(perDayINR, "₹") : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save settings"}
        </Button>
      </Card>
    </div>
  );
}
