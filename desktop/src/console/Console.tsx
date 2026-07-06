import { QUICK_ACTIONS } from "../data";
import type { AgentView } from "../view";
import { useVoice } from "../audio/useVoice";
import { stopSpeech } from "../audio/tts";
import { Reactor } from "./Reactor";
import { HudLeft } from "./HudLeft";
import { HudRight } from "./HudRight";
import { InputBar } from "./InputBar";
import { Waveform } from "./Waveform";

const mono = "'JetBrains Mono', monospace";

interface Props {
  greeting: string;
  listening: boolean;
  toggleListen: () => void;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  askText: (t: string) => void;
  youSaid: string;
  reply: string;
  thinking: boolean;
  speakReplies: boolean;
  setSpeakReplies: (v: boolean) => void;
  agentViews: AgentView[];
  activeCount: number;
  agentsTotal: number;
  showHud: boolean;
  showTelemetry: boolean;
  model: string;
  connected: boolean;
  amaSpeaking: boolean;
  voiceLoading: boolean;
  voiceLevel: number;
}

export function Console({
  greeting,
  listening,
  toggleListen,
  input,
  setInput,
  onSend,
  askText,
  youSaid,
  reply,
  thinking,
  speakReplies,
  setSpeakReplies,
  agentViews,
  activeCount,
  agentsTotal,
  showHud,
  showTelemetry,
  model,
  connected,
  amaSpeaking,
  voiceLoading,
  voiceLevel,
}: Props) {
  // Continuous conversation: auto-send on pause. Half-duplex — the mic is paused
  // while AMA is speaking (amaSpeaking) so she doesn't hear and interrupt herself.
  const voice = useVoice(
    listening,
    {
      onTranscript: (text) => askText(text),
      onSpeechStart: () => stopSpeech(),
    },
    amaSpeaking,
  );
  const pillText = listening
    ? voice.phase === "transcribing"
      ? "Transcribing…"
      : voice.speaking
        ? "Hearing you"
        : thinking
          ? "Thinking…"
          : "Listening… just speak"
    : thinking
      ? "Thinking…"
      : "Ready · tap mic to start talking";

  const showReply = thinking || reply.length > 0 || youSaid.length > 0;

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflowY: "auto",
        gap: 18,
        padding: "24px 24px 32px",
        animation: "floatUp .6s ease both",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,color-mix(in srgb,var(--ac,#3dff99) 13%,transparent) 0%,transparent 62%)",
          filter: "blur(20px)",
          pointerEvents: "none",
          animation: "breathe 7s ease-in-out infinite",
          animationPlayState: "var(--anim,running)",
        }}
      />

      {showHud && <HudLeft model={model} />}
      {showHud && <HudRight agentViews={agentViews} />}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--ac,#3dff99)",
            padding: "5px 13px",
            border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 26%,transparent)",
            borderRadius: 20,
            background: "color-mix(in srgb,var(--ac,#3dff99) 7%,transparent)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--ac,#3dff99)",
              boxShadow: "0 0 8px var(--ac,#3dff99)",
              animation: "blink 1.6s ease-in-out infinite",
              animationPlayState: "var(--anim,running)",
            }}
          />
          {pillText}
        </span>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.05 }}>
          {greeting}.
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "rgba(234,241,238,.5)" }}>
          All systems nominal · {activeCount} of {agentsTotal} agents online
        </p>
      </div>

      <Reactor listening={listening} speaking={amaSpeaking} level={voiceLevel} />

      {/* AMA's answer (streams in, and is spoken aloud) */}
      {showReply && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(640px,92vw)",
            maxHeight: 180,
            overflowY: "auto",
            padding: "14px 16px",
            border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 22%,transparent)",
            borderRadius: 15,
            background: "rgba(255,255,255,.03)",
            backdropFilter: "blur(10px)",
          }}
        >
          {youSaid && (
            <div style={{ marginBottom: 12, paddingBottom: 11, borderBottom: "1px solid rgba(234,241,238,.08)" }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".14em", color: "rgba(234,241,238,.4)", marginBottom: 4 }}>
                YOU SAID
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.45, color: "rgba(234,241,238,.82)" }}>{youSaid}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: mono, fontSize: 10, letterSpacing: ".14em", color: "var(--ac,#3dff99)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ac,#3dff99)", boxShadow: "0 0 6px var(--ac,#3dff99)" }} />
              AMA{thinking && reply.length === 0 ? " · thinking…" : ""}
              {voiceLoading ? " · preparing voice…" : ""}
            </span>
            <button
              onClick={() => {
                if (speakReplies) stopSpeech();
                setSpeakReplies(!speakReplies);
              }}
              title={speakReplies ? "Voice on — click to mute" : "Voice off — click to enable"}
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: ".1em",
                cursor: "pointer",
                padding: "3px 9px",
                borderRadius: 7,
                border: "1px solid rgba(234,241,238,.12)",
                background: speakReplies ? "color-mix(in srgb,var(--ac,#3dff99) 10%,transparent)" : "transparent",
                color: speakReplies ? "var(--ac,#3dff99)" : "rgba(234,241,238,.5)",
              }}
            >
              {speakReplies ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
            </button>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.5, color: "#eaf1ee", whiteSpace: "pre-wrap" }}>
            {reply}
            {thinking && <span style={{ opacity: 0.6 }}>▋</span>}
          </div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 9,
          maxWidth: 440,
        }}
      >
        {QUICK_ACTIONS.map((label) => (
          <button
            key={label}
            onClick={() => setInput(label)}
            className="qa-btn"
            style={{
              padding: "8px 15px",
              borderRadius: 11,
              border: "1px solid rgba(234,241,238,.1)",
              background: "rgba(255,255,255,.025)",
              color: "rgba(234,241,238,.78)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(listening || voice.phase === "transcribing") && <Waveform voice={voice} />}

      <InputBar
        input={input}
        setInput={setInput}
        onSend={onSend}
        listening={listening}
        toggleListen={toggleListen}
      />

      {showTelemetry && (
        <>
          <div
            style={{
              position: "absolute",
              left: 26,
              bottom: 22,
              fontFamily: mono,
              fontSize: 11,
              lineHeight: 1.7,
              color: "rgba(234,241,238,.32)",
            }}
          >
            <div>HOST&nbsp;&nbsp;mac-mini · m4</div>
            <div>BRAIN&nbsp;&nbsp;{connected ? "hermes · gemini" : "offline"}</div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 26,
              bottom: 22,
              textAlign: "right",
              fontFamily: mono,
              fontSize: 11,
              lineHeight: 1.7,
              color: "rgba(234,241,238,.32)",
            }}
          >
            <div>MODEL&nbsp;&nbsp;{model || "—"}</div>
            <div style={{ color: connected ? "var(--ac,#3dff99)" : "#ff6b6b" }}>
              {connected ? "● connected" : "○ disconnected"}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
