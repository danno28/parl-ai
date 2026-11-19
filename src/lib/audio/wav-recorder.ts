/**
 * Records the microphone in the browser and returns 16 kHz, 16-bit, mono WAV:
 * the format Azure's short-audio pronunciation API accepts. (MediaRecorder's WebM is not.)
 */
const TARGET_RATE = 16000;

const WORKLET = `
class Capture extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.port.postMessage(channel.slice(0));
    return true;
  }
}
registerProcessor("capture", Capture);
`;

export class MicrophoneDeniedError extends Error {
  constructor() {
    super("Microphone access was denied.");
    this.name = "MicrophoneDeniedError";
  }
}

export class WavRecorder {
  private context?: AudioContext;
  private stream?: MediaStream;
  private node?: AudioWorkletNode;
  private chunks: Float32Array[] = [];

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      throw new MicrophoneDeniedError();
    }
    this.context = new AudioContext();
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await this.context.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const source = this.context.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.context, "capture");
    this.chunks = [];
    this.node.port.onmessage = (e: MessageEvent<Float32Array>) => this.chunks.push(e.data);
    source.connect(this.node);
  }

  /** Stops recording and returns the WAV file and its duration in seconds. */
  async stop(): Promise<{ wav: Blob; seconds: number }> {
    const sampleRate = this.context?.sampleRate ?? TARGET_RATE;
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    await this.context?.close();

    const samples = downsample(concat(this.chunks), sampleRate, TARGET_RATE);
    this.chunks = [];
    return { wav: encodeWav(samples, TARGET_RATE), seconds: samples.length / TARGET_RATE };
  }

  cancel(): void {
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.context?.close();
    this.chunks = [];
  }
}

function concat(chunks: Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Averages input samples into each output sample (simple low-pass + decimation). */
function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true); // PCM chunk size
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); // byte rate
  v.setUint16(32, 2, true); // block align
  v.setUint16(34, 16, true); // bits per sample
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
