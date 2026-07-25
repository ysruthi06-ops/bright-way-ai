import { describe, it, expect } from "vitest";
import { buildCoachPrompt, systemPrompts } from "@/lib/ai/prompts";
import type { CheckIn } from "@/lib/storage";

const checkIn: CheckIn = {
  id: "c1",
  createdAt: "2024-01-15T10:00:00.000Z",
  mood: "calm",
  intensity: 2,
  trigger: "stress",
};

const onboarding = {
  reason: "for my family",
  motivator: "my kids",
  goal: "30 days sober",
  calmingActivity: "walking",
  emergencyContactName: "Jane",
  emergencyContactPhone: "+15551234567",
};

describe("buildCoachPrompt", () => {
  it("includes current mood in output", () => {
    const out = buildCoachPrompt({ mood: "anxious", trigger: "work", recentCheckIns: [], onboarding: null });
    expect(out).toContain("anxious");
  });

  it("includes current trigger in output", () => {
    const out = buildCoachPrompt({ mood: "calm", trigger: "loneliness", recentCheckIns: [], onboarding: null });
    expect(out).toContain("loneliness");
  });

  it("lists recent check-ins", () => {
    const out = buildCoachPrompt({ mood: "sad", trigger: "family", recentCheckIns: [checkIn], onboarding: null });
    expect(out).toContain("calm");
    expect(out).toContain("2/5");
    expect(out).toContain("stress");
  });

  it("limits recent check-ins to 5", () => {
    const many: CheckIn[] = Array.from({ length: 10 }, (_, i) => ({
      ...checkIn,
      id: `c${i}`,
      mood: "happy",
    }));
    const out = buildCoachPrompt({ mood: "happy", trigger: "work", recentCheckIns: many, onboarding: null });
    // Should only show 5 check-ins
    const matches = (out.match(/- happy/g) || []).length;
    expect(matches).toBeLessThanOrEqual(5);
  });

  it("shows 'none yet' when no recent check-ins", () => {
    const out = buildCoachPrompt({ mood: "calm", trigger: "stress", recentCheckIns: [], onboarding: null });
    expect(out).toContain("none yet");
  });

  it("includes goal from onboarding", () => {
    const out = buildCoachPrompt({ mood: "calm", trigger: "work", recentCheckIns: [], onboarding });
    expect(out).toContain("30 days sober");
  });

  it("includes motivator from onboarding", () => {
    const out = buildCoachPrompt({ mood: "calm", trigger: "work", recentCheckIns: [], onboarding });
    expect(out).toContain("my kids");
  });

  it("uses 'not set' for goal when onboarding is null", () => {
    const out = buildCoachPrompt({ mood: "calm", trigger: "work", recentCheckIns: [], onboarding: null });
    expect(out).toContain("not set");
  });

  it("includes emergency script when provided", () => {
    const out = buildCoachPrompt({
      mood: "calm", trigger: "work", recentCheckIns: [],
      onboarding: null, emergencyScript: "Stay strong.",
    });
    expect(out).toContain("Stay strong.");
  });

  it("uses 'unknown' for missing mood/trigger", () => {
    const out = buildCoachPrompt({ recentCheckIns: [], onboarding: null });
    expect(out).toContain("unknown");
  });
});

describe("systemPrompts", () => {
  it("has a coach prompt", () => {
    expect(typeof systemPrompts.coach).toBe("string");
    expect(systemPrompts.coach.length).toBeGreaterThan(0);
  });

  it("has a risk prompt", () => {
    expect(typeof systemPrompts.risk).toBe("string");
    expect(systemPrompts.risk).toContain("JSON");
  });

  it("has an emergencyScript prompt", () => {
    expect(typeof systemPrompts.emergencyScript).toBe("string");
  });

  it("has a timelineSummary prompt", () => {
    expect(typeof systemPrompts.timelineSummary).toBe("string");
  });

  it("has a caregiverSummary prompt", () => {
    expect(typeof systemPrompts.caregiverSummary).toBe("string");
  });

  it("has a knowledge prompt", () => {
    expect(typeof systemPrompts.knowledge).toBe("string");
  });
});
