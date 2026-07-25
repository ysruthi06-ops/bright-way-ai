import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppData } from "@/hooks/useAppData";
import { store } from "@/lib/storage";

const makeProfile = () => ({
  id: "p1", name: "Test", email: "t@t.com",
  role: "user" as const, createdAt: "2024-01-01T00:00:00Z", onboarded: true,
});

const makeCheckIn = (id: string) => ({
  id, createdAt: new Date().toISOString(),
  mood: "calm" as const, intensity: 2 as const, trigger: "stress" as const,
});

describe("useAppData", () => {
  beforeEach(() => {
    store.clearAll();
  });

  it("starts with ready=false and empty state", () => {
    const { result } = renderHook(() => useAppData());
    // Initially ready is false before the effect runs
    expect(result.current.checkIns).toEqual([]);
    expect(result.current.profile).toBeNull();
    expect(result.current.onboarding).toBeNull();
    expect(result.current.emergency).toBeNull();
  });

  it("becomes ready=true after mount", async () => {
    const { result } = renderHook(() => useAppData());
    // After effect runs, ready should be true
    await act(async () => {});
    expect(result.current.ready).toBe(true);
  });

  it("loads profile from store on mount", async () => {
    const p = makeProfile();
    store.setProfile(p);
    const { result } = renderHook(() => useAppData());
    await act(async () => {});
    expect(result.current.profile).toEqual(p);
  });

  it("loads check-ins from store on mount", async () => {
    store.addCheckIn(makeCheckIn("c1"));
    store.addCheckIn(makeCheckIn("c2"));
    const { result } = renderHook(() => useAppData());
    await act(async () => {});
    expect(result.current.checkIns).toHaveLength(2);
  });

  it("loads emergency plan from store on mount", async () => {
    store.setEmergencyPlan({ script: "Stay calm.", updatedAt: new Date().toISOString() });
    const { result } = renderHook(() => useAppData());
    await act(async () => {});
    expect(result.current.emergency?.script).toBe("Stay calm.");
  });

  it("refresh() re-reads all data from store", async () => {
    const { result } = renderHook(() => useAppData());
    await act(async () => {});
    expect(result.current.checkIns).toHaveLength(0);

    store.addCheckIn(makeCheckIn("c3"));
    act(() => { result.current.refresh(); });

    expect(result.current.checkIns).toHaveLength(1);
  });
});
