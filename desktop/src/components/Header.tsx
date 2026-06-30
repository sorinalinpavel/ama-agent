import { ACCENTS } from "../theme";
import type { Screen } from "../App";

interface Props {
  accent: string;
  setAccent: (c: string) => void;
  screen: Screen;
  goConsole: () => void;
  goControl: () => void;
  activeCount: number;
  time: string;
  model: string;
  connected: boolean;
}

const mono = "'JetBrains Mono', monospace";

export function Header({
  accent,
  setAccent,
  screen,
  goConsole,
  goControl,
  activeCount,
  time,
  model,
  connected,
}: Props) {
  const tabBg = (on: boolean) => (on ? "rgba(255,255,255,.07)" : "transparent");
  const tabCol = (on: boolean) => (on ? "#eaf1ee" : "rgba(234,241,238,.55)");

  return (
    <header
      style={{
        position: "relative",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 62,
        padding: "0 26px",
        borderBottom: "1px solid rgba(234,241,238,.07)",
        flex: "none",
      }}
    >
      {/* brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "var(--ac,#3dff99)",
            boxShadow: "0 0 12px var(--ac,#3dff99)",
            animation: "blink 2.4s ease-in-out infinite",
            animationPlayState: "var(--anim,running)",
          }}
        />
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: ".22em" }}>
          AMA
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 11,
            color: connected ? "rgba(234,241,238,.4)" : "#ff6b6b",
            letterSpacing: ".05em",
          }}
          title={connected ? `Running ${model} locally via Ollama` : "Local brain offline — start Ollama"}
        >
          // {connected ? `${model || "online"}` : "offline"}
        </span>
      </div>

      {/* screen tabs */}
      <div
        style={{
          display: "flex",
          gap: 3,
          padding: 3,
          border: "1px solid rgba(234,241,238,.09)",
          borderRadius: 13,
          background: "rgba(255,255,255,.02)",
        }}
      >
        <button
          onClick={goConsole}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: ".02em",
            transition: "all .2s",
            background: tabBg(screen === "console"),
            color: tabCol(screen === "console"),
          }}
        >
          Console
        </button>
        <button
          onClick={goControl}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: ".02em",
            transition: "all .2s",
            background: tabBg(screen === "control"),
            color: tabCol(screen === "control"),
          }}
        >
          Control
          <span
            style={{
              fontFamily: mono,
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 6,
              background: "color-mix(in srgb,var(--ac,#3dff99) 16%,transparent)",
              color: "var(--ac,#3dff99)",
            }}
          >
            {activeCount}
          </span>
        </button>
      </div>

      {/* theme + clock + avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          minWidth: 200,
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 9px",
            border: "1px solid rgba(234,241,238,.09)",
            borderRadius: 11,
            background: "rgba(255,255,255,.02)",
          }}
        >
          {ACCENTS.map((c) => {
            const active = accent.toLowerCase() === c;
            return (
              <button
                key={c}
                onClick={() => setAccent(c)}
                title="Theme"
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  cursor: "pointer",
                  padding: 0,
                  background: c,
                  border: `2px solid ${active ? "#eaf1ee" : "transparent"}`,
                  boxShadow: `0 0 8px ${active ? c : "transparent"}`,
                  transition: "all .2s",
                }}
              />
            );
          })}
        </div>
        <span
          style={{
            fontFamily: mono,
            fontSize: 13,
            color: "rgba(234,241,238,.55)",
            letterSpacing: ".04em",
          }}
        >
          {time}
        </span>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 30%,transparent)",
            background: "color-mix(in srgb,var(--ac,#3dff99) 8%,transparent)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ac,#3dff99)",
          }}
        >
          A
        </span>
      </div>
    </header>
  );
}
