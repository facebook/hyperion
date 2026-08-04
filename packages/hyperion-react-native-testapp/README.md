# Hyperion React Native test app

This fixture consumes only public `hyperion-react-native` package APIs. The
bootstrap calls `AutoLogging.init(config)` before requiring `App`, while the app
owns its channel subscriptions and bounded debug display.

The fixture covers automatic UI events, nested interactive and non-interactive
surfaces, registry inspection and inheritance, conditional lifecycle events,
AppState heartbeat behavior, custom events, list impressions, raw deep-link
targets, a real error boundary, memo/forwardRef/ref/key behavior, StrictMode,
Suspense, thrown renders, and present-with-`undefined` handler toggles.

The in-app inspector is application-owned. It retains the latest 250 public
events, shows per-family counts and filters, and lets each row expand to either
the exact public event or its transport envelope. A separate expandable view
walks the committed `ALSurfaceData` registry as a tree, including lifecycle and
interactive paths, explicit metadata, ancestry, and serialized node data. UI
payloads expose `elementTextSource`, and the metadata fixture demonstrates that
subscriber policy—not the runtime—decides whether explicit scalar metadata is
filtered before persistence. Text-entry values and raw handler arguments remain
excluded at extraction time.

## Commands

```sh
npm run build
npm test
npm run build:ios
npm run benchmark:bundle:ios
```

`benchmark:bundle:ios` builds the same production fixture twice: once using a
no-op baseline runtime and once using Hyperion. It writes the incremental
minified Metro result to `dist/autologging-bundle-report.json` and enforces the
50,000-byte budget. If the local Hermes compiler is executable,
`npm run benchmark:hermes:ios` adds and enforces the 85,000-byte bytecode result.

Running the native application requires the usual React Native iOS or Android
toolchain. No internal source paths, Haste modules, or private build tools are
used.
