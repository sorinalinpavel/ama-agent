import type { AgentView } from "../view";

const mono = "'JetBrains Mono', monospace";
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

export function HudRight({ agentViews }: { agentViews: AgentView[] }) {
  const mini = agentViews.slice(0, 4);
  return (
    <div
      style={{
        position: "absolute",
        right: 26,
        top: 94,
        width: 198,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 2,
      }}
    >
      {/* active agents */}
      <div style={panel}>
        <div style={{ ...label, marginBottom: 12 }}>
          <span style={dot} />
          ACTIVE AGENTS
        </div>
        {mini.map((am) => (
          <div key={am.name} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                flex: "none",
                background: am.statusColor,
                boxShadow: am.dotGlow,
              }}
            />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#eaf1ee" }}>
              {am.name}
            </span>
            <span style={{ fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.42)" }}>
              {am.progressLabel}
            </span>
          </div>
        ))}
      </div>

      {/* uplink */}
      <div style={panel}>
        <div style={{ ...label, marginBottom: 10 }}>
          <span style={dot} />
          UPLINK
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.55)", marginBottom: 4 }}>
          <span>LATENCY</span>
          <span style={{ color: "var(--ac,#3dff99)" }}>920ms</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.55)" }}>
          <span>TOKENS/S</span>
          <span style={{ color: "var(--ac,#3dff99)" }}>34 t/s</span>
        </div>
        <svg viewBox="0 0 170 32" preserveAspectRatio="none" style={{ width: "100%", height: 32, marginTop: 9, display: "block" }}>
          <polyline fill="none" stroke="color-mix(in srgb,var(--ac,#3dff99) 25%,transparent)" strokeWidth="1" points="0,30 170,30" />
          <polyline
            fill="none"
            stroke="var(--ac,#3dff99)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            points="0,22 18,16 34,20 52,9 70,15 88,5 106,13 124,4 142,11 160,7 170,12"
          />
        </svg>
      </div>

      {/* task queue */}
      <div style={panel}>
        <div style={{ ...label, marginBottom: 10 }}>
          <span style={dot} />
          TASK QUEUE
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9 }}>
          <span style={{ fontSize: 26, fontWeight: 600, color: "#eaf1ee" }}>4</span>
          <span style={{ fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.42)" }}>
            queued · 2 running
          </span>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <span style={{ flex: 2, height: 4, borderRadius: 2, background: "var(--ac,#3dff99)" }} />
          <span style={{ flex: 1, height: 4, borderRadius: 2, background: "color-mix(in srgb,var(--ac,#3dff99) 45%,transparent)" }} />
          <span style={{ flex: 4, height: 4, borderRadius: 2, background: "rgba(234,241,238,.1)" }} />
        </div>
      </div>
    </div>
  );
}
