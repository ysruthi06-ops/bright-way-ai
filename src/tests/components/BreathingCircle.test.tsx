import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BreathingCircle } from "@/components/BreathingCircle";

describe("BreathingCircle", () => {
  it("renders the initial phase label 'Inhale'", () => {
    render(React.createElement(BreathingCircle));
    expect(screen.getByText("Inhale")).toBeInTheDocument();
  });

  it("renders instruction text", () => {
    render(React.createElement(BreathingCircle));
    expect(screen.getByText(/follow the circle/i)).toBeInTheDocument();
  });

  it("has aria-live polite region for accessibility", () => {
    const { container } = render(React.createElement(BreathingCircle));
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
  });

  it("does not advance phase when running=false", async () => {
    render(React.createElement(BreathingCircle, { running: false }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    // Should still be on Inhale since running=false freezes the timer
    expect(screen.getByText("Inhale")).toBeInTheDocument();
  });

  it("applies animate-breathe class when running", () => {
    const { container } = render(React.createElement(BreathingCircle, { running: true }));
    const circle = container.querySelector(".animate-breathe");
    expect(circle).toBeInTheDocument();
  });

  it("does not apply animate-breathe class when not running", () => {
    const { container } = render(React.createElement(BreathingCircle, { running: false }));
    const circle = container.querySelector(".animate-breathe");
    expect(circle).toBeNull();
  });

  it("defaults running to true", () => {
    const { container } = render(React.createElement(BreathingCircle));
    const circle = container.querySelector(".animate-breathe");
    expect(circle).toBeInTheDocument();
  });

  it("renders the animated circle div with aria-hidden", () => {
    const { container } = render(React.createElement(BreathingCircle));
    const animatedDiv = container.querySelector("[aria-hidden='true']");
    expect(animatedDiv).toBeInTheDocument();
  });

  it("cycles to Hold phase after Inhale timeout", async () => {
    vi.useFakeTimers();
    render(React.createElement(BreathingCircle, { running: true }));
    expect(screen.getByText("Inhale")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4001);
    });

    expect(screen.getByText("Hold")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("cycles to Exhale phase after Hold timeout", async () => {
    vi.useFakeTimers();
    render(React.createElement(BreathingCircle, { running: true }));

    await act(async () => {
      vi.advanceTimersByTime(4001); // Inhale → Hold
    });
    await act(async () => {
      vi.advanceTimersByTime(2001); // Hold → Exhale
    });

    expect(screen.getByText("Exhale")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
