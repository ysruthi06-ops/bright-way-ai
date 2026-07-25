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
    select({ location: { pathname: "/checkin" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    store: {
      addCheckIn: vi.fn(),
      getProfile: vi.fn(() => null),
      getCheckIns: vi.fn(() => []),
      getOnboarding: vi.fn(() => null),
      getEmergencyPlan: vi.fn(() => null),
      getSettings: vi.fn(() => actual.defaultSettings),
      setSettings: vi.fn(),
      getStreakStart: vi.fn(() => null),
      setStreakStart: vi.fn(),
      clearAll: vi.fn(),
    },
    uid: vi.fn(() => "test-uid"),
  };
});

import { store } from "@/lib/storage";

const getCheckinComponent = async () => {
  const mod = await import("@/routes/checkin");
  return (mod.Route as any).component;
};

describe("CheckIn page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("renders the main heading", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    expect(screen.getByText("Quick check-in")).toBeInTheDocument();
  });

  it("renders subtitle text", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    expect(screen.getByText("Three taps. No typing.")).toBeInTheDocument();
  });

  it("renders all 6 mood buttons", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    expect(screen.getByLabelText("Happy")).toBeInTheDocument();
    expect(screen.getByLabelText("Calm")).toBeInTheDocument();
    expect(screen.getByLabelText("Anxious")).toBeInTheDocument();
    expect(screen.getByLabelText("Sad")).toBeInTheDocument();
    expect(screen.getByLabelText("Angry")).toBeInTheDocument();
    expect(screen.getByLabelText("Craving")).toBeInTheDocument();
  });

  it("renders 5 intensity buttons", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    [1, 2, 3, 4, 5].forEach((n) => {
      expect(screen.getByLabelText(`Intensity ${n}`)).toBeInTheDocument();
    });
  });

  it("renders all 7 trigger buttons", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    const labels = ["Stress", "Work", "Loneliness", "Friends", "Family", "Money", "Other"];
    labels.forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
  });

  it("save button is disabled when nothing is selected", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    const btn = screen.getByText("Save & Talk to AI");
    expect(btn).toBeDisabled();
  });

  it("mood chip becomes aria-pressed=true when clicked", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    const calmBtn = screen.getByLabelText("Calm");
    fireEvent.click(calmBtn);
    expect(calmBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("intensity chip becomes selected when clicked", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    const int3 = screen.getByLabelText("Intensity 3");
    fireEvent.click(int3);
    expect(int3).toHaveAttribute("aria-pressed", "true");
  });

  it("save button becomes enabled after all three selections", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    fireEvent.click(screen.getByLabelText("Calm"));
    fireEvent.click(screen.getByLabelText("Intensity 2"));
    fireEvent.click(screen.getByLabelText("Stress"));
    const btn = screen.getByText("Save & Talk to AI");
    expect(btn).not.toBeDisabled();
  });

  it("submitting check-in calls store.addCheckIn", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    fireEvent.click(screen.getByLabelText("Calm"));
    fireEvent.click(screen.getByLabelText("Intensity 2"));
    fireEvent.click(screen.getByLabelText("Stress"));
    fireEvent.click(screen.getByText("Save & Talk to AI"));
    await act(async () => {});
    expect(store.addCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({ mood: "calm", intensity: 2, trigger: "stress" })
    );
  });

  it("submitting navigates to /coach", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    fireEvent.click(screen.getByLabelText("Happy"));
    fireEvent.click(screen.getByLabelText("Intensity 1"));
    fireEvent.click(screen.getByLabelText("Work"));
    fireEvent.click(screen.getByText("Save & Talk to AI"));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/coach" }));
  });

  it("section headers are present", async () => {
    const CheckIn = (await getCheckinComponent()) as React.ComponentType;
    render(React.createElement(CheckIn));
    expect(screen.getByText("1. How do you feel?")).toBeInTheDocument();
    expect(screen.getByText(/2\. How intense/)).toBeInTheDocument();
    expect(screen.getByText("3. What triggered it?")).toBeInTheDocument();
  });
});
