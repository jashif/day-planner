import { useCallback, useRef, useState } from "react";

const getSpeechRecognitionCtor = (): (new () => SpeechRecognition) | undefined =>
  window.SpeechRecognition ?? window.webkitSpeechRecognition;

export const isSpeechRecognitionSupported = (): boolean => Boolean(getSpeechRecognitionCtor());

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  /** Resolves with the final transcript once the user stops speaking, or null if nothing was captured. */
  listen: () => Promise<string | null>;
  stop: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionResult => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const listen = useCallback((): Promise<string | null> => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser.");
      return Promise.resolve(null);
    }

    setError(null);
    setIsListening(true);

    return new Promise((resolve) => {
      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.lang = navigator.language || "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let settled = false;
      const finish = (result: string | null, errorMessage?: string) => {
        if (settled) return;
        settled = true;
        setIsListening(false);
        if (errorMessage) setError(errorMessage);
        resolve(result);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        finish(transcript || null);
      };

      recognition.onerror = (event) => {
        console.error("SpeechRecognition error:", event.error, event.message);
        const message =
          event.error === "not-allowed"
            ? "Microphone access was denied."
            : event.error === "no-speech"
              ? "Didn't catch that — please try again."
              : event.error === "network"
                ? "Voice input needs a network connection. Please try again."
                : event.error === "audio-capture"
                  ? "No microphone was found."
                  : `Voice input failed (${event.error}). Please try again.`;
        finish(null, message);
      };

      recognition.onend = () => finish(null);

      recognition.start();
    });
  }, []);

  return { isSupported: isSpeechRecognitionSupported(), isListening, error, listen, stop };
};
