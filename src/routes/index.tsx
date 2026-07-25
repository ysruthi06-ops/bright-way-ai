import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, HeartHandshake, MessageCircle, Calendar, BookOpen, Users, Smile, Frown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/hooks/useAppData";
import { aiService, type RiskResult } from "@/lib/ai/aiService";
import { daysSince, store, uid } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecoveryOS AI — Your AI Recovery Companion" },
      { name: "description", content: "AI-powered check-ins, emergency support, and caregiver tools for people navigating substance use recovery." },
      { property: "og:title", content: "RecoveryOS AI — Your AI Recovery Companion" },
      { property: "og:description", content: "AI-powered check-ins, emergency support, and caregiver tools for recovery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const { profile, checkIns, ready, refresh } = useAppData();
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const streakStart = typeof window !== "undefined" ? store.getStreakStart() : null;
  const streak = daysSince(streakStart) + (streakStart ? 1 : 0);

  useEffect(() => {
    if (!ready) return;
    if (!streakStart) store.setStreakStart(new Date().toISOString());
    if (!profile) {
      store.setProfile({
        id: uid(),
        name: "Friend",
        email: "",
        role: "user",
        createdAt: new Date().toISOString(),
        onboarded: false,
      });
      navigate({ to: "/onboarding" });
    }
    const last = checkIns[0];
    if (last) aiService.risk(last.mood, last.trigger, checkIns).then(setRisk);
  }, [ready, profile, checkIns, navigate, streakStart]);

  const latestMood = checkIns[0]?.mood ?? "—";
  const quickFeel = async (mood: "calm" | "craving") => {
    store.addCheckIn({
      id: uid(),
      createdAt: new Date().toISOString(),
      mood,
      intensity: mood === "craving" ? 4 : 2,
      trigger: "other",
    });
    refresh();
  };

  const riskColor = useMemo(() => {
    if (!risk) return "bg-muted";
    return risk.level === "high" ? "bg-destructive/15 text-destructive" : risk.level === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-success/15 text-success-foreground";
  }, [risk]);

  return (
    <AppShell>
      <header className="rounded-3xl bg-gradient-hero p-6 shadow-soft">
        <p className="text-sm font-medium text-foreground/70">{greeting()}, {profile?.name ?? "Friend"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">You showed up today.</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Stat label="Recovery streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
          <Stat label="Today's mood" value={latestMood} />
          <Stat label="Check-ins" value={String(checkIns.length)} />
        </div>
      </header>

      {risk && (
        <section className={`mt-4 rounded-2xl p-4 ${riskColor}`} role="status">
          <p className="text-sm font-semibold uppercase tracking-wide">Risk: {risk.level}</p>
          <p className="mt-1 text-sm">{risk.reason}</p>
          <p className="mt-1 text-sm font-medium">→ {risk.action}</p>
        </section>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3">
        <ActionCard onClick={() => quickFeel("calm")} icon={<Smile />} label="I feel okay" tone="success" />
        <ActionCard onClick={() => quickFeel("craving")} icon={<Frown />} label="I'm struggling" tone="warning" />
        <ActionCard to="/emergency" icon={<AlertCircle />} label="Emergency" tone="destructive" wide />
        <ActionCard to="/coach" icon={<MessageCircle />} label="Talk to AI" tone="primary" />
        <ActionCard to="/checkin" icon={<HeartHandshake />} label="Full check-in" tone="calm" />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TileLink to="/timeline" icon={<Calendar />} label="Timeline" />
        <TileLink to="/resources" icon={<BookOpen />} label="Resources" />
        <TileLink to="/caregiver" icon={<Users />} label="Caregiver" />
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/70 px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}

function ActionCard({ icon, label, to, onClick, tone, wide }: {
  icon: React.ReactNode; label: string; to?: string; onClick?: () => void;
  tone: "success" | "warning" | "destructive" | "primary" | "calm"; wide?: boolean;
}) {
  const tones = {
    success: "bg-success/15 text-success-foreground hover:bg-success/25",
    warning: "bg-warning/20 text-warning-foreground hover:bg-warning/30",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    calm: "bg-calm text-calm-foreground hover:bg-calm/80",
  };
  const cls = `flex min-h-24 items-center gap-3 rounded-2xl p-4 text-left text-base font-semibold shadow-soft transition ${tones[tone]} ${wide ? "col-span-2" : ""}`;
  if (to) return <Link to={to} className={cls}><span className="[&_svg]:h-6 [&_svg]:w-6" aria-hidden>{icon}</span>{label}</Link>;
  return <button onClick={onClick} className={cls}><span className="[&_svg]:h-6 [&_svg]:w-6" aria-hidden>{icon}</span>{label}</button>;
}

function TileLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-semibold text-foreground shadow-soft transition hover:bg-accent/40">
      <span className="rounded-full bg-primary/10 p-2 text-primary [&_svg]:h-5 [&_svg]:w-5" aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}
