import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, Calendar, BookOpen, Users, Settings as SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useSettings } from "@/hooks/useSettings";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/checkin", label: "Check-in", icon: Heart },
  { to: "/timeline", label: "Timeline", icon: Calendar },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/caregiver", label: "Caregiver", icon: Users },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useSettings(); // ensures theme classes are applied on every route
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-md">
        Skip to content
      </a>
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 sm:pb-8">
        {children}
      </main>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur sm:static sm:mt-8 sm:mx-auto sm:max-w-3xl sm:rounded-2xl sm:border sm:shadow-soft"
      >
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-1.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path === to || (to !== "/" && path.startsWith(to));
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
