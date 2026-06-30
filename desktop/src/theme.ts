import type { AccentHex } from "./types";

// The five accent options from the design. Default = AMA green.
export const ACCENTS: AccentHex[] = [
  "#3dff99", // green (default)
  "#36e6ff", // cyan
  "#ff4dd2", // magenta
  "#ffb454", // amber
  "#a78bff", // violet
];

export const DEFAULT_ACCENT: AccentHex = ACCENTS[0];

// Shared palette tokens used across components (kept in one place for fidelity).
export const C = {
  text: "#eaf1ee",
  textDim: "rgba(234,241,238,.55)",
  textFaint: "rgba(234,241,238,.4)",
  line: "rgba(234,241,238,.07)",
  lineSoft: "rgba(234,241,238,.05)",
  panel: "rgba(255,255,255,.022)",
  panelBtn: "rgba(255,255,255,.02)",
  mono: "'JetBrains Mono', monospace",
  sans: "'Space Grotesk', sans-serif",
};
