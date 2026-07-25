import { useCallback, useEffect, useState } from "react";
import { store, type CheckIn, type Profile, type OnboardingAnswers, type EmergencyPlan } from "@/lib/storage";

export function useAppData() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingAnswers | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [emergency, setEmergency] = useState<EmergencyPlan | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setProfile(store.getProfile());
    setOnboarding(store.getOnboarding());
    setCheckIns(store.getCheckIns());
    setEmergency(store.getEmergencyPlan());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  return { profile, onboarding, checkIns, emergency, ready, refresh };
}
