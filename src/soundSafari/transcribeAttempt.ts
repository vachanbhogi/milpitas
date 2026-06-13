import { transcribeWithWhisper } from './whisperClient';

export type TranscriptionSource = 'browser' | 'whisper' | 'none';

export interface TranscriptionResult {
  transcript: string;
  source: TranscriptionSource;
}

interface TranscribeAttemptInput {
  samples: Float32Array;
  getBrowserTranscript: () => string;
  isServerConnected: boolean;
  targetText: string;
}

const WHISPER_TIMEOUT_MS = 6000;
const BROWSER_SR_SETTLE_MS = 1000;

export async function transcribeAttempt({
  samples,
  getBrowserTranscript,
  isServerConnected,
  targetText,
}: TranscribeAttemptInput): Promise<TranscriptionResult> {
  if (!samples || samples.length === 0) {
    return { transcript: '', source: 'none' };
  }

  // Give browser speech recognition time to finalize after stop.
  await new Promise((resolve) => setTimeout(resolve, BROWSER_SR_SETTLE_MS));

  const trimmedBrowser = getBrowserTranscript().trim();
  if (trimmedBrowser) {
    return { transcript: trimmedBrowser, source: 'browser' };
  }

  if (isServerConnected) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), WHISPER_TIMEOUT_MS)
      );
      const transcript = await Promise.race([
        transcribeWithWhisper(samples),
        timeoutPromise,
      ]);
      const match = transcript.toLowerCase().trim() === targetText.toLowerCase().trim();
      console.log(
        `[Whisper Flow] expected: "${targetText}" | heard: "${transcript}" | ${match ? '✅ MATCH' : '❌ NO MATCH'}`
      );
      if (transcript) {
        return { transcript, source: 'whisper' };
      }
    } catch (error) {
      console.error('[Whisper Flow] Error during transcription:', error);
      // Whisper unavailable or timed out — fall through to none.
    }
  }

  return { transcript: '', source: 'none' };
}

export function getHeardLabel(source: TranscriptionSource): string {
  if (source === 'browser') return 'Browser heard';
  if (source === 'whisper') return 'Whisper heard';
  return 'Zibi heard';
}
