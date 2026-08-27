import { useCallback, useRef, useState } from "react";

const getSpeechRecognitionCtor = (): (new () => SpeechRecognition) | undefined =>
  window.SpeechRecognition ?? window.webkitSpeechRecognition;

export const isSpeechRecognitionSupported = (): boolean => Boolean(getSpeechRecognitionCtor());

export interface ListenOptions {
  /** Keep listening across pauses until stop() is called, for long dictation. */
  continuous?: boolean;
  /** Called with the transcript so far, including the in-progress phrase. */
  onUpdate?: (text: string) => void;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  /** Resolves with the final transcript once the user stops speaking, or null if nothing was captured. */
  listen: (options?: ListenOptions) => Promise<string | null>;
  stop: () => void;
}

const errorMessageFor = (error: string): string => {
  if (error === "not-allowed") return "Microphone access was denied.";
  if (error === "no-speech") return "Didn't catch that — please try again.";
  if (error === "network") return "Voice input needs a network connection. Please try again.";
  if (error === "audio-capture") return "No microphone was found.";
  return `Voice input failed (${error}). Please try again.`;
};

// Errors where retrying is pointless, so continuous mode must give up rather than restart.
const FATAL_ERRORS = new Set([
  "not-allowed",
  "service-not-allowed",
  "audio-capture",
  "language-not-supported",
]);

export const useSpeechRecognition = (): UseSpeechRecognitionResult => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stoppedByUserRef = useRef(false);

  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const listen = useCallback((options: ListenOptions = {}): Promise<string | null> => {
    const { continuous = false, onUpdate } = options;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser.");
      return Promise.resolve(null);
    }

    setError(null);
    setIsListening(true);
    stoppedByUserRef.current = false;

    return new Promise((resolve) => {
      let settled = false;
      let finalText = "";
      let fatal = false;

      const finish = (result: string | null, errorMessage?: string) => {
        if (settled) return;
        settled = true;
        recognitionRef.current = null;
        setIsListening(false);
        if (errorMessage) setError(errorMessage);
        resolve(result);
      };

      const start = () => {
        const recognition = new Ctor();
        recognitionRef.current = recognition;
        recognition.lang = navigator.language || "en-US";
        recognition.continuous = continuous;
        recognition.interimResults = continuous;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          if (!continuous) {
            finish(event.results[0]?.[0]?.transcript?.trim() || null);
            return;
          }
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            const transcript = result[0]?.transcript ?? "";
            if (result.isFinal) {
              finalText = `${finalText} ${transcript}`.trim();
            } else {
              interim += transcript;
            }
          }
          onUpdate?.(`${finalText} ${interim}`.trim());
        };

        recognition.onerror = (event) => {
          console.error("SpeechRecognition error:", event.error, event.message);
          // A silence timeout is expected during long dictation; let onend restart instead of failing.
          if (continuous && !FATAL_ERRORS.has(event.error)) return;
          fatal = true;
          finish(continuous && finalText ? finalText : null, errorMessageFor(event.error));
        };

        recognition.onend = () => {
          if (continuous && !stoppedByUserRef.current && !fatal) {
            start();
            return;
          }
          finish(continuous ? finalText.trim() || null : null);
        };

        recognition.start();
      };

      start();
    });
  }, []);

  return { isSupported: isSpeechRecognitionSupported(), isListening, error, listen, stop };
};
