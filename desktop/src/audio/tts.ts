// AMA's voice: Gemini neural TTS via the Electron backend (server-side, natural,
// free). Falls back to the browser's system voice only if the Gemini bridge is
// absent. Speech is queued per chunk so AMA speaks as the reply streams in.

import { speak as webSpeak, stopSpeaking as webStop } from "./speak";

export const nlog = (m: string) => console.log("[AMA]", m);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gttsApi: ((text: string) => Promise<string | null>) | undefined =
  typeof window !== "undefined" ? (window as any).ama?.gtts : undefined;
const useGemini = !!gttsApi;
let geminiOk = useGemini; // flips off if Gemini fails (e.g., free-tier quota)

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let analyser: AnalyserNode | null = null;
let levelRaf: number | null = null;

const queue: string[] = [];
let playing = false;
let speakingCb: (on: boolean) => void = () => {};
let levelCb: (level: number) => void = () => {};
let offTimer: ReturnType<typeof setTimeout> | null = null;

export function onTTSSpeaking(cb: (on: boolean) => void) {
  speakingCb = cb;
}
export function onTTSLevel(cb: (level: number) => void) {
  levelCb = cb;
}
// Kept for API compatibility; Gemini TTS has no local model to download.
export function onVoiceLoading(_cb: (on: boolean) => void) {}

export function preloadTTS() {
  nlog(useGemini ? "voice: gemini neural tts" : "voice: system");
}

// Create/resume the audio context inside a user gesture — autoplay policies
// leave it suspended otherwise, so playback would be silent.
export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    /* noop */
  }
}

function startLevelLoop() {
  if (levelRaf != null || !analyser) return;
  const data = new Uint8Array(analyser.fftSize);
  const loop = () => {
    if (!analyser) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    levelCb(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
    levelRaf = requestAnimationFrame(loop);
  };
  loop();
}

function stopLevelLoop() {
  if (levelRaf != null) cancelAnimationFrame(levelRaf);
  levelRaf = null;
  levelCb(0);
}

// Debounce "stopped speaking" so brief gaps between chunks don't flap the mic.
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

/** Queue a chunk to be spoken, in order. */
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
      if (geminiOk) await playGemini(text);
      else await playWebSpeech(text);
    } catch {
      // Gemini failed (e.g., free-tier quota / 429). Switch to the system voice
      // for the rest of the session — always have sound, never mix voices.
      geminiOk = false;
      try {
        await playWebSpeech(text);
      } catch {
        /* drop this chunk */
      }
    }
  }
  playing = false;
  stopLevelLoop();
  signalSpeaking(false);
}

async function playGemini(text: string) {
  const b64 = await gttsApi!(text);
  if (!b64) throw new Error("no audio");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
  const pcm = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) pcm[i] = int16[i] / 32768;
  await playPCM(pcm, 24000);
}

async function playPCM(pcm: Float32Array, rate: number): Promise<void> {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch {
      /* noop */
    }
  }
  if (!analyser) {
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    analyser.connect(audioCtx.destination);
  }
  const ctx = audioCtx;
  return new Promise((resolve) => {
    const buf = ctx.createBuffer(1, pcm.length, rate);
    buf.getChannelData(0).set(pcm);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(analyser!);
    src.onended = () => {
      if (currentSource === src) currentSource = null;
      resolve();
    };
    currentSource = src;
    startLevelLoop();
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
  stopLevelLoop();
  playing = false;
  if (offTimer) {
    clearTimeout(offTimer);
    offTimer = null;
  }
  speakingCb(false);
}
