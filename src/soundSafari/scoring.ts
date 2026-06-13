import type { PhonicsLesson } from '../types';

export interface ScoreResult {
  success: boolean;
  message: string;
}

export function cleanSpeech(text: string) {
  return text.toLowerCase().replace(/[^a-z]/g, '');
}

function speechWords(text: string) {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

export function getSoundLabel(soundClass: string) {
  if (soundClass === 'hissy') return 'hissy air';
  if (soundClass === 'open') return 'open voice';
  if (soundClass === 'pop') return 'quick pop';
  if (soundClass === 'voice') return 'voice';
  return 'quiet';
}

/**
 * Score a word attempt using speech recognition transcript.
 * Generous matching — close enough counts for young learners.
 */
export function scoreWordAttempt(lesson: PhonicsLesson, transcript: string): ScoreResult {
  const cleanTranscript = cleanSpeech(transcript);
  const target = cleanSpeech(lesson.targetText);
  const transcriptWords = speechWords(transcript).map(cleanSpeech).filter(Boolean);

  if (!cleanTranscript) {
    return {
      success: false,
      message: 'Zibi did not hear a word. Try saying it once more.',
    };
  }

  const allowedMatches = [
    target,
    ...lesson.successMatches.map(cleanSpeech),
  ].filter(Boolean);

  const exactMatch = allowedMatches.some(match =>
    cleanTranscript === match || transcriptWords.includes(match)
  );

  const containsLongMatch = allowedMatches.some(match =>
    match.length >= 4 && cleanTranscript.includes(match)
  );

  const closeMatch = transcriptWords.some(word =>
    allowedMatches.some(match => {
      const maxDistance = match.length <= 3 ? 1 : 2;
      const startsRight = word.charAt(0) === match.charAt(0);
      return startsRight && levenshtein(word, match) <= maxDistance;
    })
  );

  const success = exactMatch || containsLongMatch || closeMatch;

  return {
    success,
    message: success
      ? `Yes! Zibi heard "${lesson.targetText}"! 🎉`
      : `Zibi heard "${transcript}". ${lesson.retryPrompt}`,
  };
}

function levenshtein(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}
