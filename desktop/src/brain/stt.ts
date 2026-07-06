// Local speech-to-text with Whisper, running fully on-device via transformers.js
// (WASM/WebGPU). The model downloads once (~40MB for tiny.en) and is cached by
// the browser; nothing audio-related ever leaves the machine.

import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import { nlog } from "../audio/tts";

// base.en = noticeably better word accuracy than tiny.en, still fast on M4.
const MODEL = "Xenova/whisper-base.en";

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

/** Begin loading the model (call when the user first arms the mic). */
export function preloadSTT(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", MODEL, {
      // Use the unquantized (fp32) weights. The default quantized build uses
      // 4-bit "NBits" weights that the current onnxruntime-web can't load
      // ("Missing required scale … MatMulNBits"). fp32 is a bit larger but loads
      // reliably; tiny.en is small enough that it's fine.
      dtype: "fp32",
      device: "wasm",
    }) as unknown as Promise<AutomaticSpeechRecognitionPipeline>;
  }
  return transcriberPromise;
}

/** Transcribe 16kHz mono Float32 audio to text. */
export async function transcribe(audio: Float32Array): Promise<string> {
  nlog(`transcribe start (samples=${audio.length})`);
  try {
    const transcriber = await preloadSTT();
    const out = await transcriber(audio);
    const text = Array.isArray(out) ? out[0]?.text : out?.text;
    const t = (text ?? "").trim();
    nlog(`transcribe -> "${t}"`);
    return t;
  } catch (e) {
    nlog(`transcribe FAILED: ${(e as Error)?.message ?? e}`);
    throw e;
  }
}
