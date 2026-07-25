import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { store } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — RecoveryOS AI" },
    { name: "description", content: "Dark mode, high contrast, text size, and voice preferences." },
    { property: "og:title", content: "Settings — RecoveryOS AI" },
    { property: "og:description", content: "Accessibility and preferences." },
  ]}),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, update } = useSettings();
  const navigate = useNavigate();

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="mt-6 space-y-3">
        <Row label="Dark mode" checked={settings.darkMode} onChange={(v) => update({ darkMode: v })} />
        <Row label="High contrast" checked={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
        <Row label="Voice input & read-aloud" checked={settings.voiceEnabled} onChange={(v) => update({ voiceEnabled: v })} />
        <Row label="Notifications" checked={settings.notifications} onChange={(v) => update({ notifications: v })} />

        <div className="rounded-2xl border bg-card p-4">
          <p className="text-sm font-medium">Text size</p>
          <div className="mt-3 flex gap-2">
            {(["base", "lg", "xl"] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ textSize: s })}
                aria-pressed={settings.textSize === s}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
                  settings.textSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {s === "base" ? "Normal" : s === "lg" ? "Large" : "Extra"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <button
          onClick={() => navigate({ to: "/onboarding" })}
          className="w-full rounded-2xl border bg-card p-4 text-left text-sm font-medium"
        >
          Re-run onboarding & regenerate emergency script
        </button>
        <button
          onClick={() => { if (confirm("Delete all local data?")) { store.clearAll(); location.href = "/"; } }}
          className="w-full rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left text-sm font-medium text-destructive"
        >
          Reset all data
        </button>
      </section>
    </AppShell>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border bg-card p-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
