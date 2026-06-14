/**
 * Resamples an AudioBuffer to 16kHz mono using OfflineAudioContext.
 */
export async function resampleTo16kHzMono(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    1, // 1 channel (mono)
    audioBuffer.duration * 16000, // length in samples
    16000 // sample rate
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
  const numOfChan = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // 1 = Raw PCM
  const bitDepth = 16;
  
  const result = audioBuffer.getChannelData(0); // mono
  
  const buffer = new ArrayBuffer(44 + result.length * 2);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + result.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* chunk length */
  view.setUint32(40, result.length * 2, true);
  
  // Write PCM audio samples
  floatTo16BitPCM(view, 44, result);
  
  return buffer;
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

  // Helper for generating white noise
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
  } else if (cleanTarget === 'm' || cleanTarget === 'mmmm' || cleanTarget === '/m/') {
    playM();
  } else if (cleanTarget === 'a' || cleanTarget === 'aaa' || cleanTarget === '/æ/' || cleanTarget === '/a/' || cleanTarget === '/ă/') {
    playA();
  } else if (cleanTarget === 't' || cleanTarget === '/t/') {
    playT();
  } else if (cleanTarget === 'p' || cleanTarget === '/p/') {
    playP();
  } else if (cleanTarget === 'sat') {
    playS(0, 0.35);
    playA(0.32, 0.35);
    playT(0.65);
  } else if (cleanTarget === 'mat') {
    playM(0, 0.35);
    playA(0.32, 0.35);
    playT(0.65);
  } else if (cleanTarget === 'pat') {
    playP(0);
    playA(0.12, 0.35);
    playT(0.45);
  } else {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanTarget);
      utterance.rate = 0.75;
      utterance.pitch = 1.35;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio fallback is a best-effort experience.
    }
  }
}


function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    // 16-bit signed integer scaling
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    output.setInt16(offset, val, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes a raw Float32Array containing 16kHz mono audio into a 16-bit PCM WAV.
 */
export function encodeFloat32ArrayToWav(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const numOfChan = 1;
  const format = 1; // 1 = Raw PCM
  const bitDepth = 16;
  
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* chunk length */
  view.setUint32(40, samples.length * 2, true);
  
  // Write PCM audio samples
  floatTo16BitPCM(view, 44, samples);
  
  return buffer;
}

/**
 * Uses SpeechSynthesis to read text instructions aloud for pre-literate children.
 */
export function speakText(text: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const clean = text.replace(/🔊|✏️|🔓|🔒|✨|⭐️|🎉|🪐|💫|🎨|🚀|🛸|🏆|🏅|👑|🔔/g, ''); // strip emojis
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.85; // slightly slower speed for clarity
    window.speechSynthesis.speak(utterance);
  }
}
