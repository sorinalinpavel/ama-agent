import { ACTIVITY } from "../data";

const mono = "'JetBrains Mono', monospace";

export function ActivityLog() {
  return (
    <section style={{ animation: "floatUp .5s ease both", maxWidth: 820 }}>
      <h2 style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 600, letterSpacing: "-.01em" }}>Activity log</h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(234,241,238,.5)" }}>
        A full trace of every action AMA’s agents have taken today.
      </p>
      <div style={{ border: "1px solid rgba(234,241,238,.07)", borderRadius: 15, background: "rgba(255,255,255,.022)", overflow: "hidden" }}>
        {ACTIVITY.map((ev, i) => (
          <div key={i} style={{ display: "flex", gap: 16, padding: "15px 20px", borderBottom: "1px solid rgba(234,241,238,.05)" }}>
            <span style={{ fontFamily: mono, fontSize: 12, color: "rgba(234,241,238,.4)", flex: "none", width: 46, paddingTop: 2 }}>{ev.t}</span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ac,#3dff99)", flex: "none", marginTop: 6 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{ev.agent}</span>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".08em", padding: "1px 7px", borderRadius: 6, background: "rgba(234,241,238,.05)", color: "rgba(234,241,238,.5)" }}>
                  {ev.type}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(234,241,238,.62)", lineHeight: 1.45 }}>{ev.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
