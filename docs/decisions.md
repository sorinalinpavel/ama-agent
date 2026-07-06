# Decision Log

Chronological record of decisions made while designing AMA, and *why*. Newest
entries at the bottom. Keep this short — one entry per real decision.

---

### 2026-06-29 — Adopt Hermes Agent instead of building from scratch
**Decision:** Use Hermes Agent (Nous Research, MIT) as the engine.
**Why:** It already ships the multi-platform gateway, sub-agents, memory, cron,
voice, and a tool/permission model. Rebuilding these would cost weeks/months for
no benefit. Reputable org, permissive license.
**Implication:** Our effort goes into the custom layer (scoped config, dashboard,
swappable brain/tools), not the engine.

### 2026-06-29 — Voice-first ("Hey AMA"), plus a remote text channel
**Decision:** Primary interface is voice at the machine, activated by the wake
word **"Hey AMA" / "Hello AMA"**; secondary is a remote text channel when away.
**Wake word:** via **openWakeWord** (ships a "hey jarvis" model and supports
custom phrases, so "Hey AMA" is trainable/configurable). Wired into the UI now;
real detection lands in Phase 2.
**Why voice-first:** matches the "talk to my PC" goal.

### 2026-06-29 — Confirmed Hermes over OpenJarvis
**Decision:** Stay with Hermes Agent as the engine after evaluating OpenJarvis
(Stanford Hazy Research, Apache 2.0, ~7.2k stars, local-first by default, has a
polished desktop GUI + 8 built-in agents, can even use Hermes skills).
**Why Hermes wins for us:** it ships two things our design depends on that
OpenJarvis does not document — a **remote-channel gateway** and an **explicit
permission/approval model** (the backbone of our admin panel). OpenJarvis is a
strong local-first citizen; we may borrow its skills/ideas later (interoperable).

### 2026-06-29 — Telegram dropped; remote channel is a pluggable adapter (TBD)
**Decision:** Do NOT use Telegram. The remote text channel is a **pluggable
adapter**, choice deferred to Phase 3.
**Candidates:** **Signal** (encrypted, private, Hermes-native — best privacy fit
among chat apps), **AMA's own web UI over Tailscale** (no third party; reach our
own UI from the phone over a private VPN — most local-first), **Discord**
(easiest bot, least private). WhatsApp avoided (ban risk / business approval).
**Why deferred:** designing it as an adapter means the channel choice doesn't
block voice or the desktop app.

### 2026-06-29 — Start locked-down; control via a local web dashboard
**Decision:** Boot AMA with near-zero capability (Hermes "Blank Slate" + manual
approvals), and manage permissions through a local web dashboard.
**Why:** Safety and trust. The user wants to *see* what AMA can do and grant
capabilities deliberately. Web app chosen for the richest, most extensible UI.

