import { useEffect, useState } from "react";
import { store, defaultSettings, type Settings } from "@/lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    setSettings(store.getSettings());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.darkMode);
    document.documentElement.classList.toggle("hc", settings.highContrast);
    document.documentElement.setAttribute("data-textsize", settings.textSize);
  }, [settings]);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    store.setSettings(next);
  };

  return { settings, update };
}
