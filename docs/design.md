# AMA — Design / Spec

_Last updated: 2026-06-29_

This is the working design for AMA, a personal Jarvis-style agent. It captures
what we're building, the architecture, and the open questions. It will evolve as
we go (and as new design input arrives).

---

## 1. Goal

A personal AI assistant that:

- Runs **on the user's own machine** (macOS).
- Is **voice-first**: wake word → speak a request → spoken answer.
- Is also reachable **remotely by text via Telegram** when away from the machine.
- Can **answer questions** and **take actions**, and can **delegate to
  specialized sub-agents**.
- Keeps the user **in control** of exactly what it may do, via a local
  permissions dashboard, starting locked-down and expanding on trust.

## 2. Strategy: adopt, don't rebuild

The core engine is **Hermes Agent** (Nous Research, MIT-licensed). It already
provides:

- Multi-platform messaging gateway (Telegram, Discord, Slack, WhatsApp, Signal)
- Isolated sub-agents for delegated tasks
- Cross-session memory with full-text search
- Cron scheduling for recurring/automated tasks
- Voice (text-to-speech), vision, browser automation, web search (via tools)
- MCP integration + a tool/permission model
- Multi-model, no lock-in (Claude / OpenAI / OpenRouter / Nous Portal / local Ollama)

We build a **thin custom layer** on top:

1. A **locked-down starting profile**.
2. A **local permissions dashboard**.
3. **Swappable brain & tools** as config-driven layers.

This is the difference between shipping in days vs. quarters.

## 3. Architecture

### 3.1 Layers

- **Engine layer (Hermes):** the agent loop, sub-agents, memory, cron, gateway.
  Configured via `~/.hermes/config.yaml` (non-secret settings) and
  `~/.hermes/.env` (secrets/tokens).
- **Brain layer (swappable):** the reasoning LLM. **Default: local Ollama**
  (free, private, offline). Optional upgrade: a direct Anthropic API key for
  more capability. Selected via `hermes model` / config.
- **Tools layer (local by default):** voice (TTS), web search, browser, etc.
  **Default: local/free components** — Piper/Kokoro (TTS), Playwright (browser),
  a search API (Brave/SearXNG self-hosted). No hosted gateway.
- **Control layer (custom):** the desktop app (Phase 4) — a Tauri app with a
  hero window (presence) and an admin panel that reads/writes Hermes config and
  surfaces the approval flow.

### 3.2 Why layers are kept separate

So that swapping the brain (e.g. local Ollama → a cloud API for harder tasks, or
back) is a **config swap, not a rewrite**. The brain and tools must never be
hard-wired into the custom code.

## 4. Permissions & safety model

AMA leans on Hermes's existing safety primitives (to be validated against the
installed version at setup time):

- **Blank Slate startup** — Hermes can start with everything off except the bare
  minimum (provider/model + File Operations + Terminal toolsets). This is our
  initial scope.
- **Tool gating** — toolsets enabled/disabled per platform in `config.yaml`
  (`platform_toolsets.*`, `agent.disabled_toolsets`), controllable via
  `hermes tools`.
- **Approvals** — `approvals.mode` (`manual` / `smart` / `off`), with a prompt
  timeout (~60s) and a `cron_mode`. Dangerous-command scanning + credential
  stripping exist in Hermes.
- **Gateway allowlist** — the messaging gateway refuses to act until an
  allowlist is set per adapter. For Telegram, the allowlist = only the user.

### 4.1 The desktop app (custom, Phase 4)

AMA ships as a **desktop application** with two surfaces:

1. **Hero desktop** — the always-available presence of AMA: a small,
   always-on-top window / floating orb showing listening state, the current
   response, and quick interaction. This is the "AMA is here" presence feel.
2. **Admin panel** — the permissions dashboard:
   - **Shows current permission state** — which toolsets/capabilities are
     on/off, current `approvals.mode`, gateway allowlist, active model/provider.
   - **Surfaces pending approvals** — when AMA wants to do something gated, show
     it and let the user allow/deny.
   - **One-click grant/revoke** — toggle capabilities, which writes back to
     `config.yaml` (or calls the relevant `hermes` CLI).

**Tech: Tauri** (Rust shell + system WebKit webview) wrapping a **React** frontend. Chosen over Electron (far lighter and
more native — important for an always-on assistant) and over a pure browser app
(which can't provide a tray icon, a global wake-word hotkey, or an always-on-top
orb). Because Tauri/Electron/web all load the same web frontend, we build the UI
as a normal web app first (fast iteration) and wrap it in Tauri for the desktop
presence — no rework. Electron is the fallback only if a needed capability is
unavailable in Tauri.

Native shell responsibilities (Tauri side): system tray, global hotkey / wake
word trigger, always-on-top hero window, mic access, and a local bridge to the
Hermes process. The frontend talks to a small local API that fronts Hermes.

## 5. Interaction surfaces

- **Voice (primary):** **wake word "Hey AMA" / "Hello AMA"** → speech-to-text →
  agent → text-to-speech. All local (matches the local-first brain). Wake word
  via **openWakeWord** (ships a "hey jarvis" model + supports custom phrases, so
  "Hey AMA" is trainable/configurable). STT via whisper.cpp; TTS via Piper or
  Kokoro. Finalized in Phase 2.
