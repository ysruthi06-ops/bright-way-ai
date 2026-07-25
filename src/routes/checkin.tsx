import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { store, uid, type Mood, type Trigger } from "@/lib/storage";

export const Route = createFileRoute("/checkin")({
  head: () => ({ meta: [
    { title: "Zero-typing Check-in — RecoveryOS AI" },
    { name: "description", content: "Log how you feel with three taps. No typing required." },
    { property: "og:title", content: "Zero-typing Check-in — RecoveryOS AI" },
    { property: "og:description", content: "Three-tap emotional check-in." },
  ]}),
  component: CheckInPage,
});

const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: "happy", label: "Happy", emoji: "😊" },
  { key: "calm", label: "Calm", emoji: "😌" },
  { key: "anxious", label: "Anxious", emoji: "😟" },
  { key: "sad", label: "Sad", emoji: "😢" },
  { key: "angry", label: "Angry", emoji: "😠" },
  { key: "craving", label: "Craving", emoji: "🌊" },
];

const TRIGGERS: { key: Trigger; label: string }[] = [
  { key: "stress", label: "Stress" }, { key: "work", label: "Work" },
  { key: "loneliness", label: "Loneliness" }, { key: "friends", label: "Friends" },
  { key: "family", label: "Family" }, { key: "money", label: "Money" },
  { key: "other", label: "Other" },
];

function CheckInPage() {
  const navigate = useNavigate();
  const [mood, setMood] = useState<Mood | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [trigger, setTrigger] = useState<Trigger | null>(null);

  const save = () => {
    if (!mood || !intensity || !trigger) return;
    store.addCheckIn({ id: uid(), createdAt: new Date().toISOString(), mood, intensity, trigger });
    navigate({ to: "/coach", search: { fromCheckin: "1" } as never });
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Quick check-in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Three taps. No typing.</p>

      <Section title="1. How do you feel?">
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <Chip key={m.key} selected={mood === m.key} onClick={() => setMood(m.key)} label={`${m.emoji} ${m.label}`} ariaLabel={m.label} />
          ))}
        </div>
      </Section>

      <Section title="2. How intense? (1 low – 5 high)">
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip key={n} selected={intensity === n} onClick={() => setIntensity(n as 1|2|3|4|5)} label={String(n)} ariaLabel={`Intensity ${n}`} />
          ))}
        </div>
      </Section>

      <Section title="3. What triggered it?">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRIGGERS.map((t) => (
            <Chip key={t.key} selected={trigger === t.key} onClick={() => setTrigger(t.key)} label={t.label} ariaLabel={t.label} />
          ))}
        </div>
      </Section>

      <button
        onClick={save}
        disabled={!mood || !intensity || !trigger}
        className="mt-8 w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-soft disabled:opacity-40"
      >
        Save & Talk to AI
      </button>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Chip({ selected, onClick, label, ariaLabel }: { selected: boolean; onClick: () => void; label: string; ariaLabel: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-medium transition ${
        selected ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card hover:bg-accent/40"
      }`}
    >
      {label}
    </button>
  );
}
