import { encodeFloat32ArrayToWav } from '../audioUtils';

const WHISPER_URL = 'http://127.0.0.1:8080/inference';

export async function checkWhisperHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = window.setTimeout(() => controller.abort(), 1200);
    const res = await fetch(WHISPER_URL, {
      method: 'OPTIONS',
      signal: controller.signal,
    });
    window.clearTimeout(id);
    return res.ok || [400, 404, 405].includes(res.status);
  } catch {
    return false;
  }
}

export async function transcribeWithWhisper(
  samples: Float32Array,
): Promise<string> {
  const wavArrayBuffer = encodeFloat32ArrayToWav(samples);
  const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', wavBlob, 'earthlingo.wav');
  formData.append('response_format', 'json');

  const response = await fetch(
    WHISPER_URL,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Whisper returned ${response.status}`);
  }

  const data = await response.json();
  return String(data.text || data.result || '').trim();
}
