import type { Voice } from "../audio/useVoice";

const mono = "'JetBrains Mono', monospace";

// Live mic waveform shown while listening. Bars react to real audio; the status
// line reflects requesting → listening → transcribing, and permission errors.
export function Waveform({ voice }: { voice: Voice }) {
  const { levels, status, speaking, phase, error } = voice;

  // A transient transcription message (set while status is still "on").
  const transientMsg = status === "on" && phase !== "transcribing" ? error : null;

  const statusText =
    status === "requesting"
      ? "Requesting microphone…"
      : status === "denied" || status === "error"
        ? error || (status === "denied" ? "Microphone blocked" : "No microphone found")
        : phase === "transcribing"
          ? "Transcribing…"
          : transientMsg
            ? transientMsg
            : speaking
              ? "Hearing you"
              : "Listening — just speak; I'll reply when you pause";

  const ok = status === "on";
  const isErr = status === "denied" || status === "error" || !!transientMsg;
  const accentText = phase === "transcribing" || speaking;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        width: "min(640px,92vw)",
        padding: "14px 18px",
        border: `1px solid ${
          accentText
            ? "color-mix(in srgb,var(--ac,#3dff99) 55%,transparent)"
            : "rgba(234,241,238,.12)"
        }`,
        borderRadius: 15,
        background: "rgba(255,255,255,.03)",
        backdropFilter: "blur(10px)",
        transition: "border-color .25s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: isErr ? "flex-start" : "center",
          gap: 8,
          fontFamily: mono,
          fontSize: isErr ? 12 : 11,
          letterSpacing: isErr ? "0" : ".12em",
          textTransform: isErr ? "none" : "uppercase",
          lineHeight: 1.45,
          textAlign: "left",
          color: isErr ? "#ff6b6b" : accentText ? "var(--ac,#3dff99)" : "rgba(234,241,238,.55)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            flex: "none",
            marginTop: isErr ? 4 : 0,
            background: isErr ? "#ff6b6b" : "var(--ac,#3dff99)",
            boxShadow: isErr ? "0 0 8px #ff6b6b" : "0 0 8px var(--ac,#3dff99)",
            animation:
              (ok && !speaking) || phase === "transcribing"
                ? "blink 1.6s ease-in-out infinite"
                : "none",
          }}
        />
        <span>{statusText}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          height: 56,
          width: "100%",
          opacity: ok ? 1 : 0.35,
        }}
      >
        {levels.map((v, i) => {
          const h = Math.max(3, v * 56);
          return (
            <span
              key={i}
              style={{
                flex: 1,
                maxWidth: 7,
                height: h,
                borderRadius: 3,
                background:
                  "linear-gradient(180deg,var(--ac,#3dff99),color-mix(in srgb,var(--ac,#3dff99) 45%,transparent))",
                boxShadow:
                  v > 0.25 ? "0 0 8px color-mix(in srgb,var(--ac,#3dff99) 60%,transparent)" : "none",
                transition: "height .06s linear",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
