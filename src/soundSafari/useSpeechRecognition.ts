import { useCallback, useRef } from 'react';

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0?: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');
  const sessionRef = useRef(0);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) return;

    try {
      const sessionId = sessionRef.current + 1;
      sessionRef.current = sessionId;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: { results: ArrayLike<{ 0?: { transcript: string } }> }) => {
        if (sessionRef.current !== sessionId) return;
        const result = event.results[event.results.length - 1];
        if (result?.[0]) {
          transcriptRef.current = result[0].transcript;
        }
      };

      rec.onerror = () => {
        // Browser SR errors are non-fatal; Whisper may still succeed.
      };

      transcriptRef.current = '';
      recognitionRef.current = rec;
      rec.start();
    } catch {
      // SpeechRecognition unavailable in this browser context.
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Already stopped.
    }
  }, []);

  const getTranscript = useCallback(() => transcriptRef.current, []);

  const resetTranscript = useCallback(() => {
    sessionRef.current += 1;
    transcriptRef.current = '';
  }, []);

  return {
    startRecognition,
    stopRecognition,
    getTranscript,
    resetTranscript,
  };
}
