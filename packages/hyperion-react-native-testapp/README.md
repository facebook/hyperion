# Hyperion React Native test app

This fixture consumes only public `hyperion-react-native` APIs and composes each
mobile capability as a plugin. Bootstrap initializes AutoLogging before loading
the application module. The application owns its channel subscriptions,
transport envelopes, and bounded debug storage.

The fixture exercises automatic UI events, raw text provenance, nested
interactive and non-interactive surfaces, committed registry inspection,
conditional mount/unmount events, AppState heartbeat behavior, screen changes,
list impressions, raw deep links, a real error boundary, memo, forward refs,
keys, StrictMode, Suspense, a React 19 `use()` retry inside an observed
Pressable, thrown renders, and handler toggles.

The event inspector retains the latest 250 public events. Filter by family,
select a row to inspect the complete public payload, and switch to the derived
transport envelope. The surface inspector walks the committed `ALSurfaceData`
tree and shows lifecycle paths, interactive paths, ancestry, metadata, and
serialized node data.

## Commands

```sh
npm run build
npm test
npm run build:ios
npm run benchmark:bundle:ios
npm run benchmark:hermes:ios
npm run benchmark:split:ios
```

`benchmark:bundle:ios` builds the production fixture with a no-op baseline and
with Hyperion, writes `dist/autologging-bundle-report.json`, and enforces the
50,000-byte incremental minified Metro budget. The Hermes command also enforces
the 85,000-byte bytecode budget. The fixture includes every modern mobile
plugin through its dedicated package entry; the no-op baseline replaces the
runtime, capability, channel, and JSX entries, and the deprecated legacy
adapter is not charged to modern consumers.

`benchmark:split:ios` measures the minimal runtime, each independently loaded
plugin composition, the complete split composition, and the compatibility
aggregate in both minified Metro JavaScript and Hermes bytecode. It also checks
that omitted plugin markers are absent from each focused bundle.

Running the native application requires the normal React Native iOS or Android
toolchain. No private source imports, Haste modules, or internal build tools are
used.
