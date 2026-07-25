import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_: string) => (opts: { component?: React.ComponentType }) => opts,
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/resources" } }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ settings: { darkMode: false, highContrast: false, textSize: "base", voiceEnabled: true, notifications: false }, update: vi.fn() }),
}));

const mockKnowledge = vi.fn(() => Promise.resolve("Cravings peak within 3-5 minutes and then fade."));
const mockKnowledgeBase = [
  { q: "Why do cravings happen?", a: "Cravings are the brain's learned response to cues." },
  { q: "How long do cravings last?", a: "Most cravings peak within 3-5 minutes." },
  { q: "What is relapse?", a: "Relapse is a return to substance use after a period of change." },
  { q: "What is HALT?", a: "HALT stands for Hungry, Angry, Lonely, Tired." },
  { q: "Is asking for help a weakness?", a: "No. Reaching out is one of the strongest predictors." },
];

vi.mock("@/lib/ai/aiService", () => ({
  aiService: { mode: "mock", knowledge: mockKnowledge },
  knowledgeBase: mockKnowledgeBase,
}));

const getResourcesComponent = async () => {
  const mod = await import("@/routes/resources");
  return (mod.Route as any).component;
};

describe("Resources page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKnowledge.mockResolvedValue("Cravings peak within 3-5 minutes and then fade.");
  });

  it("renders the heading", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    expect(screen.getByText("Recovery Knowledge")).toBeInTheDocument();
  });

  it("renders subtitle text", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    expect(screen.getByText(/Grounded in verified resources/i)).toBeInTheDocument();
  });

  it("renders 'Ask a question' section heading", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    expect(screen.getByText("Ask a question")).toBeInTheDocument();
  });

  it("renders all knowledge base questions as buttons", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    mockKnowledgeBase.forEach((k) => {
      expect(screen.getAllByText(k.q)[0]).toBeInTheDocument();
    });
  });

  it("renders all resources in the 'All resources' section", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    expect(screen.getByText("All resources")).toBeInTheDocument();
    mockKnowledgeBase.forEach((k) => {
      expect(screen.getByText(k.a)).toBeInTheDocument();
    });
  });

  it("does not show answer section before a question is asked", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
    expect(screen.queryByText("Cravings peak within 3-5 minutes and then fade.")).not.toBeInTheDocument();
  });

  it("shows 'Thinking...' loading state when question is clicked", async () => {
    mockKnowledge.mockImplementation(() => new Promise(() => {})); // never resolves
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    fireEvent.click(screen.getAllByText("Why do cravings happen?")[0]);
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });

  it("shows the answer after knowledge call resolves", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    fireEvent.click(screen.getAllByText("Why do cravings happen?")[0]);
    await waitFor(() => {
      expect(screen.getByText("Cravings peak within 3-5 minutes and then fade.")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows the asked question as label above answer", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    fireEvent.click(screen.getAllByText("Why do cravings happen?")[0]);
    await act(async () => {});
    // The question appears as a label in the answer section
    const questionLabels = screen.getAllByText("Why do cravings happen?");
    expect(questionLabels.length).toBeGreaterThan(1);
  });

  it("answer section has aria-live polite", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    fireEvent.click(screen.getAllByText("Why do cravings happen?")[0]);
    await act(async () => {});
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
  });

  it("calls aiService.knowledge with the question text", async () => {
    const Resources = (await getResourcesComponent()) as React.ComponentType;
    render(React.createElement(Resources));
    fireEvent.click(screen.getAllByText("What is HALT?")[0]);
    await act(async () => {});
    expect(mockKnowledge).toHaveBeenCalledWith("What is HALT?");
  });
});
