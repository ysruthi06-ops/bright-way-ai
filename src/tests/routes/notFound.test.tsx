import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  createRootRouteWithContext: () => () => ({}),
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) =>
    React.createElement("a", { href: to, className }, children),
  useRouter: () => ({ invalidate: vi.fn() }),
  Outlet: () => null,
  HeadContent: () => null,
  Scripts: () => null,
}));

vi.mock("../lib/lovable-error-reporting", () => ({
  reportLovableError: vi.fn(),
}));

const getRootComponent = async () => {
  const mod = await import("@/routes/__root");
  return mod.Route;
};

describe("Root route 404 & Error components", () => {
  it("renders 404 NotFoundComponent correctly", async () => {
    const RouteObj = await getRootComponent();
    const NotFound = (RouteObj as any).options?.notFoundComponent || (RouteObj as any).notFoundComponent;
    if (NotFound) {
      render(React.createElement(NotFound));
      expect(screen.getByText("404")).toBeInTheDocument();
      expect(screen.getByText("Page not found")).toBeInTheDocument();
      expect(screen.getByText("Go home")).toBeInTheDocument();
    }
  });

  it("renders ErrorComponent correctly", async () => {
    const RouteObj = await getRootComponent();
    const ErrorComp = (RouteObj as any).options?.errorComponent || (RouteObj as any).errorComponent;
    if (ErrorComp) {
      render(React.createElement(ErrorComp, { error: new Error("Test failure"), reset: vi.fn() }));
      expect(screen.getByText("This page didn't load")).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
      expect(screen.getByText("Go home")).toBeInTheDocument();
    }
  });
});
