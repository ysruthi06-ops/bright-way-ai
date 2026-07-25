// Thin wrappers around Web Speech APIs with graceful fallbacks.

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface Recognizer {
  start: () => void;
  stop: () => void;
}

export function createRecognizer(opts: {
  onResult: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}): Recognizer | null {
  if (!isSpeechRecognitionSupported()) return null;
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = "en-US";
  rec.onresult = (e: any) => {
    let final = "";
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    opts.onResult((final || interim).trim(), !!final);
  };
  rec.onend = () => opts.onEnd?.();
  rec.onerror = (e: any) => opts.onError?.(String(e.error ?? "error"));
  return { start: () => rec.start(), stop: () => rec.stop() };
}

export const speech = {
  speak(text: string) {
    if (!isSpeechSynthesisSupported()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  },
  stop() {
    if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
  },
};
