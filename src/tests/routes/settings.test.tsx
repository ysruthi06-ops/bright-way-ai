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
    select({ location: { pathname: "/settings" } }),
}));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    store: {
      getProfile: vi.fn(() => null),
      getCheckIns: vi.fn(() => []),
      getOnboarding: vi.fn(() => null),
      getEmergencyPlan: vi.fn(() => null),
      getSettings: vi.fn(() => actual.defaultSettings),
      setSettings: vi.fn(),
      getStreakStart: vi.fn(() => null),
      clearAll: vi.fn(),
    },
  };
});

vi.mock("@/hooks/useSettings", () => ({
  useSettings: vi.fn(() => ({
    settings: {
      darkMode: false, highContrast: false, textSize: "base",
      voiceEnabled: true, notifications: false,
    },
    update: vi.fn(),
  })),
}));

const getSettingsComponent = async () => {
  const mod = await import("@/routes/settings");
  return (mod.Route as any).component;
};

describe("Settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("renders the heading", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders Dark mode toggle", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("renders High contrast toggle", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText("High contrast")).toBeInTheDocument();
  });

  it("renders Voice input toggle", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText("Voice input & read-aloud")).toBeInTheDocument();
  });

  it("renders Notifications toggle", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders text size buttons", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Extra")).toBeInTheDocument();
  });

  it("normal text size button is aria-pressed=true by default", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    const normalBtn = screen.getByText("Normal");
    expect(normalBtn.closest("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking dark mode toggle calls update", async () => {
    const mockUpdate = vi.fn();
    const { useSettings } = await import("@/hooks/useSettings");
    (useSettings as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false },
      update: mockUpdate,
    });
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    const darkModeSwitch = screen.getAllByRole("switch")[0];
    fireEvent.click(darkModeSwitch);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ darkMode: true }));
  });

  it("dark mode switch reflects aria-checked=false when off", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "false");
  });

  it("renders 'Re-run onboarding' button", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText(/Re-run onboarding/)).toBeInTheDocument();
  });

  it("Re-run onboarding navigates to /onboarding", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    fireEvent.click(screen.getByText(/Re-run onboarding/));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/onboarding" }));
  });

  it("renders 'Reset all data' button", async () => {
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    expect(screen.getByText("Reset all data")).toBeInTheDocument();
  });

  it("clicking Reset calls store.clearAll after confirm", async () => {
    const { store } = await import("@/lib/storage");
    window.confirm = vi.fn(() => true);
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    fireEvent.click(screen.getByText("Reset all data"));
    expect(store.clearAll).toHaveBeenCalled();
  });

  it("does not call clearAll when confirm is cancelled", async () => {
    const { store } = await import("@/lib/storage");
    window.confirm = vi.fn(() => false);
    const Settings = (await getSettingsComponent()) as React.ComponentType;
    render(React.createElement(Settings));
    fireEvent.click(screen.getByText("Reset all data"));
    expect(store.clearAll).not.toHaveBeenCalled();
  });
});
