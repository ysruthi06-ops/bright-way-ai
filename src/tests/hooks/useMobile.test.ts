import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  let mediaQueryListeners: ((e: { matches: boolean }) => void)[] = [];
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mediaQueryListeners = [];
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: window.innerWidth < 768,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
        if (event === "change") mediaQueryListeners.push(handler);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, "matchMedia", { value: mockMatchMedia, writable: true });
  });

  it("returns false on desktop (wide viewport)", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    act(() => {});
    expect(result.current).toBe(false);
  });

  it("returns true on mobile (narrow viewport)", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
    const { result } = renderHook(() => useIsMobile());
    act(() => {});
    expect(result.current).toBe(true);
  });

  it("returns false exactly at the 768 breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 768, writable: true });
    const { result } = renderHook(() => useIsMobile());
    act(() => {});
    expect(result.current).toBe(false);
  });

  it("returns true one pixel below the breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 767, writable: true });
    const { result } = renderHook(() => useIsMobile());
    act(() => {});
    expect(result.current).toBe(true);
  });
});
