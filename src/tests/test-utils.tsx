import React from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { vi } from "vitest";

// ─── Minimal TanStack Router Stubs ────────────────────────────────────────────
// We mock @tanstack/react-router at the test utility level so that components
// that call createFileRoute / Link / useNavigate / useRouterState don't crash.

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    // createFileRoute returns an object whose `component` key can be extracted
    createFileRoute: (_path: string) => (opts: { component?: React.ComponentType }) => ({
      component: opts.component,
      head: opts,
    }),
    createRootRouteWithContext: () => (_opts: unknown) => ({}),
    // Link renders a plain <a> in tests
    Link: ({ to, children, className, ...rest }: { to: string; children?: React.ReactNode; className?: string; [key: string]: unknown }) =>
      React.createElement("a", { href: to, className, "data-testid": "link", ...rest }, children),
    useNavigate: () => vi.fn(),
    useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => unknown }) =>
      select({ location: { pathname: "/" } }),
    useRouter: () => ({ invalidate: vi.fn() }),
    Outlet: () => React.createElement("div", { "data-testid": "outlet" }),
    HeadContent: () => null,
    Scripts: () => null,
    QueryClient: actual.QueryClient,
    QueryClientProvider: actual.QueryClientProvider,
  };
});

// ─── Minimal QueryClient wrapper ─────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: CustomRenderOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from RTL for convenience
export * from "@testing-library/react";
export { renderWithProviders as render };
