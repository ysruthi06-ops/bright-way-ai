// AI provider abstraction. Uses OpenAI when VITE_OPENAI_API_KEY is set,
// otherwise falls back to a rich local mock so the app is always usable.
import type { CheckIn, OnboardingAnswers } from "../storage";
import { buildCoachPrompt, systemPrompts, type CoachContext } from "./prompts";

export type RiskLevel = "low" | "medium" | "high";
export interface RiskResult { level: RiskLevel; reason: string; action: string; }

const apiKey = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_OPENAI_API_KEY) || "";
export const aiMode: "openai" | "mock" = apiKey ? "openai" : "mock";

async function openaiChat(system: string, user: string): Promise<string> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return String(data.choices?.[0]?.message?.content ?? "").trim();
  } catch (e) {
    console.warn("OpenAI failed, falling back to mock:", e);
    return "";
  }
}

// ---------- Mock generators (intelligent, context-aware) ----------

const acknowledgements: Record<string, string> = {
  happy: "It's wonderful to hear you're feeling good today.",
  calm: "Calm is a beautiful place to be — you've earned it.",
  anxious: "Anxiety is heavy, and I hear you.",
  sad: "Sadness deserves gentleness. You reached out — that matters.",
  angry: "Anger makes sense sometimes. Let's give it somewhere safe to go.",
  craving: "A craving is a wave, not a command. You're not alone in it.",
};

const triggerActions: Record<string, string> = {
  stress: "Take three slow breaths — 4 seconds in, 6 seconds out.",
  work: "Step away from your screen for 5 minutes and stretch.",
  loneliness: "Send one short message to someone who cares about you.",
  friends: "It's okay to leave a situation that puts you at risk.",
  family: "Write down what you feel — you don't need to send it.",
  money: "One breath. One minute. Money worries wait for the morning.",
  other: "Sip cold water slowly and notice five things you can see.",
};

function mockCoach(ctx: CoachContext): string {
  const ack = acknowledgements[ctx.mood ?? ""] ?? "Thank you for checking in.";
  const action = triggerActions[ctx.trigger ?? ""] ?? "Take three deep breaths.";
  const motivator = ctx.onboarding?.motivator ? ` Remember ${ctx.onboarding.motivator}.` : "";
  const goal = ctx.onboarding?.goal ?? "your recovery";
  return `${ack} ${action}${motivator}\n\nYou've been showing up, and that is the work. One next step: return to ${goal} by doing one small kind thing for yourself in the next hour.\n\nI'm not a substitute for professional care — please reach out to your support network or a clinician if things escalate.`;
}

function mockRisk(mood: string, trigger: string, recent: CheckIn[]): RiskResult {
  const highMoods = new Set(["craving", "angry", "sad"]);
  const recentHighs = recent.slice(0, 5).filter((c) => highMoods.has(c.mood) && c.intensity >= 4).length;
  let score = 0;
  if (highMoods.has(mood)) score += 2;
  if (["loneliness", "friends", "money"].includes(trigger)) score += 1;
  score += recentHighs;
  const level: RiskLevel = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  const reasonMap: Record<RiskLevel, string> = {
    low: "Your recent check-ins look stable. Keep the routines that are working.",
    medium: `Your current ${mood} plus recent patterns suggest extra care today.`,
    high: `A ${mood} state with ${trigger} triggers and recent intense check-ins is a moment to be gentle and reach out.`,
  };
  const actionMap: Record<RiskLevel, string> = {
    low: "Try one grounding exercise and celebrate a small win.",
    medium: "Use the breathing exercise, then message your support person.",
    high: "Open your emergency plan now and consider calling your caregiver.",
  };
  return { level, reason: reasonMap[level], action: actionMap[level] };
}

function mockEmergencyScript(a: OnboardingAnswers): string {
  return `You chose recovery because ${a.reason || "you want a better life"}. When it gets hard, remember ${a.motivator || "the people who love you"} — they are still there. Your goal is ${a.goal || "to keep going, one day at a time"}, and every hour you stay steady is a step toward it.\n\nRight now: pause. Try ${a.calmingActivity || "slow breathing"}. If it doesn't lift within 10 minutes, reach out to ${a.emergencyContactName || "your support person"}${a.emergencyContactPhone ? ` at ${a.emergencyContactPhone}` : ""}.\n\nYou are not the craving. You are the person who noticed it and chose to pause.`;
}

