# AMA — A Personal Jarvis-Style Agent

AMA is a personal, voice-first AI assistant that runs on your own machine. You
talk to it ("Hey…"), and you can also reach it remotely by text via Telegram. It
can answer questions, take actions on your behalf, and delegate specialized work
to sub-agents — all while you stay in control of exactly what it's allowed to do
through a local permissions dashboard.

> **Status:** Early setup. This repo currently holds the design and project
> skeleton. The engine (Hermes Agent) and the custom dashboard are not yet
> installed/built — see [docs/design.md](docs/design.md) and the roadmap below.

---

## What we're building

A thin, opinionated layer on top of [**Hermes Agent**](https://github.com/nousresearch/hermes-agent)
(MIT-licensed, by Nous Research) — which already provides the hard parts:
multi-platform messaging gateway, sub-agents, cross-session memory, cron
scheduling, voice (TTS), and a tool/permission model.

Rather than rebuild that, AMA focuses on **the parts that make it *ours* and
*safe*:**

1. **A locked-down starting profile** — AMA boots with almost nothing enabled,
   and capabilities are granted deliberately.
2. **A local permissions dashboard** — a web app at `localhost` that shows what
   AMA is allowed to do, surfaces approval requests, and lets you grant/revoke
   capabilities with one click.
3. **Swappable brain & tools** — the reasoning model and the voice/tools are
   kept as independent, config-driven layers so we can start convenient and
   migrate to fully-free-local at any time without re-architecting.

## Key decisions (the short version)

| Decision | Choice | Why |
|---|---|---|
| Interface | **Voice-first** (wake word **"Hey AMA" / "Hello AMA"**) + a **remote text channel** | Talk at the machine; reach it when away. Remote channel is a pluggable adapter — choice deferred (candidates: Signal, our-own-UI-over-Tailscale, Discord). Telegram dropped. |
| Engine | **Hermes Agent** (adopt, don't rebuild) | Gateway, sub-agents, memory, cron, voice, MCP, permissions — MIT. Chosen over OpenJarvis because Hermes ships the remote-channel gateway + an explicit permission model our dashboard depends on. |
| Brain (default) | **Local Ollama** | Free, private, offline, no subscription. Swappable to a cloud API later if more capability is wanted. |
| Tools (default) | **Local / free** | TTS (Piper/Kokoro), browser (Playwright), search (Brave/SearXNG) — all local, no hosted gateway. |
| Lock-in safety | **Brain & tools are swappable layers** | Already local; can swap *up* to a cloud brain (Anthropic API) anytime as a config change. |
| Control surface | **Tauri desktop app (React)** | Two surfaces: a *hero* window (AMA's presence) + an *admin panel* (see/grant/revoke/approve). Light & native vs. Electron; React frontend so we can dev in a browser first. |
| Initial scope | **Hermes "Blank Slate" + manual approvals** | Start with near-zero capability; expand on trust. |

Full rationale and the decision log live in
[docs/design.md](docs/design.md) and [docs/decisions.md](docs/decisions.md).

## How the pieces fit

```
                  ┌──────────────────────────────────────────────┐
   You (voice) ─────▶│              AMA / Hermes                 │
   "Hey AMA"         │   agent loop · sub-agents · memory · cron  │
   You (remote, TBD)▶│                                            │
                  └───────────────┬───────────────┬──────────────┘
                                  │               │
                     reads/writes │               │ controls / observes
                                  ▼               ▼
                       ~/.hermes/config.yaml   AMA Desktop App (Tauri)
                       ~/.hermes/.env          ├─ Hero window (presence)
                                  ▲             └─ Admin panel (permissions)
                                  └───────────────┘
                          grant / revoke / approve capabilities

   Brain (default → swappable):   local Ollama   ▸ or later ▸  Anthropic API
   Tools (default → local):       Piper/Kokoro TTS · Playwright · search API
```

## Roadmap

- [ ] **Phase 0 — Foundation** *(this repo)*: design, README, project skeleton.
- [ ] **Phase 1 — Engine up**: install Ollama + a capable local model, install Hermes, "Blank Slate" scoped config, point it at Ollama, confirm it answers a basic question.
- [ ] **Phase 2 — Voice**: wire wake word ("Hey AMA" / "Hello AMA" via openWakeWord) + speech-to-text + TTS so you can talk to it.
- [ ] **Phase 3 — Remote text**: connect the chosen remote channel (pluggable adapter, TBD) with an allowlist (only you).
- [~] **Phase 4 — Desktop app (Tauri)**: hero window (presence) + admin panel to view/grant/revoke capabilities and approve actions. **React frontend built & rendering in `desktop/`** (faithful port of the `AMA.dc.html` design, with AMA's real sub-agents + permissions). Still to do: wrap in Tauri + wire to live Hermes state.
- [ ] **Phase 5 — Specialized sub-agents**: define a few focused sub-agents for the tasks you care about.
- [ ] **Phase 6 — Hardening / go-local option**: optional migration path to a fully free/local stack.

## Repo layout

```
AMA-agent/
├── README.md            ← you are here
├── docs/
│   ├── design.md        ← the full design / spec we co-designed
│   └── decisions.md     ← decision log (what & why)
├── hermes/
│   └── config/          ← scoped starter config templates (validated at install)
├── desktop/             ← (Phase 4) Tauri app: hero window + admin panel (web frontend)
├── scripts/             ← (Phase 1+) setup / bootstrap helpers
├── .env.example         ← secrets template (never commit real .env)
└── .gitignore
```

## Not a git repo yet

This folder is intended to *become* a git repo. Nothing is committed yet.
When ready: `git init`, review `.gitignore`, then make the first commit.
