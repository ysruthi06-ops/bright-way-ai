import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { aiService, knowledgeBase } from "@/lib/ai/aiService";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [
    { title: "Recovery Knowledge — RecoveryOS AI" },
    { name: "description", content: "Grounded answers to common recovery questions. AI answers only from verified resources." },
    { property: "og:title", content: "Recovery Knowledge — RecoveryOS AI" },
    { property: "og:description", content: "Recovery knowledge assistant." },
  ]}),
  component: ResourcesPage,
});

function ResourcesPage() {
  const [answer, setAnswer] = useState("");
  const [asked, setAsked] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (q: string) => {
    setAsked(q);
    setBusy(true);
    setAnswer(await aiService.knowledge(q));
    setBusy(false);
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Recovery Knowledge</h1>
      <p className="mt-1 text-sm text-muted-foreground">Grounded in verified resources. No guessing.</p>

      <section className="mt-6">
        <h2 className="text-base font-semibold">Ask a question</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {knowledgeBase.map((k) => (
            <button
              key={k.q}
              onClick={() => ask(k.q)}
              className="rounded-2xl border bg-card p-3 text-left text-sm font-medium shadow-sm hover:bg-accent/40"
            >
              {k.q}
            </button>
          ))}
        </div>
      </section>

      {asked && (
        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft" aria-live="polite">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{asked}</p>
          <p className="mt-2 whitespace-pre-wrap text-base">{busy ? "Thinking…" : answer}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-base font-semibold">All resources</h2>
        <ul className="mt-3 space-y-3">
          {knowledgeBase.map((k) => (
            <li key={k.q} className="rounded-2xl border bg-card p-4">
              <p className="font-semibold">{k.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{k.a}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
