import { describe, it, expect } from "vitest";
import { aiService, knowledgeBase, type RiskLevel } from "@/lib/ai/aiService";
import { type CheckIn } from "@/lib/storage";

const baseCheckIn: CheckIn = {
  id: "c1",
  createdAt: new Date().toISOString(),
  mood: "calm",
  intensity: 2,
  trigger: "stress",
};

const baseOnboarding = {
  reason: "for my family",
  motivator: "my daughter",
  goal: "30 days sober",
  calmingActivity: "walking",
  emergencyContactName: "Jane",
  emergencyContactPhone: "+15551234567",
};

describe("aiService.mode", () => {
  it("has valid mode ('mock' or 'openai')", () => {
    expect(["mock", "openai"]).toContain(aiService.mode);
  });
});

describe("aiService.coach", () => {
  it("returns a non-empty string", async () => {
    const result = await aiService.coach({
      mood: "calm",
      trigger: "stress",
      recentCheckIns: [baseCheckIn],
      onboarding: baseOnboarding,
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes acknowledgement for each mood", async () => {
    const moods = ["happy", "calm", "anxious", "sad", "angry", "craving"] as const;
    for (const mood of moods) {
      const result = await aiService.coach({
        mood,
        trigger: "other",
        recentCheckIns: [],
        onboarding: null,
      });
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("handles missing mood and trigger gracefully", async () => {
    const result = await aiService.coach({
      mood: undefined,
      trigger: undefined,
      recentCheckIns: [],
      onboarding: null,
    });
    expect(typeof result).toBe("string");
  });

  it("includes motivator from onboarding if provided", async () => {
    const result = await aiService.coach({
      mood: "calm",
      trigger: "stress",
      recentCheckIns: [],
      onboarding: { ...baseOnboarding, motivator: "my daughter" },
    });
    expect(result).toContain("my daughter");
  });
});

describe("aiService.risk", () => {
  it("returns low risk for stable moods", async () => {
    const result = await aiService.risk("calm", "work", [baseCheckIn]);
    expect(result.level).toBe("low");
    expect(result.reason).toBeTruthy();
    expect(result.action).toBeTruthy();
  });

  it("returns medium risk for craving with neutral trigger", async () => {
    const result = await aiService.risk("craving", "work", []);
    expect(["medium", "high"]).toContain(result.level);
  });

  it("returns high risk for craving + loneliness + multiple intense check-ins", async () => {
    const intense: CheckIn[] = Array.from({ length: 5 }, (_, i) => ({
      id: `c${i}`,
      createdAt: new Date().toISOString(),
      mood: "craving",
      intensity: 5,
      trigger: "loneliness",
    }));
    const result = await aiService.risk("craving", "loneliness", intense);
    expect(result.level).toBe("high");
  });

  it("risk result has correct shape", async () => {
    const result = await aiService.risk("happy", "friends", []);
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("reason");
    expect(result).toHaveProperty("action");
    expect(["low", "medium", "high"]).toContain(result.level as RiskLevel);
  });

  it("considers high-intensity recent check-ins in scoring", async () => {
    const highIntensity: CheckIn[] = [
      { id: "c1", createdAt: new Date().toISOString(), mood: "craving", intensity: 5, trigger: "loneliness" },
      { id: "c2", createdAt: new Date().toISOString(), mood: "angry", intensity: 4, trigger: "money" },
      { id: "c3", createdAt: new Date().toISOString(), mood: "sad", intensity: 4, trigger: "friends" },
    ];
    const result = await aiService.risk("craving", "money", highIntensity);
    expect(result.level).toBe("high");
  });
});

describe("aiService.emergencyScript", () => {
  it("returns a non-empty string", async () => {
    const result = await aiService.emergencyScript(baseOnboarding);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the user's reason", async () => {
    const result = await aiService.emergencyScript({ ...baseOnboarding, reason: "for my future" });
    expect(result).toContain("for my future");
  });

  it("includes calming activity", async () => {
    const result = await aiService.emergencyScript({ ...baseOnboarding, calmingActivity: "deep breathing" });
    expect(result).toContain("deep breathing");
  });

  it("includes emergency contact name and phone", async () => {
    const result = await aiService.emergencyScript({ ...baseOnboarding, emergencyContactName: "Bob", emergencyContactPhone: "+19995551234" });
    expect(result).toContain("Bob");
    expect(result).toContain("+19995551234");
  });

  it("handles empty onboarding gracefully with fallback text", async () => {
    const result = await aiService.emergencyScript({
      reason: "", motivator: "", goal: "", calmingActivity: "",
      emergencyContactName: "", emergencyContactPhone: "",
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("aiService.timelineSummary", () => {
  it("returns empty-state message for no check-ins", async () => {
    const result = await aiService.timelineSummary([]);
    expect(result).toContain("No check-ins");
  });

  it("returns a summary string when check-ins exist", async () => {
    const checkIns: CheckIn[] = [
      { id: "c1", createdAt: new Date().toISOString(), mood: "craving", intensity: 4, trigger: "stress" },
      { id: "c2", createdAt: new Date().toISOString(), mood: "calm", intensity: 2, trigger: "work" },
    ];
    const result = await aiService.timelineSummary(checkIns);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("counts cravings in summary", async () => {
    const checkIns: CheckIn[] = [
      { id: "c1", createdAt: new Date().toISOString(), mood: "craving", intensity: 3, trigger: "stress" },
    ];
    const result = await aiService.timelineSummary(checkIns);
    expect(result).toMatch(/craving/i);
  });
});

describe("aiService.caregiverSummary", () => {
  it("returns empty-state message for no check-ins", async () => {
    const result = await aiService.caregiverSummary([]);
    expect(result).toContain("No recent check-ins");
  });

  it("returns a summary for recent check-ins", async () => {
    const checkIns: CheckIn[] = [
      { id: "c1", createdAt: new Date().toISOString(), mood: "calm", intensity: 2, trigger: "stress" },
    ];
    const result = await aiService.caregiverSummary(checkIns);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("reflects elevated trend for high intensity check-ins", async () => {
    const elevated: CheckIn[] = Array.from({ length: 3 }, (_, i) => ({
      id: `c${i}`,
      createdAt: new Date().toISOString(),
      mood: "craving",
      intensity: 5,
      trigger: "stress",
    }));
    const result = await aiService.caregiverSummary(elevated);
    expect(result).toMatch(/elevated/i);
  });
});

describe("aiService.knowledge", () => {
  it("returns an answer for known questions", async () => {
    const result = await aiService.knowledge("Why do cravings happen?");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("I don't have that information");
  });

  it("returns fallback for unknown questions", async () => {
    const result = await aiService.knowledge("xyzzy nonsense question 12345");
    expect(result).toContain("clinician");
  });
});

describe("knowledgeBase", () => {
  it("has at least 5 entries", () => {
    expect(knowledgeBase.length).toBeGreaterThanOrEqual(5);
  });

  it("each entry has q and a strings", () => {
    knowledgeBase.forEach((k) => {
      expect(typeof k.q).toBe("string");
      expect(typeof k.a).toBe("string");
      expect(k.q.length).toBeGreaterThan(0);
      expect(k.a.length).toBeGreaterThan(0);
    });
  });
});
