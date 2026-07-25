import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "@/hooks/useSettings";
import { store, defaultSettings } from "@/lib/storage";

describe("useSettings", () => {
  beforeEach(() => {
    store.clearAll();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-textsize");
  });

  it("returns default settings initially", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    expect(result.current.settings).toEqual(defaultSettings);
  });

  it("loads stored settings on mount", async () => {
    store.setSettings({ ...defaultSettings, darkMode: true, textSize: "lg" });
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    expect(result.current.settings.darkMode).toBe(true);
    expect(result.current.settings.textSize).toBe("lg");
  });

  it("update() merges partial settings", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ darkMode: true }); });
    expect(result.current.settings.darkMode).toBe(true);
    // Other settings remain unchanged
    expect(result.current.settings.voiceEnabled).toBe(defaultSettings.voiceEnabled);
  });

  it("update() persists to store", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ highContrast: true }); });
    expect(store.getSettings().highContrast).toBe(true);
  });

  it("applies dark class to documentElement when darkMode is true", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ darkMode: true }); });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when darkMode is false", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ darkMode: true }); });
    act(() => { result.current.update({ darkMode: false }); });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies hc class for high contrast", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ highContrast: true }); });
    expect(document.documentElement.classList.contains("hc")).toBe(true);
  });

  it("sets data-textsize attribute on document element", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ textSize: "xl" }); });
    expect(document.documentElement.getAttribute("data-textsize")).toBe("xl");
  });

  it("can toggle multiple settings independently", async () => {
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => { result.current.update({ darkMode: true }); });
    act(() => { result.current.update({ voiceEnabled: false }); });
    expect(result.current.settings.darkMode).toBe(true);
    expect(result.current.settings.voiceEnabled).toBe(false);
  });
});
