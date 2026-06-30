// AMA's voice. Primary: Kokoro — a small neural TTS that runs fully on-device
// (ONNX via transformers.js) and sounds genuinely human. Fallback: the browser's
// system voice, used automatically if Kokoro fails to load or synthesize, so AMA
// never goes silent.
//
// Speech is queued sentence-by-sentence so AMA can start talking while the rest
// of the answer is still streaming in. A speaking callback drives the half-duplex
// mic pause (so she doesn't hear herself).

import { KokoroTTS } from "kokoro-js";
import { speak as webSpeak, stopSpeaking as webStop } from "./speak";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICE = "af_heart"; // warm, natural American female; many others available

let ttsPromise: Promise<KokoroTTS> | null = null;
let useFallback = false;
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

const queue: string[] = [];
let playing = false;
let speakingCb: (on: boolean) => void = () => {};
let loadingCb: (on: boolean) => void = () => {};
let offTimer: ReturnType<typeof setTimeout> | null = null;

export function onTTSSpeaking(cb: (on: boolean) => void) {
  speakingCb = cb;
}

/** Notified true while the neural voice model is downloading/initializing. */
export function onVoiceLoading(cb: (on: boolean) => void) {
  loadingCb = cb;
}

// Debounce the "stopped speaking" signal so brief gaps between streamed
// sentences don't flap the mic on/off.
function signalSpeaking(on: boolean) {
  if (on) {
    if (offTimer) {
      clearTimeout(offTimer);
      offTimer = null;
    }
    speakingCb(true);
  } else {
    if (offTimer) clearTimeout(offTimer);
    offTimer = setTimeout(() => {
      offTimer = null;
      speakingCb(false);
    }, 350);
  }
}

function loadKokoro(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      // Prefer WebGPU (separate engine from Whisper's wasm — no contention, and
      // fast). If WebGPU isn't available, fall back to the wasm backend (q8 —
      // smaller download) rather than giving up to the robotic system voice.
      // fp32 (full precision) on WebGPU — clean audio. (fp16 on the GPU garbles
      // Kokoro's vocoder, which is what caused the distortion.) Larger one-time
      // download, but it sounds right. Falls back to wasm/q8 if WebGPU is absent.
      try {
        const m = await KokoroTTS.from_pretrained(MODEL, { dtype: "fp32", device: "webgpu" });
        console.log("[AMA tts] Kokoro voice ready (WebGPU/fp32)");
        return m;
      } catch (e1) {
        console.warn("[AMA tts] Kokoro WebGPU unavailable, trying wasm:", e1);
        const m = await KokoroTTS.from_pretrained(MODEL, { dtype: "q8", device: "wasm" });
        console.log("[AMA tts] Kokoro voice ready (wasm/q8)");
        return m;
      }
    })();
    loadingCb(true);
    ttsPromise.then(
      () => loadingCb(false),
      () => {
        loadingCb(false);
        ttsPromise = null; // both backends failed — don't cache the rejection
      },
    );
  }
  return ttsPromise;
}

/** Start downloading the Kokoro model in the background. */
export function preloadTTS() {
  loadKokoro().catch((e) => {
    console.error("[AMA tts] Kokoro load failed — using system voice:", e);
    useFallback = true;
  });
}

/** Queue a chunk of text to be spoken (in order). */
export function enqueueSpeech(text: string) {
  const t = text.trim();
  if (!t) return;
  queue.push(t);
  signalSpeaking(true);
  void processQueue();
}

async function processQueue() {
  if (playing) return;
  playing = true;
  while (queue.length) {
    const text = queue.shift()!;
    try {
      if (useFallback) await playWebSpeech(text);
      else await playKokoro(text);
    } catch (e) {
      console.error("[AMA tts] synthesis failed — falling back to system voice:", e);
      useFallback = true;
      try {
        await playWebSpeech(text);
      } catch {
        /* give up on this chunk */
      }
    }
  }
  playing = false;
  signalSpeaking(false);
}

async function playKokoro(text: string) {
  const tts = await loadKokoro();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = await tts.generate(text, { voice: VOICE });
  const pcm: Float32Array = out.audio ?? out.data;
  const rate: number = out.sampling_rate ?? 24000;
  await playPCM(pcm, rate);
}

function playPCM(pcm: Float32Array, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!audioCtx) audioCtx = new AudioContext();
    const buf = audioCtx.createBuffer(1, pcm.length, rate);
    buf.getChannelData(0).set(pcm);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.onended = () => {
      if (currentSource === src) currentSource = null;
      resolve();
    };
    currentSource = src;
    src.start();
  });
}

function playWebSpeech(text: string): Promise<void> {
  return new Promise((resolve) => webSpeak(text, { onEnd: () => resolve() }));
}

/** Stop everything: clear the queue and cut any playing audio. */
export function stopSpeech() {
  queue.length = 0;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      /* noop */
    }
    currentSource = null;
  }
  webStop();
  playing = false;
  if (offTimer) {
    clearTimeout(offTimer);
    offTimer = null;
  }
  speakingCb(false);
}
