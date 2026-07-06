const { app, BrowserWindow, session, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

function geminiKey() {
  try {
    const env = fs.readFileSync(path.join(os.homedir(), ".hermes", ".env"), "utf8");
    const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}

const DEV_URL = "http://localhost:1420";
const HERMES_BIN = path.join(os.homedir(), ".local", "bin", "hermes");

// Chromium (Electron) runs Kokoro/WebGPU fine — unlike the macOS WebKit webview.
app.commandLine.appendSwitch("enable-unsafe-webgpu");

// Run one agent turn through the Hermes CLI, streaming stdout back to the renderer.
ipcMain.handle("hermes:chat", (event, { id, prompt }) => {
  return new Promise((resolve) => {
    const proc = spawn(HERMES_BIN, ["-z", prompt], { env: process.env });
    let full = "";
    proc.stdout.on("data", (d) => {
      const s = d.toString();
      full += s;
      if (!event.sender.isDestroyed()) event.sender.send("hermes:token", id, s);
    });
    proc.on("close", () => resolve(full.trim()));
    proc.on("error", (e) => resolve(`I couldn't reach Hermes: ${e.message}`));
  });
});

const TTS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// Gemini neural TTS (server-side, free tier) → base64 PCM (L16 24kHz).
ipcMain.handle("gemini:tts", async (_e, text) => {
  const key = geminiKey();
  if (!key) return null;
  try {
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Sulafat" } } },
        },
      }),
    });
    const d = await res.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  } catch {
    return null;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 1080,
    minHeight: 720,
    title: "AMA",
    backgroundColor: "#04060a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.webContents.on("console-message", (_e, _level, message) => {
    console.log("[renderer]", message);
  });

  session.defaultSession.setPermissionRequestHandler((_wc, _permission, cb) => cb(true));
  session.defaultSession.setPermissionCheckHandler(() => true);

  if (process.env.ELECTRON_DEV) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
