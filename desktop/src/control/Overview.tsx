import { ACTIVITY, VITALS } from "../data";
import type { AgentView } from "../view";

const mono = "'JetBrains Mono', monospace";

interface Props {
  agentViews: AgentView[];
  activeCount: number;
  agentsTotal: number;
  goAgents: () => void;
  model: string;
  connected: boolean;
}

export function Overview({ agentViews, activeCount, agentsTotal, goAgents, model, connected }: Props) {
  const stats = [
    { k: "MODEL", v: model || "—" },
    { k: "BRAIN", v: connected ? "online" : "offline" },
    { k: "AGENTS ACTIVE", v: `${activeCount} / ${agentsTotal}` },
    { k: "TASKS TODAY", v: "128" },
    { k: "IN QUEUE", v: "4" },
  ];

  return (
    <section style={{ animation: "floatUp .5s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 600, letterSpacing: "-.01em" }}>Overview</h2>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(234,241,238,.5)" }}>Everything AMA is doing, right now.</p>
        </div>
        <button
          onClick={goAgents}
          style={{
            padding: "9px 16px",
            borderRadius: 11,
            border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 32%,transparent)",
            background: "color-mix(in srgb,var(--ac,#3dff99) 9%,transparent)",
            color: "var(--ac,#3dff99)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Manage agents
        </button>
      </div>

      {/* stat tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 1,
          background: "rgba(234,241,238,.07)",
          border: "1px solid rgba(234,241,238,.07)",
          borderRadius: 15,
          overflow: "hidden",
          marginBottom: 26,
        }}
      >
        {stats.map((st) => (
          <div key={st.k} style={{ padding: "18px", background: "#070b0e" }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".1em", color: "rgba(234,241,238,.4)", marginBottom: 9 }}>
              {st.k}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={st.v}>{st.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 22 }}>
        {/* live agents */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".12em", color: "rgba(234,241,238,.4)", marginBottom: 13 }}>
            LIVE AGENTS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            {agentViews.map((a) => (
              <div key={a.name} style={{ padding: 16, border: `1px solid ${a.cardBorder}`, borderRadius: 14, background: "rgba(255,255,255,.022)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.statusColor, boxShadow: a.dotGlow }} />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.4)" }}>{a.role}</span>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: a.statusColor }}>{a.status}</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(234,241,238,.62)", lineHeight: 1.4, minHeight: 36 }}>{a.task}</p>
                <div style={{ height: 5, borderRadius: 4, background: "rgba(234,241,238,.08)", overflow: "hidden", marginBottom: 7 }}>
                  <div style={{ height: "100%", borderRadius: 4, width: a.progressW, background: a.barBg, backgroundSize: "200% 100%", animation: a.barAnim, animationPlayState: "var(--anim,running)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10, color: "rgba(234,241,238,.4)" }}>
                  <span>{a.progressLabel}</span>
                  <span>{a.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* resources + activity stream */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".12em", color: "rgba(234,241,238,.4)", marginBottom: 13 }}>
            SYSTEM RESOURCES
          </div>
          <div style={{ border: "1px solid rgba(234,241,238,.07)", borderRadius: 14, background: "rgba(255,255,255,.022)", padding: 16, marginBottom: 22 }}>
            {VITALS.map((vt) => (
              <div key={vt.k} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: "rgba(234,241,238,.55)", marginBottom: 6 }}>
                  <span>{vt.k}</span>
                  <span style={{ color: "var(--ac,#3dff99)" }}>{vt.v}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(234,241,238,.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: vt.w, borderRadius: 3, background: "linear-gradient(90deg,color-mix(in srgb,var(--ac,#3dff99) 45%,transparent),var(--ac,#3dff99),color-mix(in srgb,var(--ac,#3dff99) 45%,transparent))", backgroundSize: "200% 100%", animation: "shimmer 2.2s linear infinite", animationPlayState: "var(--anim,running)" }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: "rgba(234,241,238,.42)", paddingTop: 5, borderTop: "1px solid rgba(234,241,238,.06)" }}>
              <span>TOKENS/S</span>
              <span style={{ color: "#eaf1ee" }}>34 t/s</span>
            </div>
          </div>

          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".12em", color: "rgba(234,241,238,.4)", marginBottom: 13 }}>
            ACTIVITY STREAM
          </div>
          <div style={{ border: "1px solid rgba(234,241,238,.07)", borderRadius: 14, background: "rgba(255,255,255,.022)", overflow: "hidden" }}>
            {ACTIVITY.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "12px 15px", borderBottom: "1px solid rgba(234,241,238,.05)" }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(234,241,238,.36)", flex: "none", paddingTop: 1 }}>{ev.t}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ac,#3dff99)" }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{ev.agent}</span>
                    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: ".08em", color: "rgba(234,241,238,.4)" }}>{ev.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(234,241,238,.6)", lineHeight: 1.4 }}>{ev.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
