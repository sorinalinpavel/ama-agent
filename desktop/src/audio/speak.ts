// Text-to-speech via the browser's built-in SpeechSynthesis, but choosing the
// BEST available on-device voice rather than the robotic default. On macOS this
// means it'll prefer Premium/Enhanced/Neural system voices (Ava, Zoe, Samantha…)
// if installed — far more natural, still fully local and free.
//
// To get an even better voice: macOS → System Settings → Accessibility →
// Spoken Content → System Voice → Manage Voices… → download a "Premium" voice
// (e.g. "Ava (Premium)"). It then shows up here automatically.
//
// For a truly human, neural voice fully offline, the next upgrade is Kokoro
// (local neural TTS) — see the project notes.

let cached: SpeechSynthesisVoice | null = null;
let preferredName: string | null = null;

function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/premium|enhanced|neural/.test(n)) s += 100; // high-quality variants
  if (/\b(ava|zoe|samantha|allison|evan|tom|nicky|serena|siri)\b/.test(n)) s += 25;
  if (v.lang.toLowerCase().startsWith("en")) s += 10;
  if (v.localService) s += 5; // on-device, not cloud
  // De-prioritise the classic robotic novelty voices.
  if (/(albert|zarvox|trinoids|cellos|bells|bad news|jester|organ|bahh|boing|wobble|whisper)/.test(n))
    s -= 100;
  return s;
}

function bestVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  if (preferredName) {
    const exact = voices.find((v) => v.name === preferredName);
    if (exact) return exact;
  }
  return voices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
}

// Voices load asynchronously — refresh the cache when they arrive.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const refresh = () => {
    cached = bestVoice();
  };
  refresh();
  window.speechSynthesis.onvoiceschanged = refresh;
}

/** Names of available voices (for a future voice picker in the UI). */
export function listVoices(): string[] {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices().map((v) => v.name);
}

/** Override the auto-pick with a specific voice name. */
export function setPreferredVoice(name: string) {
  preferredName = name;
  cached = bestVoice();
}

export function speak(text: string, opts?: { onStart?: () => void; onEnd?: () => void }) {
  if (!("speechSynthesis" in window)) {
    opts?.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel(); // don't let replies overlap
  const u = new SpeechSynthesisUtterance(text);
  const voice = cached ?? bestVoice();
  if (voice) u.voice = voice;
  // Slightly slower + natural pitch reads less robotic than the default.
  u.rate = 0.97;
  u.pitch = 1.0;
  // Fire callbacks so the caller can pause the mic while AMA speaks (half-duplex).
  u.onstart = () => opts?.onStart?.();
  u.onend = () => opts?.onEnd?.();
  u.onerror = () => opts?.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
