import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Web frontend for the AMA desktop app. Runs standalone in a browser during dev;
// later wrapped by Tauri (Phase 4). Fixed port so the Tauri shell can point at it.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  // transformers.js (local Whisper STT) ships its own ESM + wasm — don't pre-bundle.
  // (@ricky0123/vad-web is CommonJS; useVoice resolves its export via interop, and
  //  its model + the onnxruntime runtime load from a CDN — see useVoice.ts.)
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
