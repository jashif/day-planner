const FILLER_PREFIXES = [
  /^(ok(ay)?|please|hey|so)[,\s]+/i,
  /^(add|create|remind me to|remember to|i need to|i have to|i want to)\s+(a\s+)?(task\s+)?(to\s+)?/i,
];

/** Light client-side cleanup of a raw speech-to-text transcript into a task title. */
export const cleanVoiceTranscript = (transcript: string): string => {
  let text = transcript.trim();

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of FILLER_PREFIXES) {
      const next = text.replace(pattern, "");
      if (next !== text) {
        text = next.trimStart();
        changed = true;
      }
    }
  }

  text = text.replace(/[.\s]+$/, "").trim();
  if (!text) return transcript.trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
