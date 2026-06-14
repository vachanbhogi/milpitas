const WAV_HEADER_BYTES = 44;
const PCM_FORMAT = 1;
const PCM_BIT_DEPTH = 16;
const CHILD_NARRATION_RATE = 0.85;
const CHILD_PHONICS_RATE = 0.75;
const CHILD_PHONICS_PITCH = 1.35;
const NARRATION_EMOJI_PATTERN = /🔊|✏️|🔓|🔒|✨|⭐️|🎉|🪐|💫|🎨|🚀|🛸|🏆|🏅|👑|🔔/g;
const HELD_PHONEME_PATTERN = /\b([smpalrt])\1{2,}\b/gi;
const POST_PHONEME_SOUND_LABEL_PATTERN = /^\s+sound\b[!?.]?/i;
const PHONEME_AUDIO_DELAY_MS = 850;

type NarrationSegment =
  | { type: 'text'; value: string }
  | { type: 'phoneme'; value: string };

type AudioContextRequest = Promise<AudioContext | null>;

let audioCtx: AudioContext | null = null;
let narrationSequence = 0;
const activeUtterances = new Set<SpeechSynthesisUtterance>();

/**
 * Resamples an AudioBuffer to 16kHz mono using OfflineAudioContext.
 */
export async function resampleTo16kHzMono(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    1,
    audioBuffer.duration * 16000,
    16000
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineCtx.destination);
  bufferSource.start();

  return await offlineCtx.startRendering();
}

/**
 * Encodes a mono 16kHz AudioBuffer to a 16-bit PCM WAV ArrayBuffer.
 */
export function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  return encodeMonoPcmWav(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
}

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextCtor = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error('Web Audio is not supported in this browser.');
    }
    audioCtx = new AudioContextCtor();
  }
  return audioCtx;
}

/**
 * Returns a running AudioContext, resuming it if suspended.
 * Must be called from within a user-gesture handler or after one.
 */
export async function getRunningAudioContext(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}

let synthCtx: AudioContext | null = null;

async function getSynthCtx(): Promise<AudioContext | null> {
  const AudioContextCtor = window.AudioContext
    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!synthCtx || synthCtx.state === 'closed') {
    synthCtx = new AudioContextCtor();
  }
  if (synthCtx.state === 'suspended') {
    await synthCtx.resume();
  }
  return synthCtx;
}

