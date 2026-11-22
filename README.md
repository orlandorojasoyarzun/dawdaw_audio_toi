# dawdaw

Open source DAW for electronic music. Electron + TypeScript UI on top of a
JUCE / Tracktion Engine audio engine. Working name; may change.

> Status: early scaffolding. macOS first, Windows compatibility kept in CI.

## Layout

| Path | What |
|---|---|
| `apps/desktop` | Electron + React + TypeScript UI |
| `engine` | C++ audio engine (CMake, JUCE, Tracktion Engine), runs as a sidecar process |
| `docs/adr` | Architecture decision records |

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
