# AMA Desktop

The AMA desktop UI — a faithful React port of the `AMA.dc.html` design
(imported from claude.ai/design). Two screens:

- **Console** (hero): boot loader → animated "reactor" presence orb, HUD panels
  (vitals, active agents, uplink, task queue), greeting, quick actions, and a
  voice/text input bar. Wake word is **"Hey AMA" / "Hello AMA"** (shown in the
  status pill + input placeholder; real detection lands in Phase 2).
  - **Live mic waveform:** toggling the mic (listening) opens a real-time
    waveform driven by your actual microphone via the Web Audio API
    (`src/audio/useMicLevel.ts` → `src/console/Waveform.tsx`). It proves audio
    capture is working and flips to **"Hearing you"** when sound is detected.
    Requires granting mic permission in the browser. Turning listening off
    releases the mic. (Recognizing *words* needs the Phase-2 speech-to-text
    engine — the waveform shows sound, not transcription.)
- **Control** (admin): sidebar → Overview, Sub-agents, Permissions, Activity log.

## Run it

```bash
cd desktop
npm install
npm run dev      # http://localhost:1420
npm run build    # type-check + production bundle
```

## What's real vs. mock

- **Real:** AMA's actual sub-agent roster (Scout/Forge/Pilot/Relay/Warden/Echo —
  search, coding, planning, messaging, security sentinel, memory) and the
  Hermes-aligned permission set with **locked-down defaults** (high-risk scopes
  OFF). These are AMA's intended capabilities, not the design's placeholders.
- **Mock:** all live values (progress, vitals, latency, activity feed) are seed
  data in `src/data.ts`. They get wired to the live Hermes backend in a later
  phase.

## Structure

```
src/
  App.tsx            state machine (boot, screen/tab routing, accent, toggles, clock)
  data.ts            real sub-agent roster + permission set + activity (seed data)
  types.ts           shared types
  theme.ts           accent options + palette tokens
  view.ts            pure view-model helpers (port of the mockup's renderVals)
  styles.css         global styles + all keyframe animations
  components/         Header, BootLoader, Background
  console/           Console, Reactor, HudLeft, HudRight, InputBar
  control/           Control, Overview, Agents, Permissions, ActivityLog
```

## Next (Phase 4 cont.)

- Wrap in **Tauri** (Rust shell) for desktop presence: tray icon, global
  "Hey AMA" hotkey, always-on-top hero window, mic access.
- Replace `src/data.ts` seed data with a live bridge to the Hermes process
  (read config/state; drive grant/revoke + approvals from the Permissions panel).
