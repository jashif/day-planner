import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SECTIONS, getSections, saveSections } from "../db/userDb";

export const useSections = (uid: string) => {
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTIONS[0]);

  useEffect(() => {
    let cancelled = false;
    getSections(uid).then((nextSections) => {
      if (cancelled) return;
      setSections(nextSections);
      setActiveSection((current) => (nextSections.includes(current) ? current : nextSections[0]));
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const addSection = useCallback(
    async (name: string) => {
      const trimmed = name.trim().slice(0, 30);
      if (!trimmed || sections.some((section) => section.toLowerCase() === trimmed.toLowerCase())) {
        return;
      }
      const nextSections = [...sections, trimmed];
      setSections(nextSections);
      setActiveSection(trimmed);
      await saveSections(uid, nextSections);
    },
    [sections, uid],
  );

  return { sections, activeSection, setActiveSection, addSection };
};