export async function playSynthesizedPhonics(target: string): Promise<void> {
  const ctx = await getSynthCtx();
  if (!ctx) return;
  const cleanTarget = target.toLowerCase().trim();

  const createNoiseBuffer = (duration: number) => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playS = (timeOffset = 0, duration = 0.7) => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(duration + 0.1);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 6500;
    filter.Q.value = 2.0;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + timeOffset + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + timeOffset + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + timeOffset + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime + timeOffset);
    source.stop(ctx.currentTime + timeOffset + duration);
  };

  const playM = (timeOffset = 0, duration = 0.7) => {
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = 130;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 260;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2.0;
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    gain1.gain.value = 0.08;
    gain2.gain.value = 0.02;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    mainGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + timeOffset + 0.1);
    mainGain.gain.setValueAtTime(0.12, ctx.currentTime + timeOffset + duration - 0.1);
    mainGain.gain.linearRampToValueAtTime(0, ctx.currentTime + timeOffset + duration);
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);
    
    lfo.start(ctx.currentTime + timeOffset);
    osc1.start(ctx.currentTime + timeOffset);
    osc2.start(ctx.currentTime + timeOffset);
    lfo.stop(ctx.currentTime + timeOffset + duration);
    osc1.stop(ctx.currentTime + timeOffset + duration);
    osc2.stop(ctx.currentTime + timeOffset + duration);
  };

  const playA = (timeOffset = 0, duration = 0.7) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = 800;
    filter1.Q.value = 5;
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.value = 1150;
    filter2.Q.value = 5;
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    gain1.gain.value = 0.06;
    gain2.gain.value = 0.04;
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    mainGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + timeOffset + 0.08);
    mainGain.gain.setValueAtTime(0.08, ctx.currentTime + timeOffset + duration - 0.1);
    mainGain.gain.linearRampToValueAtTime(0, ctx.currentTime + timeOffset + duration);
    
    osc.connect(filter1);
    osc.connect(filter2);
    filter1.connect(gain1);
    filter2.connect(gain2);
    gain1.connect(mainGain);
    gain2.connect(mainGain);
    mainGain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + timeOffset);
    osc.stop(ctx.currentTime + timeOffset + duration);
  };

  const playT = (timeOffset = 0) => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(0.06);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 6500;
    filter.Q.value = 3.0;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime + timeOffset);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.05);
    
    const sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(450, ctx.currentTime + timeOffset);
    sine.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + timeOffset + 0.04);
    const sineGain = ctx.createGain();
    sineGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    sineGain.gain.setValueAtTime(0.1, ctx.currentTime + timeOffset);
    sineGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.04);
    
    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    sine.connect(sineGain);
    sineGain.connect(ctx.destination);
    
    source.start(ctx.currentTime + timeOffset);
    sine.start(ctx.currentTime + timeOffset);
    source.stop(ctx.currentTime + timeOffset + 0.06);
    sine.stop(ctx.currentTime + timeOffset + 0.06);
  };

  const playP = (timeOffset = 0) => {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 550;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    noiseGain.gain.setValueAtTime(0.05, ctx.currentTime + timeOffset);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.06);
    
    const sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(180, ctx.currentTime + timeOffset);
    sine.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + timeOffset + 0.08);
    const sineGain = ctx.createGain();
    sineGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    sineGain.gain.setValueAtTime(0.12, ctx.currentTime + timeOffset);
    sineGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.08);
    
    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    sine.connect(sineGain);
    sineGain.connect(ctx.destination);
    
    source.start(ctx.currentTime + timeOffset);
    sine.start(ctx.currentTime + timeOffset);
    source.stop(ctx.currentTime + timeOffset + 0.08);
    sine.stop(ctx.currentTime + timeOffset + 0.08);
  };

  // Dispatch play events
  if (cleanTarget === 's' || cleanTarget === 'ssss' || cleanTarget === '/s/') {
    playS();
    return 0.7;
  } else if (cleanTarget === 'm' || cleanTarget === 'mmmm' || cleanTarget === '/m/') {
    playM();
    return 0.7;
  } else if (cleanTarget === 'a' || cleanTarget === 'aaa' || cleanTarget === '/æ/' || cleanTarget === '/a/' || cleanTarget === '/ă/') {
    playA();
    return 0.7;
  } else if (cleanTarget === 't' || cleanTarget === '/t/') {
    playT();
    return 0.08;
  } else if (cleanTarget === 'p' || cleanTarget === '/p/') {
    playP();
    return 0.08;
  } else if (cleanTarget === 'sat') {
    playS(0, 0.35);
    playA(0.32, 0.35);
    playT(0.65);
    return 0.73;
  } else if (cleanTarget === 'mat') {
    playM(0, 0.35);
    playA(0.32, 0.35);
    playT(0.65);
    return 0.73;
  } else if (cleanTarget === 'pat') {
    playP(0);
    playA(0.12, 0.35);
    playT(0.45);
    return 0.53;
  } else {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanTarget);
      utterance.rate = CHILD_PHONICS_RATE;
      utterance.pitch = CHILD_PHONICS_PITCH;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio fallback is a best-effort experience.
    }
    return estimateSpeechDuration(cleanTarget);
  }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array): void {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    output.setInt16(offset, val, true);
  }
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeMonoPcmWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const channelCount = 1;
  const bytesPerSample = PCM_BIT_DEPTH / 8;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeWavHeader(view, {
    byteLength: samples.length * bytesPerSample,
    channelCount,
    sampleRate,
    bytesPerSample,
  });
  floatTo16BitPCM(view, WAV_HEADER_BYTES, samples);

  return buffer;
}

