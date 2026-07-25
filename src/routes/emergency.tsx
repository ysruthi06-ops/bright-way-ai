import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MessageSquare, Volume2, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BreathingCircle } from "@/components/BreathingCircle";
import { useAppData } from "@/hooks/useAppData";
import { aiService } from "@/lib/ai/aiService";
import { speech } from "@/lib/voice";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [
    { title: "Emergency — RecoveryOS AI" },
    { name: "description", content: "Your personalized emergency script, breathing, grounding, and one-tap caregiver contact." },
    { property: "og:title", content: "Emergency — RecoveryOS AI" },
    { property: "og:description", content: "Panic mode with grounding and contacts." },
  ]}),
  component: EmergencyPage,
});

const GROUNDING = [
  { n: 5, sense: "things you can SEE" },
  { n: 4, sense: "things you can TOUCH" },
  { n: 3, sense: "things you can HEAR" },
  { n: 2, sense: "things you can SMELL" },
  { n: 1, sense: "thing you can TASTE" },
];

function EmergencyPage() {
  const { emergency, onboarding } = useAppData();
  const [script, setScript] = useState(emergency?.script ?? "");

  useEffect(() => {
    if (!emergency && onboarding) {
      aiService.emergencyScript(onboarding).then((s) => {
        setScript(s);
        store.setEmergencyPlan({ script: s, updatedAt: new Date().toISOString() });
      });
    } else if (emergency) {
      setScript(emergency.script);
    }
    return () => speech.stop();
  }, [emergency, onboarding]);

  const phone = onboarding?.emergencyContactPhone?.replace(/\s/g, "");
  const name = onboarding?.emergencyContactName || "your contact";

  return (
    <AppShell>
      <div className="rounded-3xl bg-destructive/10 p-6">
        <h1 className="text-2xl font-bold text-destructive">You're safe here.</h1>
        <p className="mt-1 text-sm text-foreground/80">Read the script. Breathe. Ground. Reach out.</p>
      </div>

      <section className="mt-4 rounded-2xl border bg-card p-5 shadow-soft" aria-labelledby="script-h">
        <h2 id="script-h" className="text-lg font-semibold">Your emergency script</h2>
        <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">
          {script || "Preparing your script…"}
        </p>
        {script && (
          <div className="mt-3 flex gap-2">
            <button onClick={() => speech.speak(script)} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm">
              <Volume2 className="h-4 w-4" /> Read aloud
            </button>
            <button onClick={() => speech.stop()} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm">
              <Square className="h-4 w-4" /> Stop
            </button>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold">Breathe</h2>
        <div className="mt-4"><BreathingCircle /></div>
        <Link to="/breathing" className="mt-3 inline-block text-sm font-medium text-primary underline">Open full breathing exercise →</Link>
      </section>

      <section className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold">Grounding: 5-4-3-2-1</h2>
        <ol className="mt-3 space-y-2">
          {GROUNDING.map((g) => (
            <li key={g.n} className="flex items-center gap-3 rounded-xl bg-calm/40 px-3 py-2 text-calm-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-calm text-lg font-bold">{g.n}</span>
              <span className="text-sm font-medium">Name {g.n} {g.sense}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={phone ? `tel:${phone}` : "#"}
          onClick={(e) => { if (!phone) e.preventDefault(); }}
          className="flex min-h-16 items-center gap-3 rounded-2xl bg-destructive p-4 text-lg font-semibold text-destructive-foreground shadow-soft"
        >
          <Phone className="h-6 w-6" /> Call {name}
        </a>
        <a
          href={phone ? `sms:${phone}?body=${encodeURIComponent("I need support right now.")}` : "#"}
          onClick={(e) => { if (!phone) e.preventDefault(); }}
          className="flex min-h-16 items-center gap-3 rounded-2xl bg-primary p-4 text-lg font-semibold text-primary-foreground shadow-soft"
        >
          <MessageSquare className="h-6 w-6" /> Message {name}
        </a>
        {!phone && (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Add your emergency contact in <Link to="/onboarding" className="underline">setup</Link> to enable one-tap call & message.
          </p>
        )}
      </section>
    </AppShell>
  );
}
