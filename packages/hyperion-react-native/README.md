# Hyperion React Native

`hyperion-react-native` provides the portable React Native AutoLogging runtime.
It observes JSX without changing application component objects and leaves
transport, persistence, and product policy to the application.

## Installation

React and React Native are peer dependencies. The portable runtime does not
load React Native itself; inject the narrow lifecycle capability when heartbeat
is enabled. Initialize AutoLogging before the application module containing
instrumented JSX is evaluated:

```ts
import { AppState } from 'react-native';
import React from 'react';
import * as JsxDevRuntime from 'react/jsx-dev-runtime';
import * as JsxRuntime from 'react/jsx-runtime';
import { Channel } from 'hyperion-channel';
import { AutoLogging, type ALChannelEventMap } from 'hyperion-react-native';

const channel = new Channel<ALChannelEventMap>();

const config = {
  channel,
  appName: 'sample_app',
  enabled: true,
  react: {
    ReactModule: React,
    JSXRuntimeModule: JsxRuntime,
    JSXDevRuntimeModule: JsxDevRuntime,
    ReactNativeModule: { AppState },
  },
};

channel.addListener('al_ui_event', (event) => transport(event));
AutoLogging.init(config);
```

`AutoLogging.init` accepts the complete `ALConfig` surface and is the canonical
setup API. The application creates and subscribes to the channel passed to
`init`; Hyperion does not create or pipe a second channel. Set `enabled: false`
to install no observation or heartbeat work,
and set `heartbeatInterval: false` to disable only heartbeat. Initialization is
idempotent and the first call owns the runtime configuration. Heartbeat-enabled
initialization requires `react.ReactNativeModule.AppState`; disabled and
heartbeat-disabled initialization never reads it.

`AutoLogging.init` installs observation into the supplied `ReactModule`,
`JSXRuntimeModule`, and `JSXDevRuntimeModule` before enabling automatic UI
observation. Call `init` before evaluating or rendering relevant application
JSX; installation cannot retroactively observe elements created before it.
Writable Metro and embedded runtime facades are updated in place. Immutable ESM
namespace objects are left unchanged; those applications must use the package
`jsx-runtime` and `jsx-dev-runtime` entries described below.

The deprecated `react`, `props`, `componentProps`, and nested `heartbeat`
options remain available while WWW/AMA migrates. This path accepts the original
injected `IReactModule` and `IJsxRuntimeModule`, preserves the independent
interception and publishing flags, and emits `al_react_component_prop` and
`al_react_component_mount`. It does not enable heartbeat or any modern event
family unless that functionality is explicitly configured. The `I*` fields are
intercepted-module adapters; the non-prefixed runtime fields above are the raw
React exports used by the modern observer.

Use `features` to disable individual publishers while leaving the rest of the
runtime enabled. Available gates are `automaticUIEvents`,
`surfaceMutationEvents`, `screenTransitionEvents`,
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
- `al_app_state_event`
- `al_screen_transition_event`
- `al_list_impression_event`
- `al_deep_link_event`
- `al_react_error_event`

Use `ALSurface` and `ALSurfaceData` for committed hierarchy data,
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
The portable main runtime is emitted as `hyperionMobileReactNative.js`, with an
equivalent `.react.native.js` alias for existing platform resolution. Only the
automatic JSX-runtime entries directly import React JSX runtimes and therefore
use `.react.native.js`. Dependency-neutral observation and legacy-installer
entries remain generic. Generated cross-artifact imports are bare Haste module
names. Embedded consumers can avoid the JSX-runtime entries and use
`installReactNativeJSXRuntime` with explicitly supplied React runtime modules.
