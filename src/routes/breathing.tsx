import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BreathingCircle } from "@/components/BreathingCircle";

export const Route = createFileRoute("/breathing")({
  head: () => ({ meta: [
    { title: "Guided Breathing — RecoveryOS AI" },
    { name: "description", content: "Animated breathing circle with 5-4-3-2-1 grounding exercise." },
    { property: "og:title", content: "Guided Breathing — RecoveryOS AI" },
    { property: "og:description", content: "Animated breathing and grounding." },
  ]}),
  component: BreathingPage,
});

function BreathingPage() {
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Guided Breathing</h1>
      <p className="mt-1 text-sm text-muted-foreground">Two minutes is enough to soften the edge.</p>

      <div className="mt-8 flex flex-col items-center gap-6 rounded-3xl border bg-card p-8 shadow-soft">
        <BreathingCircle running={running} />
        <p className="font-mono text-3xl tabular-nums" aria-live="polite">{mm}:{ss}</p>
        <div className="flex gap-3">
          <button onClick={() => setRunning(!running)} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            {running ? "Pause" : "Resume"}
          </button>
          <button onClick={() => { setSeconds(0); setRunning(true); }} className="rounded-xl border px-5 py-2 text-sm font-semibold">
            Reset
          </button>
        </div>
      </div>
    </AppShell>
  );
}
