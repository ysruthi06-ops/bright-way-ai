import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/emergency" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const mockEmergencyScript = vi.fn(() => Promise.resolve("You chose recovery. Stay strong."));
vi.mock("@/lib/ai/aiService", () => ({
  aiService: { mode: "mock", emergencyScript: mockEmergencyScript },
}));

const mockSpeechSpeak = vi.fn();
const mockSpeechStop = vi.fn();
vi.mock("@/lib/voice", () => ({
  speech: { speak: mockSpeechSpeak, stop: mockSpeechStop },
  isSpeechRecognitionSupported: () => true,
  isSpeechSynthesisSupported: () => true,
}));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    store: {
      setEmergencyPlan: vi.fn(),
      getProfile: vi.fn(() => null),
      getCheckIns: vi.fn(() => []),
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

vi.mock("@/hooks/useAppData", () => ({
  useAppData: vi.fn(() => ({
    emergency: null,
    onboarding: {
      reason: "for family", motivator: "kids", goal: "30 days",
      calmingActivity: "walking", emergencyContactName: "Jane", emergencyContactPhone: "+15551234567",
    },
    checkIns: [], profile: null, ready: true, refresh: vi.fn(),
  })),
}));

const getEmergencyComponent = async () => {
  const mod = await import("@/routes/emergency");
  return (mod.Route as any).component;
};

describe("Emergency page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmergencyScript.mockResolvedValue("You chose recovery. Stay strong.");
  });

  it("renders the heading", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText("You're safe here.")).toBeInTheDocument();
  });

  it("renders subtitle text", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText(/Read the script/i)).toBeInTheDocument();
  });

  it("renders emergency script section heading", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText("Your emergency script")).toBeInTheDocument();
  });

  it("shows 'Preparing your script...' initially", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText("Preparing your script…")).toBeInTheDocument();
  });

  it("displays generated emergency script", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    await waitFor(() => {
      expect(screen.getByText("You chose recovery. Stay strong.")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders Breathe section", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText("Breathe")).toBeInTheDocument();
  });

  it("renders link to full breathing exercise", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    const link = screen.getByText(/Open full breathing exercise/i);
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/breathing");
  });

  it("renders grounding section heading", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText("Grounding: 5-4-3-2-1")).toBeInTheDocument();
  });

  it("renders all 5 grounding steps", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText(/things you can SEE/)).toBeInTheDocument();
    expect(screen.getByText(/things you can TOUCH/)).toBeInTheDocument();
    expect(screen.getByText(/things you can HEAR/)).toBeInTheDocument();
    expect(screen.getByText(/things you can SMELL/)).toBeInTheDocument();
    expect(screen.getByText(/thing you can TASTE/)).toBeInTheDocument();
  });

  it("shows call contact link with phone number", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    const callLink = screen.getByText(/Call Jane/);
    expect(callLink.closest("a")).toHaveAttribute("href", "tel:+15551234567");
  });

  it("shows message contact link", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText(/Message Jane/)).toBeInTheDocument();
  });

  it("renders BreathingCircle component", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText("Inhale")).toBeInTheDocument();
  });

  it("shows 'Read aloud' button after script loads", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    await waitFor(() => screen.getByText("You chose recovery. Stay strong."));
    expect(screen.getByText("Read aloud")).toBeInTheDocument();
  });

  it("clicking 'Read aloud' calls speech.speak", async () => {
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    await waitFor(() => screen.getByText("You chose recovery. Stay strong."));
    fireEvent.click(screen.getByText("Read aloud"));
    expect(mockSpeechSpeak).toHaveBeenCalledWith("You chose recovery. Stay strong.");
  });

  it("shows no phone message when onboarding has no contact", async () => {
    const { useAppData } = await import("@/hooks/useAppData");
    (useAppData as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      emergency: null,
      onboarding: {
        reason: "for family", motivator: "kids", goal: "30 days",
        calmingActivity: "walking", emergencyContactName: "", emergencyContactPhone: "",
      },
      checkIns: [], profile: null, ready: true, refresh: vi.fn(),
    });
    const Emergency = (await getEmergencyComponent()) as React.ComponentType;
    render(React.createElement(Emergency));
    expect(screen.getByText(/Add your emergency contact/i)).toBeInTheDocument();
  });
});
