import { useEffect, useMemo, useState } from "react";
import { AGENTS, PERMISSIONS } from "./data";
import { DEFAULT_ACCENT } from "./theme";
import type { Agent, Permission } from "./types";
import { deriveAgents, derivePerms, greetingFor } from "./view";
import { hasHermes, hermesChat } from "./brain/hermes";
import { enqueueSpeech, stopSpeech, onTTSSpeaking, onVoiceLoading, onTTSLevel, preloadTTS, unlockAudio } from "./audio/tts";
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

  // ----- Brain: Hermes → Gemini -----
  const connected = hasHermes;
  const model = hasHermes ? "gemini · hermes" : "";
  const [reply, setReply] = useState(""); // live streaming assistant text
  const [youSaid, setYouSaid] = useState(""); // last thing the user said/typed
  const [thinking, setThinking] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [amaSpeaking, setAmaSpeaking] = useState(false); // TTS playing → pause mic
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0); // AMA's live speech amplitude

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

  // Wire TTS state callbacks into the UI.
  useEffect(() => {
    onTTSSpeaking(setAmaSpeaking);
    onVoiceLoading(setVoiceLoading);
    onTTSLevel(setVoiceLevel);
    preloadTTS();
  }, []);


  const toggleAgent = (i: number) =>
    setAgents((s) => s.map((a, idx) => (idx === i ? { ...a, on: !a.on } : a)));
  const togglePerm = (i: number) =>
    setPerms((s) => s.map((p, idx) => (idx === i ? { ...p, on: !p.on } : p)));

  // Ask AMA via Hermes → Gemini. Speak each sentence as the reply streams so she
  // reads it out directly instead of waiting for the whole answer.
  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    unlockAudio();
    setInput("");
    setYouSaid(q);
    stopSpeech();

    const doSpeak = speakReplies;
    setReply("");
    setThinking(true);

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
    const onToken = (chunk: string) => {
      setReply((r) => r + chunk);
      if (doSpeak) {
        sentenceBuf += chunk;
        flushSentences(false);
      }
    };

    try {
      if (!hasHermes) {
        const msg = "My brain (Hermes) isn't connected — launch the desktop app so the bridge is available.";
        setReply(msg);
        if (doSpeak) enqueueSpeech(msg);
        return;
      }
      await hermesChat(q, onToken);
      if (doSpeak) flushSentences(true);
    } catch {
      const err = "Something went wrong reaching my brain. Try again?";
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
          toggleListen={() => {
            unlockAudio();
            setListening((v) => !v);
          }}
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
          voiceLevel={voiceLevel}
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
