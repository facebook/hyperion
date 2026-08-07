# Hyperion React Native

`hyperion-react-native` provides the portable React Native AutoLogging runtime.
It observes JSX without changing application component objects and leaves
transport, persistence, and product policy to the application.

## Installation

React and React Native are peer dependencies. Initialize AutoLogging before the
application module containing instrumented JSX is evaluated:

```ts
import { AutoLogging, addChannelSubscriber } from 'hyperion-react-native';

const config = {
  appName: 'sample_app',
  enabled: true,
};

addChannelSubscriber('al_ui_event', (event) => transport(event));
AutoLogging.init(config);
```

`AutoLogging.init` accepts the complete `ALConfig` surface and is the canonical
setup API. Set `enabled: false` to install no observation or heartbeat work,
and set `heartbeatInterval: false` to disable only heartbeat. The legacy
`react`, `props`, `componentProps`, and nested `heartbeat` options remain
supported. Initialization is idempotent and the first call owns the runtime
configuration.

Use `features` to disable individual publishers while leaving the rest of the
runtime enabled. Available gates are `automaticUIEvents`,
`surfaceMutationEvents`, `customEvents`, `screenTransitionEvents`,
`listImpressionEvents`, `deepLinkEvents`, and `reactErrorEvents`. Every feature
defaults to enabled. App-state events follow the heartbeat lifecycle and are
disabled with `heartbeatInterval: false`.

AutoLogging does not require a React provider. Sampling, filtering, redaction,
persistence, and transport policy belong in channel subscribers.

Configure the automatic JSX runtime to use the package entry points. For
Babel/Metro, use `@babel/plugin-transform-react-jsx` with `runtime: 'automatic'`
and `importSource: 'hyperion-react-native'`. TypeScript users can set
`jsxImportSource` to the same package.

The optional `hyperion-react-native/babel-plugin-stable-event-props` transform
can insert a present-with-`undefined` tracked prop before a statically visible
conditional object spread. This keeps the generic wrapper mounted when a known
handler toggles. It intentionally ignores unknown spreads. If `interceptProps`
is customized at runtime, pass the same `eventProps` list to the Babel plugin.

## Public events and publishers

The public channel exposes:

- `al_ui_event`
- `al_surface_mutation_event`
- `al_heartbeat_event`
- `al_custom_event`
- `al_app_state_event`
- `al_screen_transition_event`
- `al_list_impression_event`
- `al_deep_link_event`
- `al_react_error_event`

Use `ALSurface` and `ALSurfaceData` for committed hierarchy data,
`logAppEvent`/`useLogAppEvent` for validated custom events,
`useALListViewability` with `FlatList`, `logDeepLinkOpen` for raw targets, and
`logReactErrorBoundary` from an application-owned error boundary.
Navigation listeners, URL listeners, transports, account context, error
boundaries, and debug event storage remain application-owned.

Automatic extraction publishes raw scalar control values, including text input,
without applying product privacy policy. UI events identify the value and text
source, source type, and whether that source may contain sensitive data so
subscribers can filter or redact before persistence. Deep links retain the full
target, and React error events retain the message and stacks. Deployment context
is added separately with `createTransportEnvelope`.

## Validation

```sh
npm run build --workspace=hyperion-react-native
npm test --workspace=hyperion-react-native -- --watchman=false --runInBand
npm run benchmark:runtime --workspace=hyperion-react-native
```

Generated JavaScript and declarations are written to `dist/`. Supported
subpaths are `hyperion-react-native`,
`hyperion-react-native/jsx-runtime`,
`hyperion-react-native/jsx-dev-runtime`, and the opt-in Babel plugin.

At the repository root, `npm run build` keeps the flat `dist/` artifact set
web-only while still compiling this package. Use `npm run build:mobile` to
generate flat React Native compatibility bundles in `dist-mobile/`, or
`npm run build:all` to generate both artifact sets from one workspace build.