### 2026-06-29 — Brain runs locally on Ollama (keep brain/tools swappable)
**Decision:** Run the reasoning model **locally on Ollama** by default, with
local/free tools (Piper/Kokoro TTS, Playwright, a search API) instead of any
hosted gateway. Brain and tools stay independent, config-driven layers.
**Why:** Free, fully private, offline, no subscription — the user wants it local.
_(Supersedes an earlier "Nous Portal Plus" default that was briefly considered.)_
**Accepted tradeoff:** local models are weaker at complex multi-step sub-agent
orchestration / tool-calling than frontier cloud models, and quality is bounded
by the Mac's RAM. Mitigations: pick a strong tool-calling model with ≥64k
context, set Ollama `num_ctx` accordingly, keep early sub-agent tasks simple.
**Optional upgrade (not default):** a direct Anthropic API key can slot in as the
brain for harder tasks — a config change, since the brain is swappable. (A Claude
Max subscription does NOT grant API access, so it can't power AMA regardless.)

### 2026-06-29 — Desktop app via Tauri (hero window + admin panel)
**Decision:** Ship AMA's UI as a **Tauri** desktop app with two surfaces — a
*hero* window (always-available presence: listening state, responses, orb) and
an *admin panel* (the permissions dashboard). Build the UI as a web frontend and
wrap it in Tauri.
**Why:** An always-on assistant should be light and native — Tauri is ~5–10MB vs.
Electron's Chromium (~150MB+, RAM-hungry), and gives a tray icon, global
wake-word hotkey, and an always-on-top orb that a pure browser app can't.
macOS-only means a single WebKit webview (no cross-webview headaches). Since all
options load a web frontend, we can dev in a browser first and wrap later with no
rework. **Electron is the fallback** only if a needed capability is missing in Tauri.
**Frontend framework: React** (decided — Tauri + React).

### 2026-06-29 — Sub-agents share one model (Mac Mini 24GB)
**Hardware:** Mac Mini, 24GB unified memory → target a ~14B model.
**Decision:** AMA main agent + specialized sub-agents (search, coding,
planning, …) all run on **one shared local ~14B model**. Specialization = focused
prompt + restricted toolset per sub-agent, not a separate/smaller model each.
**Why this matters:** corrects the intuition that more sub-agents = less power.
RAM is driven by how many models are loaded (one), not how many agents exist.
Sub-agents add *quality/focus* (tight prompt, only-needed tools, clean context),
not lower memory. They run sequentially on one GPU (slower, not parallel) — fine
for a personal assistant, and pairs well with keeping each sub-agent task simple.

### 2026-06-29 — No vendor lock-in (local-first, swap up if needed)
**Decision:** Keep AMA fully runnable with zero external dependencies (local
Ollama + local tools), and treat any cloud brain as an optional swap-*up*.
**Why:** No lock-in, no recurring cost, works offline. Because Hermes is local +
multi-provider and our brain/tools are config-driven layers, moving to/from a
cloud API later is a config change, not a rewrite.

### 2026-06-30 — Coding/PR via "AMA → terminal → Claude Code" (noted; later phase)
**Decision (planned, not yet built):** For real coding work (e.g. "build a feature
and open a PR"), AMA does NOT write the code with the local 8B. Instead AMA acts as
an orchestrator that runs **Claude Code** in a terminal (scoped to this repo) to do
the coding + git + PR, with a **reviewer agent** (a second Claude Code or a
different model via a Hermes sub-agent) checking the diff before the PR is raised.
**Why:** plays to strengths — local 8B = cheap orchestrator/voice; Claude Code =
strong coder. Notably this is the ONE path that uses the user's **Claude Max**
subscription (Claude Code runs on Max — no extra API cost), even though Max can't
power the Ollama brain.
**Implications / guardrails (load-bearing):** this lets a weak local model trigger
an autonomous agent that edits code and pushes to GitHub, so it MUST be gated:
Terminal is HIGH-risk (off by default); scope Claude Code's working dir to this
repo; never push to main (PR branches only); require the user's approval before the
PR is actually raised; keep the reviewer step; don't blanket-skip Claude Code's own
permissions. Make the invocation a fixed skill/script, not freeform 8B improvisation.
**Prerequisites:** repo must be `git init`'d with a GitHub remote + auth (`gh`/token)
— not done yet. Build this AFTER Hermes (it needs Hermes's Terminal tool + permissions).

### 2026-06-30 — Native (Tauri/WKWebView) ML & networking constraints (hard-won)
**Findings while wrapping the app in Tauri (macOS WKWebView):**
- **Ollama from the webview fails** — POST `/api/chat` hangs/streams nothing
  (CORS/streaming limits). Fix: call Ollama from **Rust** (`reqwest`) via
  `#[tauri::command]` (`ollama_chat`, `ollama_tags`) and `invoke()` from JS. The
  webview `fetch` path is kept only for running in a plain browser.
- **Two neural models can't share the webview engine.** Whisper STT + Silero VAD
  (onnxruntime wasm) and Kokoro TTS conflict: Kokoro on **WebGPU hangs at
  `generate()`**, Kokoro on **wasm breaks Whisper/VAD listening**. Current
  stopgap: in the native app, disable Kokoro and use the **system voice**
  (`speechSynthesis`) — robotic but doesn't touch the wasm engine, so listening
  works. **Proper fix (planned):** move Kokoro TTS and `whisper.cpp` STT **into
  the Rust backend** so the webview runs neither — natural voice AND good
  recognition, no contention.
- **Mic in WKWebView** needs `NSMicrophoneUsageDescription` (src-tauri/Info.plist)
  + audio-input entitlement; then getUserMedia works.
- **Audio playback** starts suspended — call `AudioContext.resume()` inside a user
  gesture (`unlockAudio()` on mic-tap/send).