function mockTimelineSummary(list: CheckIn[]): string {
  if (list.length === 0) return "No check-ins yet. Your first one is waiting.";
  const week = list.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 86400000);
  const counts: Record<string, number> = {};
  week.forEach((c) => (counts[c.trigger] = (counts[c.trigger] ?? 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
  const managed = week.filter((c) => c.mood === "craving").length;
  return `This week you checked in ${week.length} time${week.length === 1 ? "" : "s"}. Your most common trigger was ${top}. You noticed ${managed} craving${managed === 1 ? "" : "s"} — noticing is the first act of managing them. Keep going.`;
}

function mockCaregiverSummary(list: CheckIn[]): string {
  if (list.length === 0) return "No recent check-ins yet. A simple 'thinking of you' message could help start a rhythm.";
  const week = list.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 86400000);
  const avg = week.reduce((s, c) => s + c.intensity, 0) / (week.length || 1);
  const trend = avg > 3.5 ? "elevated" : avg > 2.5 ? "steady" : "calm";
  const counts: Record<string, number> = {};
  week.forEach((c) => (counts[c.trigger] = (counts[c.trigger] ?? 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "varied";
  return `Overall trend this week: ${trend}. Most common trigger: ${top}. Two supportive openers: "I noticed you've had a busy week — want to grab a walk?" and "No pressure to talk — I'm around if you need company." Keep presence low-key and consistent.`;
}

// ---------- Knowledge base (grounded RAG-lite) ----------
export const knowledgeBase = [
  { q: "Why do cravings happen?", a: "Cravings are the brain's learned response to cues — places, moods, or people paired with past substance use. They peak quickly and pass, usually within 15-30 minutes, especially when you don't act on them." },
  { q: "How long do cravings last?", a: "Most cravings peak within 3-5 minutes and fade within 20-30 minutes if you don't feed them. Riding out one craving makes the next one weaker." },
  { q: "What is relapse?", a: "Relapse is a return to substance use after a period of change. Many clinicians view it as a process (emotional → mental → physical) rather than a single event, which means it can be interrupted at any stage." },
  { q: "What is HALT?", a: "HALT stands for Hungry, Angry, Lonely, Tired — four common relapse triggers. Checking in on these needs first often removes the urge." },
  { q: "Is asking for help a weakness?", a: "No. Reaching out is one of the strongest predictors of long-term recovery. It expands the resources your brain can use in a difficult moment." },
];

function mockKnowledge(question: string): string {
  const q = question.toLowerCase();
  const hit = knowledgeBase.find((k) => q.includes(k.q.toLowerCase().split(" ")[1] ?? "") || k.q.toLowerCase().includes(q.slice(0, 6)));
  if (hit) return hit.a;
  return "I don't have that information in my resources — please speak with a clinician or counselor. In the meantime, our breathing and grounding exercises are always available.";
}

// ---------- Public API ----------

export const aiService = {
  mode: aiMode,

  async coach(ctx: CoachContext): Promise<string> {
    if (aiMode === "openai") {
      const out = await openaiChat(systemPrompts.coach, buildCoachPrompt(ctx));
      if (out) return out;
    }
    return mockCoach(ctx);
  },

  async risk(mood: string, trigger: string, recent: CheckIn[]): Promise<RiskResult> {
    // Risk is deterministic-safe locally; skip network for latency + reliability.
    return mockRisk(mood, trigger, recent);
  },

  async emergencyScript(a: OnboardingAnswers): Promise<string> {
    if (aiMode === "openai") {
      const out = await openaiChat(systemPrompts.emergencyScript, JSON.stringify(a));
      if (out) return out;
    }
    return mockEmergencyScript(a);
  },

  async timelineSummary(list: CheckIn[]): Promise<string> {
    if (aiMode === "openai" && list.length > 0) {
      const out = await openaiChat(systemPrompts.timelineSummary, JSON.stringify(list.slice(0, 20)));
      if (out) return out;
    }
    return mockTimelineSummary(list);
  },

  async caregiverSummary(list: CheckIn[]): Promise<string> {
    if (aiMode === "openai" && list.length > 0) {
      const out = await openaiChat(systemPrompts.caregiverSummary, JSON.stringify(list.slice(0, 20)));
      if (out) return out;
    }
    return mockCaregiverSummary(list);
  },

  async knowledge(question: string): Promise<string> {
    if (aiMode === "openai") {
      const context = knowledgeBase.map((k) => `Q: ${k.q}\nA: ${k.a}`).join("\n\n");
      const out = await openaiChat(systemPrompts.knowledge, `Resources:\n${context}\n\nUser question: ${question}`);
      if (out) return out;
    }
    return mockKnowledge(question);
  },
};
