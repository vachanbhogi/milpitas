class PhonemeCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._totalSamples = 0;
    this._chunkSize = 512;

    this.port.onmessage = (event) => {
      if (event.data && event.data.command === 'stop') {
        const fullBuffer = this._flushBuffer();
        this.port.postMessage(
          { type: 'utterance', audio: fullBuffer },
          [fullBuffer.buffer]
        );
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    const channel = input[0];

    const copy = new Float32Array(channel);
    this._buffer.push(copy);
    this._totalSamples += copy.length;

    // Send a separate copy for live analysis; keep stored buffer intact for final utterance.
    this.port.postMessage({ type: 'chunk', audio: copy.slice() });

    return true;
  }

  _flushBuffer() {
    const full = new Float32Array(this._totalSamples);
    let offset = 0;
    for (const chunk of this._buffer) {
      full.set(chunk, offset);
      offset += chunk.length;
    }
    this._buffer = [];
    this._totalSamples = 0;
    return full;
  }
}

registerProcessor('phoneme-capture', PhonemeCaptureProcessor);
