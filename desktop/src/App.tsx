import { useEffect, useMemo, useRef, useState } from "react";
import { AGENTS, PERMISSIONS } from "./data";
import { DEFAULT_ACCENT } from "./theme";
import type { Agent, Permission } from "./types";
import { deriveAgents, derivePerms, greetingFor } from "./view";
import { chat, listModels, systemPrompt, type ChatMessage } from "./brain/ollama";
import { enqueueSpeech, stopSpeech, onTTSSpeaking, onVoiceLoading, preloadTTS } from "./audio/tts";
import { Header } from "./components/Header";
import { BootLoader } from "./components/BootLoader";
import { Background } from "./components/Background";
import { Console } from "./console/Console";
import { Control } from "./control/Control";

export type Screen = "console" | "control";
export type ControlTab = "overview" | "agents" | "permissions" | "activity";

const SETTINGS = {
  showGrid: true,
  showTelemetry: true,
  hudPanels: true,
  reduceMotion: false,
};

export function App() {
  const [loading, setLoading] = useState(true);
  const [loaderOut, setLoaderOut] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [screen, setScreen] = useState<Screen>("console");
  const [controlTab, setControlTab] = useState<ControlTab>("overview");
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [time, setTime] = useState("");
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [perms, setPerms] = useState<Permission[]>(PERMISSIONS);

  // ----- Brain (local Ollama) state -----
  const [model, setModel] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState(""); // live streaming assistant text
  const [youSaid, setYouSaid] = useState(""); // last thing the user said/typed
  const [thinking, setThinking] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [amaSpeaking, setAmaSpeaking] = useState(false); // TTS playing → pause mic
  const [voiceLoading, setVoiceLoading] = useState(false); // neural voice downloading
  const abortRef = useRef<AbortController | null>(null);

  // Clock.
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setTime(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Boot loader.
  useEffect(() => {
    const b1 = setTimeout(() => setLoaderOut(true), 2350);
    const b2 = setTimeout(() => setLoading(false), 3000);
    return () => {
      clearTimeout(b1);
      clearTimeout(b2);
    };
  }, []);

  // Route TTS speaking/loading state into App, and start downloading the neural
  // voice in the background NOW so it's ready before the first reply (no wait
  // when AMA actually speaks). Safe to preload: Kokoro runs on WebGPU, a separate
  // engine from Whisper's wasm STT, so they don't interfere.
  useEffect(() => {
    onTTSSpeaking(setAmaSpeaking);
    onVoiceLoading(setVoiceLoading);
    preloadTTS();
  }, []);

  // Discover the live local model from Ollama (and reconnect-poll while down).
  useEffect(() => {
    let stop = false;
    const find = async () => {
      const models = await listModels();
      if (stop) return;
      if (models.length) {
        // Prefer a llama3.1:8b if present, else the first available.
        const preferred =
          models.find((m) => m.includes("llama3.1:8b")) ?? models[0];
        setModel(preferred);
        setConnected(true);
      } else {
        setConnected(false);
      }
    };
    find();
    const poll = setInterval(find, 5000);
    return () => {
      stop = true;
      clearInterval(poll);
    };
  }, []);

  const toggleAgent = (i: number) =>
    setAgents((s) => s.map((a, idx) => (idx === i ? { ...a, on: !a.on } : a)));
  const togglePerm = (i: number) =>
    setPerms((s) => s.map((p, idx) => (idx === i ? { ...p, on: !p.on } : p)));

  // Ask AMA: stream the answer from the local model, then speak it.
  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setYouSaid(q); // show exactly what was captured/sent
    stopSpeech(); // cut any previous reply still being spoken

    const doSpeak = speakReplies;

    if (!connected || !model) {
      const msg =
        "I can't reach my local brain yet. Make sure Ollama is running (brew services start ollama).";
      setReply(msg);
      if (doSpeak) enqueueSpeech(msg);
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: q };
    const ctx = [...history, userMsg];
    setHistory(ctx);
    setReply("");
    setThinking(true);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt(model) },
      ...ctx,
    ];

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Speak sentence-by-sentence as the answer streams in, so AMA starts talking
    // almost immediately instead of after the whole reply is written.
    let sentenceBuf = "";
    const flushSentences = (final: boolean) => {
      if (!doSpeak) return;
      const parts = sentenceBuf.split(/(?<=[.!?…])\s+/);
      while (parts.length > 1) enqueueSpeech(parts.shift()!);
      sentenceBuf = parts[0] ?? "";
      if (final && sentenceBuf.trim()) {
        enqueueSpeech(sentenceBuf);
        sentenceBuf = "";
      }
    };

    try {
      const full = await chat(
        model,
        messages,
        (chunk) => {
          setReply((r) => r + chunk);
          if (doSpeak) {
            sentenceBuf += chunk;
            flushSentences(false);
          }
        },
        controller.signal,
      );
      if (doSpeak) flushSentences(true);
      setHistory((h) => [...h, { role: "assistant", content: full }]);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const err =
        "Something went wrong reaching the local model. Is Ollama still running?";
      setReply(err);
      if (doSpeak) enqueueSpeech(err);
    } finally {
      setThinking(false);
    }
  };

  const agentViews = useMemo(() => deriveAgents(agents), [agents]);
  const permViews = useMemo(() => derivePerms(perms), [perms]);
  const activeCount = agents.filter((a) => a.on).length;
  const greeting = greetingFor(new Date().getHours());
  const animState = SETTINGS.reduceMotion ? "paused" : "running";

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(130% 120% at 50% -10%,#0a1712 0%,#06090c 50%,#04060a 100%)",
        color: "#eaf1ee",
        fontFamily: "'Space Grotesk', sans-serif",
        ["--ac" as string]: accent,
        ["--anim" as string]: animState,
      }}
    >
      {SETTINGS.showGrid && <Background />}
      {loading && <BootLoader fadingOut={loaderOut} />}

      <Header
        accent={accent}
        setAccent={setAccent}
        screen={screen}
        goConsole={() => setScreen("console")}
        goControl={() => setScreen("control")}
        activeCount={activeCount}
        time={time}
        model={model}
        connected={connected}
      />

      {screen === "console" && (
        <Console
          greeting={greeting}
          listening={listening}
          toggleListen={() => setListening((v) => !v)}
          input={input}
          setInput={setInput}
          onSend={() => ask(input)}
          askText={ask}
          youSaid={youSaid}
          reply={reply}
          thinking={thinking}
          speakReplies={speakReplies}
          setSpeakReplies={setSpeakReplies}
          agentViews={agentViews}
          activeCount={activeCount}
          agentsTotal={agents.length}
          showHud={SETTINGS.hudPanels}
          showTelemetry={SETTINGS.showTelemetry}
          model={model}
          connected={connected}
          amaSpeaking={amaSpeaking}
          voiceLoading={voiceLoading}
        />
      )}

      {screen === "control" && (
        <Control
          tab={controlTab}
          setTab={setControlTab}
          agentViews={agentViews}
          permViews={permViews}
          toggleAgent={toggleAgent}
          togglePerm={togglePerm}
          activeCount={activeCount}
          agentsTotal={agents.length}
          model={model}
          connected={connected}
        />
      )}
    </div>
  );
}
