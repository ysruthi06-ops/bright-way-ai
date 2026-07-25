import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock TanStack Router hooks before importing AppShell
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className, ...rest }: { to: string; children?: React.ReactNode; className?: string; [k: string]: unknown }) =>
    React.createElement("a", { href: to, className, ...rest }, children),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));

// Mock useSettings to avoid localStorage dependency
vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

import { AppShell } from "@/components/AppShell";

describe("AppShell", () => {
  it("renders children inside main", () => {
    render(React.createElement(AppShell, null, React.createElement("div", { "data-testid": "child" }, "Hello")));
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders primary navigation", () => {
    render(React.createElement(AppShell, null, React.createElement("p", null, "content")));
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeInTheDocument();
  });

  it("renders all 6 nav items", () => {
    render(React.createElement(AppShell, null, React.createElement("p", null, "content")));
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Check-in")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Caregiver")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders skip-to-content link", () => {
    render(React.createElement(AppShell, null, React.createElement("p", null, "content")));
    expect(screen.getByText("Skip to content")).toBeInTheDocument();
  });

  it("marks Home link as current page when path is '/'", () => {
    render(React.createElement(AppShell, null, React.createElement("p", null, "content")));
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  it("renders a main element with id='main'", () => {
    render(React.createElement(AppShell, null, React.createElement("p", null, "content")));
    expect(document.getElementById("main")).toBeInTheDocument();
  });

  it("nav links point to correct hrefs", () => {
    render(React.createElement(AppShell, null, React.createElement("p", null, "content")));
    const checkInLink = screen.getByText("Check-in").closest("a");
    expect(checkInLink).toHaveAttribute("href", "/checkin");
  });
});
