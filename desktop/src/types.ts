// Shared types for AMA's desktop UI.
// NOTE: the data in data.ts is AMA's *real* planned roster and permission set
// (mapped to Hermes toolsets + our locked-down defaults), not the placeholder
// data from the original mockup. It is still mock/seed data until Phase 1 wires
// the desktop app to the live Hermes backend.

export type AccentHex = string;

export interface Agent {
  initial: string;
  name: string;
  role: string;
  /** Base state when enabled: "Active" (working) or "Idle" (standing by). */
  base: "Active" | "Idle";
  /** Whether the sub-agent is enabled at all. */
  on: boolean;
  /** 0–100 progress of its current task. */
  progress: number;
  task: string;
  eta: string;
  /** Capability chips — the tools this sub-agent is allowed to use. */
  caps: string[];
}

export type Risk = "Low" | "Medium" | "High";

export interface Permission {
  name: string;
  desc: string;
  risk: Risk;
  /** Granted? Locked-down defaults: high-risk scopes start off. */
  on: boolean;
}

export interface ActivityEvent {
  t: string;
  agent: string;
  type: string;
  text: string;
}

export interface Vital {
  k: string;
  v: string;
  w: string;
}
