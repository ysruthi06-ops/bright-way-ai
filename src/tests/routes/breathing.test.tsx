import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/breathing" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const getBreathingComponent = async () => {
  const mod = await import("@/routes/breathing");
  return (mod.Route as any).component;
};

describe("Breathing page", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("renders the heading", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText("Guided Breathing")).toBeInTheDocument();
  });

  it("renders subtitle text", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText(/Two minutes is enough/i)).toBeInTheDocument();
  });

  it("renders BreathingCircle component", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText("Inhale")).toBeInTheDocument();
  });

  it("renders timer display 00:00 initially", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("renders Pause button initially when running", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("renders Reset button", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("toggles Pause to Resume when clicked", async () => {
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    const pauseBtn = screen.getByText("Pause");
    fireEvent.click(pauseBtn);
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("increments timer seconds when running", async () => {
    vi.useFakeTimers();
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));
    expect(screen.getByText("00:00")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("00:03")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("resets timer to 00:00 when Reset is clicked", async () => {
    vi.useFakeTimers();
    const Breathing = (await getBreathingComponent()) as React.ComponentType;
    render(React.createElement(Breathing));

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:05")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("00:00")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
