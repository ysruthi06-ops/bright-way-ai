import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/onboarding" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const mockEmergencyScript = vi.fn(() => Promise.resolve("You chose recovery."));
vi.mock("@/lib/ai/aiService", () => ({
  aiService: { mode: "mock", emergencyScript: mockEmergencyScript },
}));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    store: {
      getProfile: vi.fn(() => ({ id: "p1", name: "Friend", email: "", role: "user", createdAt: "", onboarded: false })),
      setProfile: vi.fn(),
      setOnboarding: vi.fn(),
      setEmergencyPlan: vi.fn(),
      getCheckIns: vi.fn(() => []),
      addCheckIn: vi.fn(),
      getOnboarding: vi.fn(() => null),
      getEmergencyPlan: vi.fn(() => null),
      getSettings: vi.fn(() => actual.defaultSettings),
      setSettings: vi.fn(),
      getStreakStart: vi.fn(() => null),
      clearAll: vi.fn(),
    },
    uid: vi.fn(() => "test-uid"),
  };
});

import { store } from "@/lib/storage";

const getOnboardingComponent = async () => {
  const mod = await import("@/routes/onboarding");
  return (mod.Route as any).component;
};

describe("Onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockEmergencyScript.mockResolvedValue("You chose recovery.");
  });

  it("renders the main heading", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    expect(screen.getByText("Let's personalize your plan")).toBeInTheDocument();
  });

  it("renders step indicator", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    expect(screen.getByText(/Setup · 1 \/ 7/)).toBeInTheDocument();
  });

  it("renders name input on first step", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
  });

  it("renders first question on first step", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    expect(screen.getByText("Why are you choosing recovery?")).toBeInTheDocument();
  });

  it("Back button is disabled on first step", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    const backBtn = screen.getByText("Back");
    expect(backBtn).toBeDisabled();
  });

  it("Continue button is present", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("navigates to step 2 on Continue click", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    fireEvent.click(screen.getByText("Continue"));
    await act(async () => {});
    expect(screen.getByText(/Setup · 2 \/ 7/)).toBeInTheDocument();
  });

  it("shows motivator question on step 2", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    fireEvent.click(screen.getByText("Continue"));
    await act(async () => {});
    expect(screen.getByText("Who or what motivates you?")).toBeInTheDocument();
  });

  it("Back button navigates back from step 2 to step 1", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    fireEvent.click(screen.getByText("Continue"));
    await act(async () => {});
    fireEvent.click(screen.getByText("Back"));
    await act(async () => {});
    expect(screen.getByText(/Setup · 1 \/ 7/)).toBeInTheDocument();
  });

  it("can type in name input", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    const nameInput = screen.getByPlaceholderText("First name");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    expect(nameInput).toHaveValue("Alice");
  });

  it("shows final confirmation step after all steps", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    // Click through all 6 steps (STEPS.length) to reach the final review
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText("Continue"));
      await act(async () => {});
    }
    expect(screen.getByText("Finish")).toBeInTheDocument();
  });

  it("Finish button calls store.setOnboarding and navigates to /", async () => {
    const Onboarding = (await getOnboardingComponent()) as React.ComponentType;
    render(React.createElement(Onboarding));
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText("Continue"));
      await act(async () => {});
    }
    fireEvent.click(screen.getByText("Finish"));
    await act(async () => {});
    expect(store.setOnboarding).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/" }));
  });
});
