import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  store,
  daysSince,
  uid,
  defaultSettings,
  type Profile,
  type CheckIn,
  type OnboardingAnswers,
  type EmergencyPlan,
  type Settings,
} from "@/lib/storage";

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "test-id",
  name: "Test User",
  email: "test@example.com",
  role: "user",
  createdAt: new Date().toISOString(),
  onboarded: false,
  ...overrides,
});

const makeCheckIn = (overrides: Partial<CheckIn> = {}): CheckIn => ({
  id: uid(),
  createdAt: new Date().toISOString(),
  mood: "calm",
  intensity: 2,
  trigger: "stress",
  ...overrides,
});

const makeOnboarding = (overrides: Partial<OnboardingAnswers> = {}): OnboardingAnswers => ({
  reason: "for my family",
  motivator: "my kids",
  goal: "30 days sober",
  calmingActivity: "walking",
  emergencyContactName: "Jane",
  emergencyContactPhone: "+15551234567",
  ...overrides,
});

describe("store", () => {
  beforeEach(() => {
    store.clearAll();
  });

  describe("profile", () => {
    it("returns null when no profile is stored", () => {
      expect(store.getProfile()).toBeNull();
    });

    it("stores and retrieves a profile", () => {
      const p = makeProfile();
      store.setProfile(p);
      expect(store.getProfile()).toEqual(p);
    });

    it("stores null profile", () => {
      store.setProfile(makeProfile());
      store.setProfile(null);
      expect(store.getProfile()).toBeNull();
    });
  });

  describe("onboarding", () => {
    it("returns null when no onboarding data", () => {
      expect(store.getOnboarding()).toBeNull();
    });

    it("stores and retrieves onboarding answers", () => {
      const o = makeOnboarding();
      store.setOnboarding(o);
      expect(store.getOnboarding()).toEqual(o);
    });
  });

  describe("checkIns", () => {
    it("returns empty array initially", () => {
      expect(store.getCheckIns()).toEqual([]);
    });

    it("adds a check-in prepended to list", () => {
      const c1 = makeCheckIn({ id: "c1" });
      const c2 = makeCheckIn({ id: "c2" });
      store.addCheckIn(c1);
      store.addCheckIn(c2);
      const all = store.getCheckIns();
      expect(all[0].id).toBe("c2"); // most recent first
      expect(all[1].id).toBe("c1");
    });

    it("limits storage to 500 check-ins", () => {
      for (let i = 0; i < 510; i++) {
        store.addCheckIn(makeCheckIn({ id: `c${i}` }));
      }
      expect(store.getCheckIns()).toHaveLength(500);
    });
  });

  describe("emergency plan", () => {
    it("returns null initially", () => {
      expect(store.getEmergencyPlan()).toBeNull();
    });

    it("stores and retrieves emergency plan", () => {
      const plan: EmergencyPlan = { script: "Stay strong.", updatedAt: new Date().toISOString() };
      store.setEmergencyPlan(plan);
      expect(store.getEmergencyPlan()).toEqual(plan);
    });
  });

  describe("settings", () => {
    it("returns defaultSettings initially", () => {
      expect(store.getSettings()).toEqual(defaultSettings);
    });

    it("stores and retrieves settings", () => {
      const s: Settings = { ...defaultSettings, darkMode: true, textSize: "lg" };
      store.setSettings(s);
      expect(store.getSettings()).toEqual(s);
    });
  });

  describe("streak start", () => {
    it("returns null initially", () => {
      expect(store.getStreakStart()).toBeNull();
    });

    it("stores and retrieves streak start date", () => {
      const iso = "2024-01-01T00:00:00.000Z";
      store.setStreakStart(iso);
      expect(store.getStreakStart()).toBe(iso);
    });
  });

  describe("clearAll", () => {
    it("removes all keys from localStorage", () => {
      store.setProfile(makeProfile());
      store.setOnboarding(makeOnboarding());
      store.addCheckIn(makeCheckIn());
      store.clearAll();
      expect(store.getProfile()).toBeNull();
      expect(store.getOnboarding()).toBeNull();
      expect(store.getCheckIns()).toEqual([]);
    });
  });
});

describe("daysSince", () => {
  it("returns 0 for null input", () => {
    expect(daysSince(null)).toBe(0);
  });

  it("returns 0 for today's date", () => {
    const today = new Date().toISOString();
    expect(daysSince(today)).toBe(0);
  });

  it("returns 1 for a date 25 hours ago", () => {
    const past = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(daysSince(past)).toBe(1);
  });

  it("returns 7 for a date 7 days ago", () => {
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(past)).toBe(7);
  });

  it("never returns negative", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(daysSince(future)).toBeGreaterThanOrEqual(0);
  });
});

describe("uid", () => {
  it("returns a non-empty string", () => {
    expect(typeof uid()).toBe("string");
    expect(uid().length).toBeGreaterThan(0);
  });

  it("generates unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

describe("defaultSettings", () => {
  it("has expected default values", () => {
    expect(defaultSettings.darkMode).toBe(false);
    expect(defaultSettings.highContrast).toBe(false);
    expect(defaultSettings.textSize).toBe("base");
    expect(defaultSettings.voiceEnabled).toBe(true);
    expect(defaultSettings.notifications).toBe(false);
  });
});
