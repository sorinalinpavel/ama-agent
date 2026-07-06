const { contextBridge, ipcRenderer } = require("electron");

let seq = 0;

contextBridge.exposeInMainWorld("ama", {
  // Run a turn through the Hermes agent; streams stdout chunks via onToken.
  hermesChat: (prompt, onToken) => {
    const id = `${Date.now()}-${seq++}`;
    const listener = (_e, mid, chunk) => {
      if (mid === id) onToken(chunk);
    };
    ipcRenderer.on("hermes:token", listener);
    return ipcRenderer
      .invoke("hermes:chat", { id, prompt })
      .finally(() => ipcRenderer.removeListener("hermes:token", listener));
  },
  // Gemini neural TTS → base64 PCM (L16 24kHz), or null on failure.
  gtts: (text) => ipcRenderer.invoke("gemini:tts", text),
});