function writeWavHeader(
  view: DataView,
  options: { byteLength: number; channelCount: number; sampleRate: number; bytesPerSample: number }
): void {
  const { byteLength, channelCount, sampleRate, bytesPerSample } = options;
  const blockAlign = channelCount * bytesPerSample;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, PCM_BIT_DEPTH, true);
  writeString(view, 36, 'data');
  view.setUint32(40, byteLength, true);
}

/**
 * Encodes a raw Float32Array containing 16kHz mono audio into a 16-bit PCM WAV.
 */
export function encodeFloat32ArrayToWav(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  return encodeMonoPcmWav(samples, sampleRate);
}

/**
 * Uses SpeechSynthesis to read text instructions aloud for pre-literate children.
 */
export function speakText(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const sequenceId = ++narrationSequence;
  const segments = getNarrationSegments(text);

  if (segments.length === 1 && segments[0].type === 'text') {
    speakPlainText(segments[0].value);
    return;
  }

  const audioContextRequest = segments.some(segment => segment.type === 'phoneme')
    ? getRunningAudioContext().catch(() => null)
    : Promise.resolve(null);

  window.speechSynthesis.cancel();
  void playNarrationSegments(segments, sequenceId, audioContextRequest);
}

function getNarrationSegments(text: string): NarrationSegment[] {
  const clean = text.replace(NARRATION_EMOJI_PATTERN, '');
  const segments: NarrationSegment[] = [];
  let cursor = 0;

  for (const match of clean.matchAll(HELD_PHONEME_PATTERN)) {
    if (match.index === undefined) continue;

    if (match.index > cursor) {
      segments.push({ type: 'text', value: clean.slice(cursor, match.index) });
    }

    segments.push({ type: 'phoneme', value: match[1].toLowerCase() });

    const nextCursor = match.index + match[0].length;
    const soundLabel = clean.slice(nextCursor).match(POST_PHONEME_SOUND_LABEL_PATTERN);
    cursor = nextCursor + (soundLabel?.[0].length ?? 0);
  }

  if (cursor < clean.length) {
    segments.push({ type: 'text', value: clean.slice(cursor) });
  }

  return segments.filter(segment => segment.value.trim().length > 0);
}

async function playNarrationSegments(
  segments: NarrationSegment[],
  sequenceId: number,
  audioContextRequest: AudioContextRequest
): Promise<void> {
  for (const segment of segments) {
    if (sequenceId !== narrationSequence) return;

    if (segment.type === 'text') {
      await speakNarrationSegment(segment.value);
    } else {
      await playPhonemeNarrationSegment(segment.value, audioContextRequest);
    }
  }
}

function speakNarrationSegment(text: string): Promise<void> {
  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = CHILD_NARRATION_RATE;
    utterance.onend = () => {
      releaseUtterance(utterance);
      resolve();
    };
    utterance.onerror = () => {
      releaseUtterance(utterance);
      resolve();
    };
    retainUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  });
}

function speakPlainText(text: string): void {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = CHILD_NARRATION_RATE;
  utterance.onend = () => releaseUtterance(utterance);
  utterance.onerror = () => releaseUtterance(utterance);
  retainUtterance(utterance);
  window.speechSynthesis.speak(utterance);
}

function retainUtterance(utterance: SpeechSynthesisUtterance): void {
  activeUtterances.add(utterance);
}

function releaseUtterance(utterance: SpeechSynthesisUtterance): void {
  activeUtterances.delete(utterance);
}

async function playPhonemeNarrationSegment(phoneme: string, audioContextRequest: AudioContextRequest): Promise<void> {
  try {
    const ctx = await audioContextRequest;
    if (!ctx) throw new Error('Web Audio is unavailable.');
    const seconds = playSynthesizedPhonicsWithCtx(ctx, phoneme);
    await delay(Math.max(PHONEME_AUDIO_DELAY_MS, seconds * 1000));
  } catch {
    await speakNarrationSegment(`${phoneme} sound`);
  }
}

function estimateSpeechDuration(text: string): number {
  return Math.max(0.35, text.length * 0.045);
}

function delay(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, durationMs);
  });
}
