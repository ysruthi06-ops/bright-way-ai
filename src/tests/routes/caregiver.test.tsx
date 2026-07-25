import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { CheckIn } from "@/lib/storage";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/caregiver" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const mockCaregiverSummary = vi.fn(() => Promise.resolve("Trend is calm. Keep presence consistent."));
vi.mock("@/lib/ai/aiService", () => ({
  aiService: { mode: "mock", caregiverSummary: mockCaregiverSummary },
}));

// Build check-ins within the current week
const recentCheckIns: CheckIn[] = [
  { id: "c1", createdAt: new Date().toISOString(), mood: "calm", intensity: 2, trigger: "stress" },
  { id: "c2", createdAt: new Date().toISOString(), mood: "craving", intensity: 4, trigger: "loneliness" },
  { id: "c3", createdAt: new Date().toISOString(), mood: "happy", intensity: 1, trigger: "work" },
];

vi.mock("@/hooks/useAppData", () => ({
  useAppData: vi.fn(() => ({
    checkIns: recentCheckIns,
    profile: null, onboarding: null, emergency: null, ready: true, refresh: vi.fn(),
  })),
}));

const getCaregiverComponent = async () => {
  const mod = await import("@/routes/caregiver");
  return (mod.Route as any).component;
};

describe("Caregiver page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCaregiverSummary.mockResolvedValue("Trend is calm. Keep presence consistent.");
  });

  it("renders the heading", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("Caregiver Dashboard")).toBeInTheDocument();
  });

  it("renders consent disclaimer", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText(/Summaries only/)).toBeInTheDocument();
  });

  it("renders 'This week' metric card", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // 3 check-ins this week
  });

  it("renders Trend metric card", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("Trend")).toBeInTheDocument();
  });

  it("renders Last mood metric card", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("Last mood")).toBeInTheDocument();
  });

  it("shows calm trend for low average intensity", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    // avg = (2+4+1)/3 = 2.33 → "Calm"
    expect(screen.getByText("Calm")).toBeInTheDocument();
  });

  it("renders AI weekly summary heading", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("AI weekly summary")).toBeInTheDocument();
  });

  it("shows Generating while summary loads", async () => {
    mockCaregiverSummary.mockImplementation(() => new Promise(() => {}));
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("Generating…")).toBeInTheDocument();
  });

  it("shows loaded AI summary", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    await waitFor(() => {
      expect(screen.getByText("Trend is calm. Keep presence consistent.")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders supportive actions section", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("Supportive actions this week")).toBeInTheDocument();
  });

  it("renders all 3 supportive suggestions", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText(/thinking of you/i)).toBeInTheDocument();
    expect(screen.getByText(/Offer a walk/i)).toBeInTheDocument();
    expect(screen.getByText(/What would feel supportive/i)).toBeInTheDocument();
  });

  it("renders Risk trend section", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("Risk trend")).toBeInTheDocument();
  });

  it("renders 'No data yet' when no check-ins", async () => {
    const { useAppData } = await import("@/hooks/useAppData");
    (useAppData as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      checkIns: [], profile: null, onboarding: null, emergency: null, ready: true, refresh: vi.fn(),
    });
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });

  it("renders last mood from most recent check-in", async () => {
    const Caregiver = (await getCaregiverComponent()) as React.ComponentType;
    render(React.createElement(Caregiver));
    // Most recent check-in mood = "calm"
    const lastMoodValues = screen.getAllByText("calm");
    expect(lastMoodValues.length).toBeGreaterThan(0);
  });
});
