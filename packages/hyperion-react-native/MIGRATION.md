# React Native AutoLogging plugin migration

The canonical runtime is now composed from explicit plugins. Initialize it
before loading application JSX:

```ts
const channel = createAutoLoggingChannel<ALReactNativeEventMap>();

AutoLogging.init({
  channel,
  plugins: [
    reactNativeSurfaces(),
    reactNativeUIEvents({
      ReactModule: React,
      JSXRuntimeModule: JsxRuntime,
      JSXDevRuntimeModule: JsxDevRuntime,
    }),
    reactNativeAppLifecycle({ AppState }),
    reactNativeHeartbeat(),
    reactNativeAppStateEvents(),
    reactNativeScreens(),
    reactNativeListImpressions(),
    reactNativeDeepLinks(),
    reactNativeReactErrors(),
  ],
});
```

Import app lifecycle, heartbeat, and AppState publishing from their dedicated
entries when they are gated independently. The existing `lifecycle` entry
continues to re-export all three for compatibility.

Import `AutoLogging` and common event types from
`hyperion-react-native/runtime`, and import each enabled capability from its
dedicated package entry. The `hyperion-react-native/plugins` barrel remains
available when bundle-level capability gating is unnecessary. The package root
remains the compatibility entry while legacy consumers migrate.

Removing a plugin disables that capability. Keep `reactNativeAppLifecycle()`
before heartbeat and app-state plugins. Surfaces should precede UI and list
plugins when surface context is desired.

Existing `react`, `props`, and `componentProps` initialization remains as a
temporary adapter. It preserves the legacy component-prop and component-mount
channels and does not opt legacy callers into heartbeat or modern publishers.
Migrate subscribers first, then replace flags with explicit plugins. After all
WWW/AMA callsites are migrated, the compatibility adapter and
`legacy-runtime-installer` entry can be removed.

Legacy callers may continue constructing `Channel` from
`hyperion-react-native/channel`. Modern plugin callers should use
`createAutoLoggingChannel()` so one failing subscriber cannot block later
subscribers or an application handler. Hyperion always uses the caller's exact
channel instance and never creates a second internal channel.
The generated mobile channel also retains the legacy `Hook`,
`PausableChannel`, `PipeableEmitter`, and `ResilientChannel` exports while WWW
continues loading existing Core and React artifacts.

The application must use `createAutoLoggingChannel()` rather than a plain
`Channel` to preserve subscriber isolation. The application remains responsible
for filtering, redaction, sampling, storage, and transport.

For the generated WWW handoff, run:

```sh
npm run build:mobile
npm run report:mobile
```

Copy every `dist-mobile/hyperionMobile*.js` file into the downstream xplat
Hyperion directory. Do not copy source maps or generate upstream Flow stubs.

The downstream bootstrap can gate the runtime and individual capability Haste
modules with literal compile-time conditional requires. Gate the complete setup
behind the master switch first. Load the UI-events artifact and call
`AutoLogging.init()` before application JSX modules are evaluated; a later call
cannot observe elements that were already created. Do not build conditional
wrappers that import `hyperionMobileReactNative`, because that compatibility
artifact intentionally references every plugin.
