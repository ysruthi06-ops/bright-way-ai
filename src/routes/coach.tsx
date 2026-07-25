import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, Volume2, Square, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/hooks/useAppData";
import { aiService } from "@/lib/ai/aiService";
import { createRecognizer, isSpeechRecognitionSupported, isSpeechSynthesisSupported, speech } from "@/lib/voice";

export const Route = createFileRoute("/coach")({
  head: () => ({ meta: [
    { title: "AI Recovery Coach — RecoveryOS AI" },
    { name: "description", content: "Speak or type — get an empathetic, personalized response grounded in your recovery plan." },
    { property: "og:title", content: "AI Recovery Coach — RecoveryOS AI" },
    { property: "og:description", content: "Voice-first AI recovery coach." },
  ]}),
  component: CoachPage,
});

interface Msg { role: "user" | "ai"; text: string; }

function CoachPage() {
  const { checkIns, onboarding, emergency } = useAppData();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const voiceSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    if (messages.length === 0) {
      const last = checkIns[0];
      aiService.coach({
        mood: last?.mood, trigger: last?.trigger,
        recentCheckIns: checkIns, onboarding, emergencyScript: emergency?.script,
      }).then((text) => setMessages([{ role: "ai", text }]));
    }
    return () => speech.stop();
  }, [checkIns, onboarding, emergency, messages.length]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    const last = checkIns[0];
    const reply = await aiService.coach({
      mood: last?.mood, trigger: last?.trigger,
      recentCheckIns: checkIns, onboarding, emergencyScript: emergency?.script,
    });
    setMessages((m) => [...m, { role: "ai", text: reply }]);
    if (ttsSupported) speech.speak(reply);
    setBusy(false);
  };

  const toggleMic = () => {
    if (!voiceSupported) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    let final = "";
    const rec = createRecognizer({
      onResult: (t, isFinal) => { setInput(t); if (isFinal) final = t; },
      onEnd: () => { setListening(false); if (final) send(final); },
      onError: () => setListening(false),
    });
    if (!rec) return;
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Recovery Coach</h1>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {aiService.mode === "openai" ? "OpenAI" : "Local mode"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Not a substitute for professional care.</p>

      <div className="mt-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-2xl p-4 shadow-sm ${m.role === "user" ? "bg-primary/10 ml-8" : "bg-card mr-8 border"}`}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
            {m.role === "ai" && ttsSupported && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => speech.speak(m.text)} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs" aria-label="Read aloud">
                  <Volume2 className="h-3 w-3" /> Read aloud
                </button>
                <button onClick={() => speech.stop()} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs" aria-label="Stop speaking">
                  <Square className="h-3 w-3" /> Stop
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="rounded-2xl bg-card border p-4 mr-8 text-sm text-muted-foreground animate-pulse">Thinking…</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-6 flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-soft"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Type or press the mic"}
          rows={2}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          aria-label="Message"
        />
        <button
          type="button"
          onClick={toggleMic}
          disabled={!voiceSupported}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          className={`grid h-11 w-11 place-items-center rounded-full ${listening ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"} disabled:opacity-40`}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button type="submit" aria-label="Send" className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
          <Send className="h-5 w-5" />
        </button>
      </form>
      {!voiceSupported && (
        <p className="mt-2 text-xs text-muted-foreground">Voice input isn't supported in this browser — typing works fine.</p>
      )}
    </AppShell>
  );
}
