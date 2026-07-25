import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/hooks/useAppData";
import { aiService } from "@/lib/ai/aiService";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [
    { title: "Recovery Timeline — RecoveryOS AI" },
    { name: "description", content: "Every check-in, patterns, and an AI-generated weekly summary." },
    { property: "og:title", content: "Recovery Timeline — RecoveryOS AI" },
    { property: "og:description", content: "Your full recovery timeline." },
  ]}),
  component: TimelinePage,
});

function TimelinePage() {
  const { checkIns } = useAppData();
  const [summary, setSummary] = useState("");

  useEffect(() => {
    aiService.timelineSummary(checkIns).then(setSummary);
  }, [checkIns]);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Your recovery timeline</h1>

      <section className="mt-4 rounded-2xl bg-gradient-calm p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-calm-foreground">AI weekly summary</h2>
        <p className="mt-2 text-base text-calm-foreground">{summary || "Generating…"}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">All check-ins ({checkIns.length})</h2>
        {checkIns.length === 0 ? (
          <p className="mt-4 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No check-ins yet. Your first one will appear here.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {checkIns.map((c) => (
              <li key={c.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{c.mood}</span>
                  <time className="text-xs text-muted-foreground" dateTime={c.createdAt}>
                    {new Date(c.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Intensity {c.intensity}/5 · Trigger: <span className="capitalize">{c.trigger}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}
