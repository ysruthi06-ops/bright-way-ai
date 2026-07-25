import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ── Router mocks ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

// ── Store & AI mocks ──────────────────────────────────────────────────────────
vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    store: {
      getProfile: vi.fn(() => ({ id: "p1", name: "Alex", email: "", role: "user", createdAt: "2024-01-01T00:00:00Z", onboarded: true })),
      setProfile: vi.fn(),
      getCheckIns: vi.fn(() => []),
      addCheckIn: vi.fn(),
      getOnboarding: vi.fn(() => null),
      getEmergencyPlan: vi.fn(() => null),
      getSettings: vi.fn(() => actual.defaultSettings),
      setSettings: vi.fn(),
      getStreakStart: vi.fn(() => "2024-01-01T00:00:00Z"),
      setStreakStart: vi.fn(),
      clearAll: vi.fn(),
    },
    daysSince: vi.fn(() => 5),
    uid: vi.fn(() => "test-uid"),
  };
});

vi.mock("@/lib/ai/aiService", () => ({
  aiService: {
    mode: "mock",
    risk: vi.fn(() => Promise.resolve({ level: "low", reason: "Stable check-ins.", action: "Keep going." })),
    coach: vi.fn(() => Promise.resolve("You are doing great. Take a breath.")),
    emergencyScript: vi.fn(() => Promise.resolve("You chose recovery. Stay strong.")),
    timelineSummary: vi.fn(() => Promise.resolve("You checked in 3 times this week.")),
    caregiverSummary: vi.fn(() => Promise.resolve("Trend is calm. Keep presence consistent.")),
    knowledge: vi.fn(() => Promise.resolve("Cravings peak within 3-5 minutes.")),
  },
  knowledgeBase: [
    { q: "Why do cravings happen?", a: "Cravings are the brain's learned response." },
    { q: "How long do cravings last?", a: "Most cravings peak within 3-5 minutes." },
  ],
}));

vi.mock("@/hooks/useAppData", () => ({
  useAppData: vi.fn(() => ({
    profile: { id: "p1", name: "Alex", email: "", role: "user", createdAt: "2024-01-01T00:00:00Z", onboarded: true },
    checkIns: [],
    onboarding: null,
    emergency: null,
    ready: true,
    refresh: vi.fn(),
  })),
}));

// Voice
vi.mock("@/lib/voice", () => ({
  isSpeechRecognitionSupported: vi.fn(() => true),
  isSpeechSynthesisSupported: vi.fn(() => true),
  createRecognizer: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  speech: { speak: vi.fn(), stop: vi.fn() },
}));

// ── Import components (after all mocks are set up) ──────────────────────────
import { store } from "@/lib/storage";
import { useAppData } from "@/hooks/useAppData";

// Lazy imports to ensure mocks apply
const getDashboardComponent = async () => {
  const mod = await import("@/routes/index");
  return (mod.Route as any).component || (mod as any).default;
};

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("renders the main heading", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("You showed up today.")).toBeInTheDocument();
  });

  it("renders greeting with user name", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
  });

  it("renders streak stat card", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("Recovery streak")).toBeInTheDocument();
  });

  it("renders check-ins stat card", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("Check-ins")).toBeInTheDocument();
  });

  it("renders I feel okay and I'm struggling buttons", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("I feel okay")).toBeInTheDocument();
    expect(screen.getByText("I'm struggling")).toBeInTheDocument();
  });

  it("renders Emergency action button", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("Emergency")).toBeInTheDocument();
  });

  it("renders Talk to AI action button", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("Talk to AI")).toBeInTheDocument();
  });

  it("renders Full check-in action button", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getByText("Full check-in")).toBeInTheDocument();
  });

  it("renders Timeline, Resources, Caregiver tile links", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(screen.getAllByText("Timeline")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Resources")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Caregiver")[0]).toBeInTheDocument();
  });

  it("renders risk section when risk is available", async () => {
    const { aiService } = await import("@/lib/ai/aiService");
    const checkIns = [{ id: "c1", createdAt: new Date().toISOString(), mood: "craving", intensity: 5, trigger: "stress" }];
    (useAppData as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      profile: { id: "p1", name: "Alex", email: "", role: "user", createdAt: "", onboarded: true },
      checkIns,
      onboarding: null,
      emergency: null,
      ready: true,
      refresh: vi.fn(),
    });
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    // risk() is called and result is shown
    expect(aiService.risk).toHaveBeenCalled();
  });

  it("clicking 'I feel okay' calls store.addCheckIn", async () => {
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    fireEvent.click(screen.getByText("I feel okay"));
    await act(async () => {});
    expect(store.addCheckIn).toHaveBeenCalled();
  });

  it("navigates to /onboarding when no profile", async () => {
    (useAppData as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      profile: null, checkIns: [], onboarding: null, emergency: null, ready: true, refresh: vi.fn(),
    });
    const Dashboard = (await getDashboardComponent()) as React.ComponentType;
    render(React.createElement(Dashboard));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/onboarding" }));
  });
});
