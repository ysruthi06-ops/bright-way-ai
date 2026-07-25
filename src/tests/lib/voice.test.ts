import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createRecognizer,
  speech,
} from "@/lib/voice";

describe("isSpeechRecognitionSupported", () => {
  it("returns true when SpeechRecognition is available", () => {
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("returns true when webkitSpeechRecognition is available", () => {
    const original = (window as any).SpeechRecognition;
    delete (window as any).SpeechRecognition;
    (window as any).webkitSpeechRecognition = vi.fn();
    expect(isSpeechRecognitionSupported()).toBe(true);
    (window as any).SpeechRecognition = original;
  });

  it("returns false when neither API is available", () => {
    const origSR = (window as any).SpeechRecognition;
    const origWSR = (window as any).webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    expect(isSpeechRecognitionSupported()).toBe(false);
    (window as any).SpeechRecognition = origSR;
    (window as any).webkitSpeechRecognition = origWSR;
  });
});

describe("isSpeechSynthesisSupported", () => {
  it("returns true when speechSynthesis exists on window", () => {
    expect(isSpeechSynthesisSupported()).toBe(true);
  });

  it("returns false when speechSynthesis is absent", () => {
    const orig = window.speechSynthesis;
    delete (window as any).speechSynthesis;
    expect(isSpeechSynthesisSupported()).toBe(false);
    Object.defineProperty(window, "speechSynthesis", { value: orig, writable: true, configurable: true });
  });
});

describe("createRecognizer", () => {
  it("returns null when SpeechRecognition is not supported", () => {
    const origSR = (window as any).SpeechRecognition;
    const origWSR = (window as any).webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const rec = createRecognizer({ onResult: vi.fn() });
    expect(rec).toBeNull();

    (window as any).SpeechRecognition = origSR;
    (window as any).webkitSpeechRecognition = origWSR;
  });

  it("returns a recognizer object with start and stop", () => {
    const rec = createRecognizer({ onResult: vi.fn() });
    expect(rec).not.toBeNull();
    expect(typeof rec!.start).toBe("function");
    expect(typeof rec!.stop).toBe("function");
  });

  it("calls onResult with transcript on result event", () => {
    const onResult = vi.fn();
    const onEnd = vi.fn();
    const onError = vi.fn();

    let recInstance: any;
    const OrigCtor = (window as any).SpeechRecognition;
    (window as any).SpeechRecognition = vi.fn().mockImplementation(() => {
      recInstance = {
        continuous: false,
        interimResults: true,
        lang: "en-US",
        start: vi.fn(),
        stop: vi.fn(),
        onresult: null as any,
        onend: null as any,
        onerror: null as any,
      };
      return recInstance;
    });

    createRecognizer({ onResult, onEnd, onError });

    recInstance.onresult({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: "hello" }], { isFinal: true }),
      ],
    });

    expect(onResult).toHaveBeenCalledWith("hello", true);

    recInstance.onend();
    expect(onEnd).toHaveBeenCalled();

    recInstance.onerror({ error: "no-speech" });
    expect(onError).toHaveBeenCalledWith("no-speech");

    (window as any).SpeechRecognition = OrigCtor;
  });

  it("calls onResult with interim transcript", () => {
    const onResult = vi.fn();
    let recInstance: any;
    const OrigCtor = (window as any).SpeechRecognition;
    (window as any).SpeechRecognition = vi.fn().mockImplementation(() => {
      recInstance = {
        continuous: false, interimResults: true, lang: "en-US",
        start: vi.fn(), stop: vi.fn(),
        onresult: null, onend: null, onerror: null,
      };
      return recInstance;
    });

    createRecognizer({ onResult });

    recInstance.onresult({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: "interims" }], { isFinal: false }),
      ],
    });

    expect(onResult).toHaveBeenCalledWith("interims", false);
    (window as any).SpeechRecognition = OrigCtor;
  });
});

describe("speech", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("speak() calls speechSynthesis.cancel and speak", () => {
    speech.speak("Hello");
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("stop() calls speechSynthesis.cancel", () => {
    speech.stop();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it("speak() does nothing when speechSynthesis is unsupported", () => {
    const orig = window.speechSynthesis;
    delete (window as any).speechSynthesis;
    expect(() => speech.speak("test")).not.toThrow();
    Object.defineProperty(window, "speechSynthesis", { value: orig, writable: true, configurable: true });
  });

  it("stop() does nothing when speechSynthesis is unsupported", () => {
    const orig = window.speechSynthesis;
    delete (window as any).speechSynthesis;
    expect(() => speech.stop()).not.toThrow();
    Object.defineProperty(window, "speechSynthesis", { value: orig, writable: true, configurable: true });
  });
});