- **Remote text (secondary):** reach AMA when away from the machine, allowlisted
  to the user only. **Channel is a pluggable adapter — choice deferred.**
  Candidates: **Signal** (encrypted, private, Hermes-native — best privacy fit),
  **AMA's own web UI over Tailscale** (no third party; reach our own UI from the
  phone over a private VPN — most local-first), or **Discord** (easiest bot, less
  private). **Telegram was dropped** at the user's request. WhatsApp avoided
  (unofficial libs risk bans; official needs business approval).

## 6. The brain — local Ollama (default)

**Decision: run the brain locally on Ollama.** Free, fully private, offline, no
subscription. This is the chosen default; a cloud API remains an optional
*upgrade* path, not a dependency.

### 6.1 Practical requirements (validate in Phase 1)

- **Hardware (confirmed): Mac Mini, 24GB unified memory.** Target a **~14B**
  model (e.g. recent Qwen) — comfortable with headroom for the OS, STT, and TTS.
  ~30B is tight once 64k context + Whisper + a TTS model are also resident, so
  14B is the chosen sweet spot.
- **Context window:** Hermes wants a model with **≥64k context**. Ollama often
  defaults to a smaller context (e.g. 4k–8k via `num_ctx`); we must pick a model
  that supports large context **and** configure `num_ctx` accordingly, or the
  agent loop (long system prompt + tools + memory) will overflow.
- **Tool-use capability (the real risk):** sub-agents and tool-calling demand
  strong instruction-following. Smaller/weaker local models can struggle with
  multi-step orchestration. Favor models with good tool-calling (e.g. recent
  Qwen / Llama families) and keep early sub-agent tasks simple. **This is the
  main capability tradeoff of going local — accepted deliberately.**

### 6.2 Sub-agent architecture: one shared model, many roles

AMA = a main agent that delegates to specialized sub-agents (search,
coding, planning, …). Important implementation note:

- **Sub-agents are NOT separate smaller models.** Each is the *same* shared local
  model given a focused prompt + a restricted toolset. Specialization comes from
  instructions and tool access, not from a different/smaller model.
- **RAM cost is driven by how many models are loaded, not how many agents exist.**
  One shared ~14B model sits in memory once; AMA and every sub-agent call it.
  So adding sub-agents does **not** add RAM — it adds focus and quality.
- **They run sequentially on one machine** (one model, one GPU). AMA
  delegating to N sub-agents = N sequential model runs → slower, not parallel.
  Acceptable for a personal assistant.
- **Why bother, then?** Each sub-agent gets a tight prompt, only the tools it
  needs, and its own clean context window — which makes a modest 14B local model
  far more reliable than one over-loaded do-everything prompt. This pairs well
  with keeping each sub-agent's task simple (see the tool-use caveat above).

### 6.3 Optional upgrade path (not used by default)

- A direct **Anthropic API key** (pay-as-you-go, ~$3–8/mo for light use) can be
  slotted in as the brain for harder tasks — a config change, since the brain is
  a swappable layer. Kept as a documented option only.
- **Note on Claude Max:** a Claude **Max** subscription covers the Claude apps +
  Claude Code, **not** API access — so it can't power AMA even if we went cloud.

## 7. Phased build plan

- **Phase 0 — Foundation** *(current)*: design, README, skeleton.
- **Phase 1 — Engine up**: install Ollama + a capable local model; install
  Hermes; create a Blank Slate scoped config; point Hermes at Ollama (with
  `num_ctx` ≥ 64k); verify a basic Q&A works.
- **Phase 2 — Voice**: wake word ("Hey AMA"/"Hello AMA" via openWakeWord) + STT
  + TTS pipeline.
- **Phase 3 — Remote text**: chosen remote channel (pluggable adapter, TBD) with
  a user-only allowlist.
- **Phase 4 — Desktop app**: Tauri shell + web frontend; hero window (presence)
  and admin panel (view/grant/revoke/approve). Build UI as a web app, wrap in Tauri.
- **Phase 5 — Specialized sub-agents**: a few focused sub-agents for target tasks.
- **Phase 6 — Hardening / go-local**: optional migration to a fully free/local stack.

## 8. Open questions / to confirm

- Exact Hermes config schema & CLI surface — **validate against the installed
  version** before writing the scoped config and the dashboard's read/write
  layer (the keys in §4 are from docs and may differ by version).
- **Local model choice** — pick a ~14B model with strong tool-calling and ≥64k
  context support (Mac Mini 24GB confirmed); configure Ollama `num_ctx`. Decide
  the exact model in Phase 1.
- Voice stack specifics (STT choice, TTS engine) — decide in Phase 2. Wake word
  engine = openWakeWord with a "Hey AMA"/"Hello AMA" phrase (decided).
- Remote channel choice (Signal vs. own-UI-over-Tailscale vs. Discord) — decide
  at Phase 3. Designed as a pluggable adapter so it doesn't block earlier work.
- Which specialized sub-agents matter most to the user — gather in Phase 5.
- Hero window form (floating orb vs. status bar vs. panel) and visual style —
  decide in Phase 4 (user may bring look-and-feel input).
- **Incoming:** user is researching additional design input to fold in here.
