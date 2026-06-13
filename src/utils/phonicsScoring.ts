import type { PhonicsLesson, VoiceSnapshot } from '../types';

interface ScoreResult {
  success: boolean;
  message: string;
  heardLabel?: string;
}

interface PhonemeAttemptInput {
  lesson: PhonicsLesson;
  samples: Float32Array | null;
  bestVoice: VoiceSnapshot;
  sampleRate?: number;
}

const DEFAULT_SAMPLE_RATE = 16000;

export function cleanSpeech(text: string) {
  return text.toLowerCase().replace(/[^a-z]/g, '');
}

export function getSoundLabel(soundClass: string) {
  if (soundClass === 'hissy') return 'hissy air';
  if (soundClass === 'open') return 'open voice';
  if (soundClass === 'pop') return 'quick pop';
  if (soundClass === 'voice') return 'voice';
  return 'quiet';
}

export function scorePhonemeAttempt({
  lesson,
  samples,
  bestVoice,
  sampleRate = DEFAULT_SAMPLE_RATE,
}: PhonemeAttemptInput): ScoreResult {
  if (!samples || samples.length === 0) {
    return {
      success: false,
      message: "Zibi could not hear anything. Try once more.",
      heardLabel: 'quiet',
    };
  }

  const durationMs = (samples.length / sampleRate) * 1000;
  const minimumMs = lesson.targetText === 't' || lesson.targetText === 'p' ? 160 : 360;
  if (durationMs < minimumMs) {
    return {
      success: false,
      message: 'That was very quick. Hold the sound a little longer.',
      heardLabel: getSoundLabel(bestVoice.soundClass),
    };
  }

  const stats = getAudioStats(samples);
  if (stats.rms < 0.012 && bestVoice.energy < 0.018) {
    return {
      success: false,
      message: 'Zibi needs a little more voice. Try closer to the microphone.',
      heardLabel: 'quiet',
    };
  }

  const target = cleanSpeech(lesson.targetText);
  const expected = lesson.expectedSoundClass;
  const detected = bestVoice.soundClass;
  let success = false;

  if (target === 's') {
    success = detected === 'hissy' || (stats.zcr > 0.18 && stats.rms > 0.012);
  } else if (target === 'm') {
    success = ['open', 'voice'].includes(detected) || (stats.zcr < 0.2 && stats.rms > 0.016);
  } else if (target === 'a') {
    success = ['open', 'voice'].includes(detected) || (stats.zcr < 0.22 && stats.rms > 0.018);
  } else if (target === 't' || target === 'p') {
    success = detected === 'pop' || stats.peak > 0.14 || (stats.rms > 0.04 && bestVoice.confidence > 0.45);
  }

  if (!success && expected) {
    success = detected === expected && bestVoice.score > 0.0015;
  }

  return {
    success,
    message: success
      ? `Yes. Zibi heard the ${lesson.displayText} sound.`
      : `${lesson.retryPrompt} Zibi heard ${getSoundLabel(detected)}.`,
    heardLabel: getSoundLabel(detected),
  };
}

export function scoreWordAttempt(lesson: PhonicsLesson, transcript: string): ScoreResult {
  const cleanTranscript = cleanSpeech(transcript);
  const target = cleanSpeech(lesson.targetText);

  if (!cleanTranscript) {
    return {
      success: false,
      message: 'Whisper did not hear a word. Try saying it once more.',
    };
  }

  const allowedMatches = [target, ...lesson.successMatches.map(cleanSpeech)].filter(Boolean);
  const exactOrContains = allowedMatches.some(match => (
    cleanTranscript === match || cleanTranscript.includes(match)
  ));
  const closeTarget = levenshtein(cleanTranscript, target) <= 1;
  const closeAllowed = allowedMatches.some(match => match.length >= 3 && levenshtein(cleanTranscript, match) <= 1);
  const success = exactOrContains || closeTarget || closeAllowed;

  return {
    success,
    message: success
      ? `Yes. Zibi heard ${lesson.targetText}.`
      : `Zibi heard "${transcript}". ${lesson.retryPrompt}`,
    heardLabel: transcript,
  };
}

function getAudioStats(samples: Float32Array) {
  let sumSq = 0;
  let crossings = 0;
  let peak = 0;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const abs = Math.abs(sample);
    sumSq += sample * sample;
    if (abs > peak) peak = abs;

    if (i > 0) {
      const prev = samples[i - 1];
      if ((sample >= 0 && prev < 0) || (sample < 0 && prev >= 0)) {
        crossings++;
      }
    }
  }

  return {
    rms: Math.sqrt(sumSq / samples.length),
    zcr: crossings / samples.length,
    peak,
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
