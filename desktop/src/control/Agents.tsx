import type { AgentView } from "../view";

const mono = "'JetBrains Mono', monospace";

interface Props {
  agentViews: AgentView[];
  toggleAgent: (i: number) => void;
}

export function Agents({ agentViews, toggleAgent }: Props) {
  return (
    <section style={{ animation: "floatUp .5s ease both" }}>
      <h2 style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 600, letterSpacing: "-.01em" }}>Sub-agents</h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(234,241,238,.5)" }}>
        Enable, pause, and inspect what each specialist can do. They all share one local model.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {agentViews.map((a, i) => (
          <div
            key={a.name}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 20,
              padding: "18px 20px",
              border: `1px solid ${a.cardBorder}`,
              borderRadius: 15,
              background: "rgba(255,255,255,.022)",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "color-mix(in srgb,var(--ac,#3dff99) 9%,transparent)",
                border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 22%,transparent)",
                fontSize: 17,
                fontWeight: 600,
                color: "var(--ac,#3dff99)",
              }}
            >
              {a.initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{a.name}</span>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: a.statusColor }}>
                  ● {a.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(234,241,238,.55)", marginBottom: 9 }}>{a.task}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {a.caps.map((c) => (
                  <span key={c} style={{ fontFamily: mono, fontSize: 10, padding: "3px 9px", borderRadius: 7, background: "rgba(234,241,238,.05)", color: "rgba(234,241,238,.6)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => toggleAgent(i)}
              aria-label={`Toggle ${a.name}`}
              style={{
                position: "relative",
                width: 42,
                height: 24,
                borderRadius: 13,
                border: "none",
                cursor: "pointer",
                flex: "none",
                transition: "background .25s",
                background: a.trackBg,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: 0,
                  transform: `translateX(${a.knobX})`,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  transition: "transform .3s cubic-bezier(.34,1.7,.5,1)",
                  background: a.knobBg,
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
