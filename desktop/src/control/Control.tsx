import type { ControlTab } from "../App";
import type { AgentView, PermView } from "../view";
import { Overview } from "./Overview";
import { Agents } from "./Agents";
import { Permissions } from "./Permissions";
import { ActivityLog } from "./ActivityLog";

const mono = "'JetBrains Mono', monospace";

interface Props {
  tab: ControlTab;
  setTab: (t: ControlTab) => void;
  agentViews: AgentView[];
  permViews: PermView[];
  toggleAgent: (i: number) => void;
  togglePerm: (i: number) => void;
  activeCount: number;
  agentsTotal: number;
  model: string;
  connected: boolean;
}

const NAV: { key: ControlTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "agents", label: "Sub-agents" },
  { key: "permissions", label: "Permissions" },
  { key: "activity", label: "Activity log" },
];

export function Control({
  tab,
  setTab,
  agentViews,
  permViews,
  toggleAgent,
  togglePerm,
  activeCount,
  agentsTotal,
  model,
  connected,
}: Props) {
  return (
    <main style={{ position: "relative", zIndex: 2, flex: 1, minHeight: 0, display: "flex" }}>
      {/* sidebar */}
      <nav
        style={{
          flex: "none",
          width: 230,
          borderRight: "1px solid rgba(234,241,238,.07)",
          padding: "22px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".16em", color: "rgba(234,241,238,.34)", padding: "0 12px 12px" }}>
          ORCHESTRATOR
        </div>
        {NAV.map((n) => {
          const active = tab === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                transition: "all .18s",
                background: active ? "color-mix(in srgb,var(--ac,#3dff99) 12%,transparent)" : "transparent",
                color: active ? "#eaf1ee" : "rgba(234,241,238,.55)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: active ? "var(--ac,#3dff99)" : "rgba(234,241,238,.25)",
                }}
              />
              {n.label}
            </button>
          );
        })}
        <div
          style={{
            marginTop: "auto",
            padding: "14px 12px",
            border: "1px solid rgba(234,241,238,.07)",
            borderRadius: 13,
            background: "rgba(255,255,255,.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: connected ? "var(--ac,#3dff99)" : "#ff6b6b",
                boxShadow: connected ? "0 0 8px var(--ac,#3dff99)" : "0 0 8px #ff6b6b",
                animation: "blink 2s ease-in-out infinite",
                animationPlayState: "var(--anim,running)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {connected ? "Brain online" : "Brain offline"}
            </span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: "rgba(234,241,238,.4)" }}>
            {connected ? `ollama · ${model || "—"}` : "start ollama"}
          </div>
        </div>
      </nav>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "30px 36px" }}>
        {tab === "overview" && (
          <Overview
            agentViews={agentViews}
            activeCount={activeCount}
            agentsTotal={agentsTotal}
            goAgents={() => setTab("agents")}
            model={model}
            connected={connected}
          />
        )}
        {tab === "agents" && <Agents agentViews={agentViews} toggleAgent={toggleAgent} />}
        {tab === "permissions" && <Permissions permViews={permViews} togglePerm={togglePerm} />}
        {tab === "activity" && <ActivityLog />}
      </div>
    </main>
  );
}
