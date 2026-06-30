// Pure view-model helpers — port of the mockup's DCLogic.renderVals().
// Take raw state and produce the derived shapes the components render.

import type { Agent, Permission } from "./types";

export interface AgentView extends Agent {
  status: string;
  statusColor: string;
  dotGlow: string;
  cardBorder: string;
  progressW: string;
  progressLabel: string;
  barBg: string;
  barAnim: string;
  trackBg: string;
  knobX: string;
  knobBg: string;
}

export interface PermView extends Permission {
  riskColor: string;
  riskBorder: string;
  trackBg: string;
  knobX: string;
  knobBg: string;
}

export function deriveAgents(agents: Agent[]): AgentView[] {
  return agents.map((a) => {
    const status = a.on ? a.base : "Paused";
    const working = a.on && a.base === "Active" && a.progress > 0;
    const statusColor = !a.on
      ? "rgba(234,241,238,.4)"
      : a.base === "Active"
        ? "var(--ac,#3dff99)"
        : "#ffb454";
    return {
      ...a,
      status,
      statusColor,
      dotGlow: working ? "0 0 9px var(--ac,#3dff99)" : "none",
      cardBorder: working
        ? "color-mix(in srgb,var(--ac,#3dff99) 22%,transparent)"
        : "rgba(234,241,238,.07)",
      progressW: (a.on ? a.progress : 0) + "%",
      progressLabel: a.on
        ? a.progress > 0
          ? a.progress + "% complete"
          : "standing by"
        : "paused",
      barBg: working
        ? "linear-gradient(90deg,color-mix(in srgb,var(--ac,#3dff99) 55%,transparent),var(--ac,#3dff99),color-mix(in srgb,var(--ac,#3dff99) 55%,transparent))"
        : a.on
          ? "#ffb454"
          : "rgba(234,241,238,.2)",
      barAnim: working ? "shimmer 2s linear infinite" : "none",
      trackBg: a.on
        ? "color-mix(in srgb,var(--ac,#3dff99) 32%,transparent)"
        : "rgba(255,255,255,.09)",
      knobX: a.on ? "20px" : "2px",
      knobBg: a.on ? "var(--ac,#3dff99)" : "rgba(234,241,238,.5)",
    };
  });
}

const RISK_MAP: Record<string, string> = {
  High: "#ff6b6b",
  Medium: "#ffb454",
  Low: "rgba(234,241,238,.55)",
};

export function derivePerms(perms: Permission[]): PermView[] {
  return perms.map((p) => ({
    ...p,
    riskColor: RISK_MAP[p.risk],
    riskBorder: "color-mix(in srgb," + RISK_MAP[p.risk] + " 40%,transparent)",
    trackBg: p.on
      ? "color-mix(in srgb,var(--ac,#3dff99) 32%,transparent)"
      : "rgba(255,255,255,.09)",
    knobX: p.on ? "20px" : "2px",
    knobBg: p.on ? "var(--ac,#3dff99)" : "rgba(234,241,238,.5)",
  }));
}

// 11×11 ripple grid delays for the boot loader (distance-based).
export function buildDots(): { delay: string }[] {
  const N = 11;
  const c = (N - 1) / 2;
  const dots: { delay: string }[] = [];
  for (let r = 0; r < N; r++)
    for (let col = 0; col < N; col++) {
      const dist = Math.hypot(col - c, r - c);
      dots.push({ delay: (dist * 0.12).toFixed(2) + "s" });
    }
  return dots;
}

export function buildWaveBars(): { delay: string }[] {
  return Array.from({ length: 16 }, (_, i) => ({
    delay: (i * 0.07).toFixed(2) + "s",
  }));
}

export function greetingFor(hour: number): string {
  return hour < 5
    ? "Good night"
    : hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
}
