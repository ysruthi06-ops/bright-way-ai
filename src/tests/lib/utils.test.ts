import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("returns an empty string when no arguments are passed", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class name as-is", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false && "bar", undefined, null, "", "baz")).toBe("foo baz");
  });

  it("handles conditional objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("deduplicates conflicting Tailwind classes (tailwind-merge)", () => {
    // tailwind-merge resolves conflicting utilities to the last one
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  it("merges conditional objects with strings", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("handles arrays of class names", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
