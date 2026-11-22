# 0001 - Initial architecture

Status: accepted

## Decisions

- **Engine:** C++ with JUCE + Tracktion Engine (transport, MIDI clips, VST3 hosting later).
- **Integration:** engine runs as a separate sidecar process; Electron talks to it over
  local IPC (JSON). Audio never passes through Electron. Isolates plugin/engine crashes.
- **UI:** Electron + React + TypeScript + Vite, state in Zustand, grid and waveform on
  `<canvas>`. The engine sends precomputed waveform peaks, not raw audio.
- **Project format:** versioned JSON, samples referenced by relative path. The JSON is the
  source of truth for the UI; the engine rebuilds its state from it.
- **Platforms:** macOS first. Windows is compiled in CI from day one; no direct Apple APIs
  outside isolated platform code.
- **License:** AGPL-3.0-only (compatible with JUCE and Tracktion Engine).
- **Tooling:** pnpm monorepo, CMake + Ninja for the engine.

## MVP (v0.1)

A Simpler-like sampler: load a sample, waveform visualizer, step grid sequencer,
computer-keyboard and external MIDI input. VST3 hosting comes after.
