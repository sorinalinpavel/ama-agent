// AMA's real seed data — sub-agents, permissions, activity, vitals.
//
// These replace the original mockup's placeholder roster (Atlas/Quill/…) with
// AMA's actual planned specialists and a permission set mapped to Hermes
// toolsets, using our LOCKED-DOWN defaults (high-risk scopes start OFF).
// Still mock/seed data — wired to live Hermes state in a later phase.

import type { Agent, Permission, ActivityEvent, Vital } from "./types";

// AMA = one main agent that delegates to these specialized sub-agents. They all
// share ONE local model (Ollama ~14B); specialization is prompt + tools, not a
// separate model each. (See docs/design.md §6.2.)
export const AGENTS: Agent[] = [
  {
    initial: "S",
    name: "Scout",
    role: "Researcher",
    base: "Active",
    on: true,
    progress: 58,
    task: "Searching the web and summarizing sources on your question",
    eta: "~1m left",
    caps: ["Web search", "Page fetch", "Summarize"],
  },
  {
    initial: "F",
    name: "Forge",
    role: "Coder",
    base: "Idle",
    on: true,
    progress: 0,
    task: "Standing by — Run code is OFF, so code tasks need a grant first",
    eta: "idle",
    caps: ["Read/write files", "Run code", "Terminal"],
  },
  {
    initial: "P",
    name: "Pilot",
    role: "Planner",
    base: "Active",
    on: true,
    progress: 41,
    task: "Breaking your goal into steps and checking the calendar",
    eta: "~40s left",
    caps: ["Task planning", "Calendar", "Reminders"],
  },
  {
    initial: "R",
    name: "Relay",
    role: "Messenger",
    base: "Idle",
    on: false,
    progress: 0,
    task: "Paused — no remote channel configured yet (Phase 3)",
    eta: "paused",
    caps: ["Remote channel", "Triage", "Notify"],
  },
  {
    initial: "W",
    name: "Warden",
    role: "Sentinel",
    base: "Active",
    on: true,
    progress: 100,
    task: "Watching every gated action and holding risky ones for approval",
    eta: "continuous",
    caps: ["Approval gate", "Audit", "Privacy filter"],
  },
  {
    initial: "E",
    name: "Echo",
    role: "Memory",
    base: "Idle",
    on: true,
    progress: 0,
    task: "Ready to recall past context and save new notes across sessions",
    eta: "idle",
    caps: ["Memory", "Full-text recall", "Notes"],
  },
];

// Permissions = Hermes toolsets / capabilities, with locked-down defaults.
// Minimum set ON (file ops, web, memory); everything higher-risk starts OFF and
// is granted deliberately from this panel.
export const PERMISSIONS: Permission[] = [
  {
    name: "File system",
    desc: "Read & write files in your workspace",
    risk: "Medium",
    on: true,
  },
  {
    name: "Web access",
    desc: "Browse, search and read public pages",
    risk: "Low",
    on: true,
  },
  {
    name: "Memory",
    desc: "Persist and recall context across sessions",
    risk: "Low",
    on: true,
  },
  {
    name: "Terminal",
    desc: "Run shell commands (gated — asks before each)",
    risk: "High",
    on: false,
  },
  {
    name: "Run code",
    desc: "Execute scripts in a sandbox",
    risk: "High",
    on: false,
  },
  {
    name: "Browser automation",
    desc: "Drive a real browser to act on sites",
    risk: "Medium",
    on: false,
  },
  {
    name: "Remote messaging",
    desc: "Send replies on your behalf via the remote channel",
    risk: "Medium",
    on: false,
  },
  {
    name: "Make purchases",
    desc: "Spend up to a set limit without confirmation",
    risk: "High",
    on: false,
  },
];

export const ACTIVITY: ActivityEvent[] = [
  { t: "21:04", agent: "Scout", type: "RESEARCH", text: "Searched the web and condensed 9 sources into a short brief" },
  { t: "21:03", agent: "Warden", type: "SECURITY", text: "Held a terminal command for your approval (Terminal is OFF)" },
  { t: "21:02", agent: "Pilot", type: "PLAN", text: "Broke “ship AMA Phase 1” into 5 ordered steps" },
  { t: "20:59", agent: "Echo", type: "MEMORY", text: "Saved a note: stack is Hermes + local Ollama + Tauri/React" },
  { t: "20:58", agent: "Forge", type: "CODE", text: "Read 4 files and drafted a patch — awaiting a Run-code grant" },
  { t: "20:55", agent: "Pilot", type: "PLAN", text: "Flagged a calendar clash tomorrow at 09:00" },
  { t: "20:51", agent: "Scout", type: "RESEARCH", text: "Fetched a long article and pulled out 6 key points" },
  { t: "20:47", agent: "Echo", type: "MEMORY", text: "Recalled last week’s decision to run the brain locally" },
];

// Local-first vitals: GPU matters more than network for on-device inference.
export const VITALS: Vital[] = [
  { k: "CPU", v: "54%", w: "54%" },
  { k: "MEMORY", v: "61%", w: "61%" },
  { k: "GPU", v: "73%", w: "73%" },
];

export const QUICK_ACTIONS = [
  "Summarize my day",
  "Search the web",
  "Plan my week",
  "Recall a note",
  "Write some code",
];
