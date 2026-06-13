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
