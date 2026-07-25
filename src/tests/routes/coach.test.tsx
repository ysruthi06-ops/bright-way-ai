import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/coach" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const mockCoach = vi.fn(() => Promise.resolve("You're doing great. Take a deep breath."));
vi.mock("@/lib/ai/aiService", () => ({
  aiService: { mode: "mock", coach: mockCoach },
}));

const mockSpeechSpeak = vi.fn();
const mockSpeechStop = vi.fn();
const mockRecStart = vi.fn();
const mockRecStop = vi.fn();
let mockIsRecSupported = true;
let mockCreateRecognizer = vi.fn(() => ({ start: mockRecStart, stop: mockRecStop }));

vi.mock("@/lib/voice", () => ({
  isSpeechRecognitionSupported: () => mockIsRecSupported,
  isSpeechSynthesisSupported: () => true,
  createRecognizer: (...args: Parameters<typeof mockCreateRecognizer>) => mockCreateRecognizer(...args),
  speech: { speak: mockSpeechSpeak, stop: mockSpeechStop },
}));

vi.mock("@/hooks/useAppData", () => ({
  useAppData: vi.fn(() => ({
    checkIns: [],
    onboarding: null,
    emergency: null,
    ready: true,
    refresh: vi.fn(),
  })),
}));

const getCoachComponent = async () => {
  const mod = await import("@/routes/coach");
  return (mod.Route as any).component;
};

describe("Coach page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCoach.mockResolvedValue("You're doing great. Take a deep breath.");
    mockCreateRecognizer = vi.fn(() => ({ start: mockRecStart, stop: mockRecStop }));
    mockIsRecSupported = true;
  });

  it("renders the heading", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByText("AI Recovery Coach")).toBeInTheDocument();
  });

  it("shows disclaimer text", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByText(/not a substitute for professional care/i)).toBeInTheDocument();
  });

  it("shows 'Local mode' badge in mock mode", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByText("Local mode")).toBeInTheDocument();
  });

  it("renders message textarea", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
  });

  it("renders send button", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("renders mic button when speech is supported", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByRole("button", { name: /start voice input/i })).toBeInTheDocument();
  });

  it("shows initial AI greeting after mount", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    await waitFor(() => {
      expect(screen.getByText("You're doing great. Take a deep breath.")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("sends a message and shows user bubble", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    await waitFor(() => screen.getByText("You're doing great. Take a deep breath."));

    const textarea = screen.getByRole("textbox", { name: /message/i });
    fireEvent.change(textarea, { target: { value: "I need help" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await act(async () => {});

    expect(screen.getByText("I need help")).toBeInTheDocument();
  });

  it("shows AI reply after sending message", async () => {
    mockCoach
      .mockResolvedValueOnce("Initial greeting.")
      .mockResolvedValueOnce("Here is my reply.");

    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    await waitFor(() => screen.getByText("Initial greeting."));

    const textarea = screen.getByRole("textbox", { name: /message/i });
    fireEvent.change(textarea, { target: { value: "How are you?" } });

    await act(async () => {
      fireEvent.submit(textarea.closest("form")!);
    });

    await waitFor(() => expect(screen.getByText("Here is my reply.")).toBeInTheDocument());
  });

  it("shows 'Voice input isn't supported' when recognition is unavailable", async () => {
    mockIsRecSupported = false;
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    expect(screen.getByText(/voice input isn't supported/i)).toBeInTheDocument();
  });

  it("mic button is disabled when voice not supported", async () => {
    mockIsRecSupported = false;
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    const micBtn = screen.getByRole("button", { name: /start voice input|stop listening/i });
    expect(micBtn).toBeDisabled();
  });

  it("mic button toggles listening state", async () => {
    const Coach = (await getCoachComponent()) as React.ComponentType;
    render(React.createElement(Coach));
    await waitFor(() => screen.getByText("You're doing great. Take a deep breath."));
    const micBtn = screen.getByRole("button", { name: /start voice input/i });
    fireEvent.click(micBtn);
    await act(async () => {});
    expect(mockRecStart).toHaveBeenCalled();
  });
});
