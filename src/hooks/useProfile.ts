import { useEffect, useState } from "react";
import { ensureProfile, incrementPoints, subscribeToProfile, type Profile } from "../db/profileDb";

export const useProfile = (uid: string, fallbackName: string) => {
  const [profile, setProfile] = useState<Profile>({ displayName: fallbackName, points: 0 });

  useEffect(() => {
    ensureProfile(uid, fallbackName);
    return subscribeToProfile(uid, setProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return { ...profile, recordPoint: () => incrementPoints(uid) };
};
