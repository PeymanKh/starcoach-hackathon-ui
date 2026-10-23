/**
 * Turn microphone samples into a small WAV file for speech-to-text:
 * mono, 16 kHz, 16-bit, which is what Whisper works at anyway (32 KB per second).
 */

const OUTPUT_RATE = 16_000;

export function encodeWav(chunks: Float32Array[], inputRate: number): Blob {
  const samples = downsample(chunks, inputRate, OUTPUT_RATE);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  // RIFF header + "fmt " chunk (PCM, mono, 16-bit) + "data" chunk
  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, OUTPUT_RATE, true);
  view.setUint32(28, OUTPUT_RATE * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample
  view.setUint16(34, 16, true); // bits per sample
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Average each window of input samples into one output sample (48 kHz → 16 kHz). */
function downsample(chunks: Float32Array[], inputRate: number, outputRate: number): Float32Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const input = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    input.set(chunk, offset);
    offset += chunk.length;
  }
  if (inputRate <= outputRate) return input;

  const ratio = inputRate / outputRate;
  const output = new Float32Array(Math.floor(total / ratio));
  for (let i = 0; i < output.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), total);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    output[i] = sum / Math.max(end - start, 1);
  }
  return output;
}

/** Seconds of audio recorded so far. */
export function durationSeconds(chunks: Float32Array[], sampleRate: number): number {
  return chunks.reduce((n, c) => n + c.length, 0) / sampleRate;
}

/**
 * True when the recording is basically silence. Whisper tends to invent text for silence,
 * so silent clips are never sent.
 */
export function isSilent(chunks: Float32Array[], threshold = 0.01): boolean {
  let sum = 0;
  let count = 0;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
    count += chunk.length;
  }
  return count === 0 || Math.sqrt(sum / count) < threshold;
}
