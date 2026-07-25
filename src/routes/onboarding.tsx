import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { aiService } from "@/lib/ai/aiService";
import { store, type OnboardingAnswers } from "@/lib/storage";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Welcome — RecoveryOS AI" },
    { name: "description", content: "Set up your personal recovery plan in under a minute." },
    { property: "og:title", content: "Welcome — RecoveryOS AI" },
    { property: "og:description", content: "Set up your personal recovery plan." },
  ]}),
  component: Onboarding,
});

const STEPS: { key: keyof OnboardingAnswers; question: string; placeholder: string }[] = [
  { key: "reason", question: "Why are you choosing recovery?", placeholder: "I want to be present for my family…" },
  { key: "motivator", question: "Who or what motivates you?", placeholder: "My daughter, my future self…" },
  { key: "goal", question: "What's your biggest goal?", placeholder: "30 days sober, better sleep…" },
  { key: "calmingActivity", question: "What calms you down?", placeholder: "Walking, tea, music…" },
  { key: "emergencyContactName", question: "Who should we contact in an emergency?", placeholder: "Name" },
  { key: "emergencyContactPhone", question: "Their phone number?", placeholder: "+1 555 123 4567" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    reason: "", motivator: "", goal: "", calmingActivity: "",
    emergencyContactName: "", emergencyContactPhone: "",
  });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length;

  const next = async () => {
    if (isLast) {
      setBusy(true);
      const profile = store.getProfile();
      if (profile) store.setProfile({ ...profile, name: name || "Friend", onboarded: true });
      store.setOnboarding(answers);
      const script = await aiService.emergencyScript(answers);
      store.setEmergencyPlan({ script, updatedAt: new Date().toISOString() });
      navigate({ to: "/" });
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <AppShell>
      <div className="rounded-3xl bg-gradient-hero p-6 shadow-soft">
        <p className="text-sm font-medium text-foreground/70">Setup · {Math.min(step + 1, STEPS.length + 1)} / {STEPS.length + 1}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Let's personalize your plan</h1>
        <p className="mt-1 text-sm text-foreground/70">Takes under a minute. You can change anything later.</p>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-soft">
        {isFirst && (
          <label className="block">
            <span className="text-sm font-medium">What should we call you?</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-base"
            />
          </label>
        )}
        {!isLast && !isFirst && (
          <label className="block">
            <span className="text-sm font-medium">{current.question}</span>
            <textarea
              autoFocus
              value={answers[current.key]}
              onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
              placeholder={current.placeholder}
              rows={3}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-base"
            />
          </label>
        )}
        {isFirst && (
          <label className="mt-4 block">
            <span className="text-sm font-medium">{STEPS[0].question}</span>
            <textarea
              value={answers.reason}
              onChange={(e) => setAnswers({ ...answers, reason: e.target.value })}
              placeholder={STEPS[0].placeholder}
              rows={3}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-base"
            />
          </label>
        )}
        {isLast && (
          <div>
            <h2 className="text-lg font-semibold">All set, {name || "Friend"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll generate a personalized emergency script from your answers. You'll see it whenever you press Emergency.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={next}
            disabled={busy}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {isLast ? (busy ? "Creating…" : "Finish") : "Continue"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
