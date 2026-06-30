import { VITALS } from "../data";
import { buildWaveBars } from "../view";

const mono = "'JetBrains Mono', monospace";
const WAVE = buildWaveBars();
const panel = {
  border: "1px solid rgba(234,241,238,.08)",
  borderRadius: 13,
  background: "rgba(255,255,255,.022)",
  backdropFilter: "blur(8px)",
  padding: "13px 14px",
} as const;
const label = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontFamily: mono,
  fontSize: 9,
  letterSpacing: ".16em",
  color: "rgba(234,241,238,.42)",
} as const;
const dot = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "var(--ac,#3dff99)",
  boxShadow: "0 0 6px var(--ac,#3dff99)",
} as const;

export function HudLeft({ model }: { model: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 94,
        width: 198,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 2,
      }}
    >
      {/* system vitals */}
      <div style={panel}>
        <div style={{ ...label, marginBottom: 12 }}>
          <span style={dot} />
          SYSTEM VITALS
        </div>
        {VITALS.map((vt) => (
          <div key={vt.k} style={{ marginBottom: 9 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: mono,
                fontSize: 10,
                color: "rgba(234,241,238,.55)",
                marginBottom: 5,
              }}
            >
              <span>{vt.k}</span>
              <span style={{ color: "var(--ac,#3dff99)" }}>{vt.v}</span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 3,
                background: "rgba(234,241,238,.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: vt.w,
                  borderRadius: 3,
                  background:
                    "linear-gradient(90deg,color-mix(in srgb,var(--ac,#3dff99) 45%,transparent),var(--ac,#3dff99),color-mix(in srgb,var(--ac,#3dff99) 45%,transparent))",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.2s linear infinite",
                  animationPlayState: "var(--anim,running)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* core load donut */}
      <div style={{ ...panel, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 66, height: 66, flex: "none" }}>
          <svg width="66" height="66" viewBox="0 0 66 66" style={{ position: "absolute", inset: 0 }}>
            <circle cx="33" cy="33" r="28" fill="none" stroke="rgba(234,241,238,.1)" strokeWidth="4" />
            <circle
              cx="33"
              cy="33"
              r="28"
              fill="none"
              stroke="var(--ac,#3dff99)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="109 176"
              transform="rotate(-90 33 33)"
              style={{ filter: "drop-shadow(0 0 4px var(--ac,#3dff99))" }}
            />
          </svg>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 500,
              color: "#eaf1ee",
            }}
          >
            62
          </span>
        </div>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: ".14em", color: "rgba(234,241,238,.42)", marginBottom: 5 }}>
            CORE LOAD
          </div>
          <div style={{ fontSize: 13, color: "#eaf1ee" }}>Nominal</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.4)", marginTop: 2 }}>
            ollama · {model || "—"}
          </div>
        </div>
      </div>

      {/* neural activity */}
      <div style={panel}>
        <div style={{ ...label, marginBottom: 11 }}>
          <span style={dot} />
          NEURAL ACTIVITY
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 38 }}>
          {WAVE.map((wb, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: "100%",
                borderRadius: 2,
                background: "color-mix(in srgb,var(--ac,#3dff99) 80%,transparent)",
                transformOrigin: "bottom",
                transform: "scaleY(.3)",
                animation: "bars 1.2s ease-in-out infinite",
                animationDelay: wb.delay,
                animationPlayState: "var(--anim,running)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
