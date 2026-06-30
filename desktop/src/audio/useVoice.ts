import { useEffect, useRef, useState } from "react";
import * as vadWeb from "@ricky0123/vad-web";
import { preloadSTT, transcribe } from "../brain/stt";

// @ricky0123/vad-web is a pure-CommonJS package. Depending on how Vite serves it
// (raw CJS interop in dev vs. Rollup bundle in prod), `MicVAD` may sit on the
// module namespace or on its default export — resolve it from whichever exists.
const MicVAD: typeof import("@ricky0123/vad-web").MicVAD =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vadWeb as any).MicVAD ?? (vadWeb as any).default?.MicVAD;

type MicVADInstance = Awaited<ReturnType<typeof MicVAD.new>>;

export type VoiceStatus = "idle" | "requesting" | "on" | "denied" | "error";
export type VoicePhase = "idle" | "listening" | "transcribing";

export interface Voice {
  levels: number[]; // 0..1 rolling energy for the waveform
  speaking: boolean; // Silero says the user is speaking right now
  status: VoiceStatus;
  phase: VoicePhase;
  error: string | null; // human-readable detail when status is denied/error
}

export interface VoiceHandlers {
  /** Fires when a finished utterance has been transcribed. */
  onTranscript: (text: string) => void;
  /** Fires the instant speech starts — use for barge-in (stop TTS). */
  onSpeechStart?: () => void;
}

const BARS = 28;

// VAD worklet/model + the onnxruntime WASM load from jsDelivr (a trusted npm
// CDN), cached after first load. This sidesteps a Vite dev-server bug that
// mangles onnxruntime's dynamically-imported .mjs loaders when served locally.
// NOTE: only these runtime/model *binaries* come from the CDN — your audio and
// conversations never leave the machine. (Local-serving is a future polish.)
const VAD_ASSET_CDN = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/";
const ORT_WASM_CDN =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/dist/";

// Continuous conversational voice capture powered by Silero VAD (a small neural
// speech detector running on-device). It distinguishes actual speech from steady
// noise (AC hum, fans), so it reliably knows when you START and STOP talking —
// no loudness thresholds, no button press. On speech end it hands the 16kHz
// audio straight to local Whisper. Everything stays on the machine.
export function useVoice(active: boolean, handlers: VoiceHandlers, paused = false): Voice {
  const [levels, setLevels] = useState<number[]>(() => new Array(BARS).fill(0));
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const h = useRef(handlers);
  h.current = handlers;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const vadRef = useRef<MicVADInstance | null>(null);
  const ring = useRef<number[]>(new Array(BARS).fill(0));

  useEffect(() => {
    let cancelled = false;

    const pushLevel = (rms: number) => {
      const r = ring.current;
      r.push(Math.min(1, rms * 4)); // scale speech RMS into a visible range
      if (r.length > BARS) r.shift();
      setLevels([...r]);
    };

    const start = async () => {
      setStatus("requesting");
      setError(null);
      preloadSTT().catch(() => {}); // warm Whisper in the background
      try {
        // Mac Minis have no built-in mic — check a device exists before we try.
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasMic = devices.some((d) => d.kind === "audioinput");
          if (!hasMic) {
            setStatus("error");
            setError(
              "No microphone detected. This Mac has no built-in mic — connect a USB mic, webcam, or AirPods, then choose it in System Settings → Sound → Input.",
            );
            return;
          }
        }
        const vad = await MicVAD.new({
          model: "v5",
          baseAssetPath: VAD_ASSET_CDN,
          onnxWASMBasePath: ORT_WASM_CDN,
          // Echo cancellation helps when not on headphones (bonus on top of the
          // half-duplex pause-while-speaking handled by the `paused` flag).
          getStream: () =>
            navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            }),
          onSpeechStart: () => {
            setSpeaking(true);
            setError(null); // clear any prior "didn't catch that" message
            h.current.onSpeechStart?.(); // barge-in
          },
          onVADMisfire: () => setSpeaking(false),
          onFrameProcessed: (_probs, frame) => {
            let sum = 0;
            for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
            pushLevel(Math.sqrt(sum / frame.length));
          },
          onSpeechEnd: async (audio: Float32Array) => {
            setSpeaking(false);
            setPhase("transcribing");
            try {
              const text = await transcribe(audio);
              if (text) {
                setError(null);
                h.current.onTranscript(text);
              } else {
                // Whisper ran but produced no words.
                setError("Heard you, but couldn't make out any words — speak a bit louder/closer and try again.");
              }
            } catch (e) {
              console.error("[AMA voice] transcription failed:", e);
              setError(`Transcription failed: ${(e as Error)?.name ?? "Error"} — ${(e as Error)?.message ?? e}`);
            } finally {
              if (!cancelled) setPhase("listening");
            }
          },
        });
        if (cancelled) {
          vad.destroy();
          return;
        }
        vadRef.current = vad;
        vad.start();
        // Respect a paused request that arrived while we were initializing.
        if (pausedRef.current) vad.pause();
        setStatus("on");
        setPhase("listening");
      } catch (err) {
        if (cancelled) return;
        const e = err as { name?: string; message?: string };
        const name = e?.name ?? "";
        const msg = String(e?.message ?? err);
        // Log the real error so it's visible in the console for debugging.
        console.error("[AMA voice] mic/VAD init failed:", err);
        if (name === "NotAllowedError" || /permission|denied/i.test(msg)) {
          setStatus("denied");
          setError("Microphone blocked. Allow it in the browser, and in macOS System Settings → Privacy & Security → Microphone (enable your browser).");
        } else if (name === "NotFoundError" || /not.?found|no .*audio|device/i.test(msg)) {
          setStatus("error");
          setError("No microphone found. Connect a mic (USB/webcam/AirPods) and select it in System Settings → Sound → Input.");
        } else {
          // Not a mic problem — surface the actual error (worklet/model/etc.).
          setStatus("error");
          setError(`Voice init failed: ${name || "Error"} — ${msg}`);
        }
      }
    };

    const stop = () => {
      vadRef.current?.destroy();
      vadRef.current = null;
      ring.current = new Array(BARS).fill(0);
      setLevels(new Array(BARS).fill(0));
      setSpeaking(false);
      setStatus("idle");
      setPhase("idle");
      setError(null);
    };

    if (active) start();
    else stop();

    return () => {
      cancelled = true;
      vadRef.current?.destroy();
      vadRef.current = null;
    };
  }, [active]);

  // Half-duplex: pause the VAD while AMA is speaking, resume when she's done.
  useEffect(() => {
    const vad = vadRef.current;
    if (!vad) return;
    if (paused) {
      vad.pause();
      setSpeaking(false);
    } else {
      vad.start();
    }
  }, [paused]);

  return { levels, speaking, status, phase, error };
}
