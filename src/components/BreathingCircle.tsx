import { useEffect, useState } from "react";

const PHASES = [
  { label: "Inhale", ms: 4000 },
  { label: "Hold", ms: 2000 },
  { label: "Exhale", ms: 6000 },
] as const;

export function BreathingCircle({ running = true }: { running?: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % PHASES.length), PHASES[idx].ms);
    return () => clearTimeout(t);
  }, [idx, running]);

  const phase = PHASES[idx];
  return (
    <div className="flex flex-col items-center gap-6" aria-live="polite">
      <div className="relative flex h-64 w-64 items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-calm ${running ? "animate-breathe" : ""}`}
          style={{ animationDuration: "12s" }}
          aria-hidden="true"
        />
        <span className="relative text-2xl font-semibold text-calm-foreground">{phase.label}</span>
      </div>
      <p className="text-sm text-muted-foreground">Follow the circle. 4 seconds in, 2 hold, 6 out.</p>
    </div>
  );
}
