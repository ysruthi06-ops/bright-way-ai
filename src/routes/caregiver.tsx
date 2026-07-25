import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/hooks/useAppData";
import { aiService } from "@/lib/ai/aiService";

export const Route = createFileRoute("/caregiver")({
  head: () => ({ meta: [
    { title: "Caregiver Dashboard — RecoveryOS AI" },
    { name: "description", content: "Weekly AI summary, trend, and supportive conversation openers for caregivers." },
    { property: "og:title", content: "Caregiver Dashboard — RecoveryOS AI" },
    { property: "og:description", content: "Supportive tools for caregivers." },
  ]}),
  component: CaregiverPage,
});

function CaregiverPage() {
  const { checkIns } = useAppData();
  const [summary, setSummary] = useState("");
  const week = checkIns.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 86400000);
  const avg = week.reduce((s, c) => s + c.intensity, 0) / (week.length || 1);
  const trend = avg > 3.5 ? "Elevated" : avg > 2.5 ? "Steady" : "Calm";

  useEffect(() => { aiService.caregiverSummary(checkIns).then(setSummary); }, [checkIns]);

  const suggestions = [
    "Send a light 'thinking of you' text — no reply expected.",
    "Offer a walk or a shared activity, not a conversation.",
    "Ask 'What would feel supportive today?' rather than giving advice.",
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Caregiver Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Summaries only — never raw notes. Consent-first.</p>

      <section className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="This week" value={String(week.length)} sub="check-ins" />
        <Metric label="Trend" value={trend} sub="intensity" />
        <Metric label="Last mood" value={checkIns[0]?.mood ?? "—"} sub="most recent" />
      </section>

      <section className="mt-4 rounded-2xl bg-gradient-hero p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide">AI weekly summary</h2>
        <p className="mt-2 text-base">{summary || "Generating…"}</p>
      </section>

      <section className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold">Supportive actions this week</h2>
        <ul className="mt-3 space-y-2">
          {suggestions.map((s) => (
            <li key={s} className="rounded-xl bg-calm/40 px-3 py-2 text-sm text-calm-foreground">{s}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold">Risk trend</h2>
        <div className="mt-3 flex items-end gap-1 h-24">
          {week.slice().reverse().map((c, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary/60" style={{ height: `${(c.intensity / 5) * 100}%` }} title={`${c.mood} ${c.intensity}/5`} />
          ))}
          {week.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold capitalize">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
