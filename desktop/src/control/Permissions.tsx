import type { PermView } from "../view";

const mono = "'JetBrains Mono', monospace";

interface Props {
  permViews: PermView[];
  togglePerm: (i: number) => void;
}

export function Permissions({ permViews, togglePerm }: Props) {
  return (
    <section style={{ animation: "floatUp .5s ease both", maxWidth: 760 }}>
      <h2 style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 600, letterSpacing: "-.01em" }}>Permissions</h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(234,241,238,.5)" }}>
        What AMA is allowed to touch on your behalf. High-risk scopes stay off by default — grant them deliberately.
      </p>
      <div style={{ border: "1px solid rgba(234,241,238,.07)", borderRadius: 15, background: "rgba(255,255,255,.022)", overflow: "hidden" }}>
        {permViews.map((p, i) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 18, padding: "17px 20px", borderBottom: "1px solid rgba(234,241,238,.05)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: ".08em", padding: "2px 7px", borderRadius: 6, color: p.riskColor, border: `1px solid ${p.riskBorder}` }}>
                  {p.risk}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(234,241,238,.5)" }}>{p.desc}</div>
            </div>
            <button
              onClick={() => togglePerm(i)}
              aria-label={`Toggle ${p.name}`}
              style={{
                position: "relative",
                width: 42,
                height: 24,
                borderRadius: 13,
                border: "none",
                cursor: "pointer",
                flex: "none",
                transition: "background .25s",
                background: p.trackBg,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: 0,
                  transform: `translateX(${p.knobX})`,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  transition: "transform .3s cubic-bezier(.34,1.7,.5,1)",
                  background: p.knobBg,
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
