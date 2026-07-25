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
    select({ location: { pathname: "/timeline" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const mockTimelineSummary = vi.fn(() => Promise.resolve("You checked in 3 times this week."));
vi.mock("@/lib/ai/aiService", () => ({
  aiService: { mode: "mock", timelineSummary: mockTimelineSummary },
}));

const mockCheckIns: CheckIn[] = [
  { id: "c1", createdAt: "2024-01-15T10:00:00.000Z", mood: "calm", intensity: 2, trigger: "stress" },
  { id: "c2", createdAt: "2024-01-14T09:00:00.000Z", mood: "craving", intensity: 4, trigger: "loneliness" },
];

vi.mock("@/hooks/useAppData", () => ({
  useAppData: vi.fn(() => ({
    checkIns: mockCheckIns,
    profile: null, onboarding: null, emergency: null, ready: true, refresh: vi.fn(),
  })),
}));

const getTimelineComponent = async () => {
  const mod = await import("@/routes/timeline");
  return (mod.Route as any).component;
};

describe("Timeline page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimelineSummary.mockResolvedValue("You checked in 3 times this week.");
  });

  it("renders the heading", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText("Your recovery timeline")).toBeInTheDocument();
  });

  it("renders AI weekly summary section heading", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText("AI weekly summary")).toBeInTheDocument();
  });

  it("shows generating placeholder initially", async () => {
    mockTimelineSummary.mockImplementation(() => new Promise(() => {})); // never resolves
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText("Generating…")).toBeInTheDocument();
  });

  it("shows AI summary once loaded", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    await waitFor(() => {
      expect(screen.getByText("You checked in 3 times this week.")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows check-in count in section heading", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText(`All check-ins (${mockCheckIns.length})`)).toBeInTheDocument();
  });

  it("renders each check-in as a list item", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText("calm")).toBeInTheDocument();
    expect(screen.getByText("craving")).toBeInTheDocument();
  });

  it("renders intensity and trigger for each check-in", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText(/Intensity 2\/5 · Trigger:/)).toBeInTheDocument();
    expect(screen.getByText(/Intensity 4\/5 · Trigger:/)).toBeInTheDocument();
  });

  it("renders empty state when no check-ins", async () => {
    const { useAppData } = await import("@/hooks/useAppData");
    (useAppData as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      checkIns: [],
      profile: null, onboarding: null, emergency: null, ready: true, refresh: vi.fn(),
    });
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    expect(screen.getByText(/No check-ins yet/)).toBeInTheDocument();
  });

  it("renders check-in dates with time element", async () => {
    const Timeline = (await getTimelineComponent()) as React.ComponentType;
    render(React.createElement(Timeline));
    const timeEl = document.querySelector("time");
    expect(timeEl).toBeInTheDocument();
  });
});
