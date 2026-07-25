// LocalStorage-backed data layer for the hackathon MVP.
// Everything works offline; swap this module for Supabase later without touching UI.

export type Mood = "happy" | "calm" | "anxious" | "sad" | "angry" | "craving";
export type Trigger = "stress" | "work" | "loneliness" | "friends" | "family" | "money" | "other";
export type Role = "user" | "caregiver";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  onboarded: boolean;
}

export interface OnboardingAnswers {
  reason: string;
  motivator: string;
  goal: string;
  calmingActivity: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface CheckIn {
  id: string;
  createdAt: string;
  mood: Mood;
  intensity: 1 | 2 | 3 | 4 | 5;
  trigger: Trigger;
  note?: string;
}

export interface EmergencyPlan {
  script: string;
  updatedAt: string;
}

export interface Settings {
  darkMode: boolean;
  highContrast: boolean;
  textSize: "base" | "lg" | "xl";
  voiceEnabled: boolean;
  notifications: boolean;
}

const KEYS = {
  profile: "ros.profile",
  onboarding: "ros.onboarding",
  checkins: "ros.checkins",
  emergency: "ros.emergency",
  settings: "ros.settings",
  streakStart: "ros.streakStart",
} as const;

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const defaultSettings: Settings = {
  darkMode: false,
  highContrast: false,
  textSize: "base",
  voiceEnabled: true,
  notifications: false,
};

export const store = {
  getProfile: () => read<Profile | null>(KEYS.profile, null),
  setProfile: (p: Profile | null) => write(KEYS.profile, p),

  getOnboarding: () => read<OnboardingAnswers | null>(KEYS.onboarding, null),
  setOnboarding: (o: OnboardingAnswers) => write(KEYS.onboarding, o),

  getCheckIns: () => read<CheckIn[]>(KEYS.checkins, []),
  addCheckIn: (c: CheckIn) => {
    const list = read<CheckIn[]>(KEYS.checkins, []);
    list.unshift(c);
    write(KEYS.checkins, list.slice(0, 500));
  },

  getEmergencyPlan: () => read<EmergencyPlan | null>(KEYS.emergency, null),
  setEmergencyPlan: (p: EmergencyPlan) => write(KEYS.emergency, p),

  getSettings: () => read<Settings>(KEYS.settings, defaultSettings),
  setSettings: (s: Settings) => write(KEYS.settings, s),

  getStreakStart: () => read<string | null>(KEYS.streakStart, null),
  setStreakStart: (d: string) => write(KEYS.streakStart, d),

  clearAll: () => {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};

export function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
