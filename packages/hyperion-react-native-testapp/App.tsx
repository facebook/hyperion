/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, {
  forwardRef,
  memo,
  Suspense,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Button,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type View as ViewInstance,
} from 'react-native';
import {
  ALSurface,
  ALSurfaceData,
  getCurrentScreen,
  logDeepLinkOpen,
  logReactErrorBoundary,
  setCurrentScreen,
  useALListViewability,
  useLogAppEvent,
} from 'hyperion-react-native';
import { AutoLoggingInspector, SurfaceTreeInspector } from './DebugInspector';
import { useDebugEvents } from './EventStore';

ALSurfaceData.root.setInheritedPropery('fixture_owner', 'test_app');

const LazyFixture = React.lazy(async () => ({
  default: () => <Text>Suspense fixture resolved</Text>,
}));

const FixtureButton = memo(
  forwardRef<ViewInstance, { enabled: boolean; onPress(): void }>(
    function FixtureButton({ enabled, onPress }, ref) {
      return (
        <Pressable
          accessibilityLabel="Memo forward ref fixture"
          key="stable-fixture-key"
          onPress={enabled ? onPress : undefined}
          ref={ref}
          style={styles.control}
        >
          <Text>{enabled ? 'Instrumented handler' : 'Handler absent'}</Text>
        </Pressable>
      );
    }
  )
);

interface ErrorBoundaryState {
  failed: boolean;
}

class FixtureErrorBoundary extends React.Component<
  React.PropsWithChildren<{ resetKey: number }>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logReactErrorBoundary(error, info, {
      boundaryName: 'FixtureErrorBoundary',
      errorCategory: 'fixture_render',
    });
  }

  componentDidUpdate(previous: Readonly<{ resetKey: number }>): void {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render(): React.ReactNode {
    return this.state.failed ? (
      <Text>Error fallback owned by app</Text>
    ) : (
      this.props.children
    );
  }
}

function ThrowingFixture(): never {
  throw new TypeError('private render detail must never be logged');
}

function FixtureContent(): React.JSX.Element {
  const [showDetails, setShowDetails] = useState(true);
  const [handlerEnabled, setHandlerEnabled] = useState(true);
  const [showSuspense, setShowSuspense] = useState(false);
  const [throwRender, setThrowRender] = useState(false);
  const [errorResetKey, setErrorResetKey] = useState(0);
  const [automaticPresses, setAutomaticPresses] = useState(0);
  const [, setScreenRevision] = useState(0);
  const fixtureRef = useRef<ViewInstance>(null);
  const logAppEvent = useLogAppEvent();
  const events = useDebugEvents();
  const listViewability = useALListViewability<{ id: string; label: string }>({
    listName: 'fixture_items',
    getItemName: (item) => item.label,
    metadata: { fixture: 'flat_list' },
  });
  const onFixturePress = useCallback(() => {
    logAppEvent('fixture.memo.press', { enabled: true });
  }, [logAppEvent]);

  const rootChildren = ALSurfaceData.root.getChildren();
  const dashboard = ALSurfaceData.tryGet('dashboard');
  const inherited = dashboard?.getInheritedPropery<string>('fixture_owner');
  const surfaceRevision = events.filter(
    (entry) => entry.eventType === 'al_surface_mutation_event'
  ).length;

  const changeScreen = useCallback((screen: string) => {
    if (setCurrentScreen(screen, { source: 'fixture_control' })) {
      setScreenRevision((value) => value + 1);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>React Native AutoLogging fixture</Text>
      <Text testID="screen-state">
        Screen: {getCurrentScreen()?.name ?? 'uninitialized'}
      </Text>

      <ALSurface
        name="dashboard"
        metadata={{ fixture: 'dashboard', version: 1 }}
        uiEventMetadata={{ click: { intent: 'fixture_action' } }}
      >
        <View style={styles.section}>
          <Text style={styles.heading}>Automatic UI events</Text>
          <Button
            accessibilityLabel="Create fixture event"
            onPress={() =>
              logAppEvent('fixture.action.create', { source: 'button' })
            }
            testID="create-fixture-event"
            title="Log custom event"
          />
          <Pressable
            accessibilityLabel="Automatic event only"
            onPress={() => setAutomaticPresses((value) => value + 1)}
            style={styles.control}
            testID="automatic-event-only"
          >
            <Text>Automatic UI only ({automaticPresses})</Text>
          </Pressable>
          <TextInput
            accessibilityLabel="Potentially sensitive text fixture"
            onChangeText={() => undefined}
            placeholder="Text is logged and marked potentially sensitive"
            style={styles.input}
            testID="private-text-input"
          />
          <View style={styles.row}>
            <Text>Stable handler toggle</Text>
            <Switch onValueChange={setHandlerEnabled} value={handlerEnabled} />
          </View>
          <FixtureButton
            enabled={handlerEnabled}
            onPress={onFixturePress}
            ref={fixtureRef}
          />
        </View>

        <ALSurface
          name="layout_only"
          nonInteractive
          metadata={{ layout: 'wide' }}
        >
          <View style={styles.section}>
            <Text style={styles.heading}>Surface hierarchy</Text>
            <Button
              onPress={() => setShowDetails((value) => !value)}
              title={showDetails ? 'Unmount details' : 'Mount details'}
            />
            {showDetails ? (
              <ALSurface name="details" metadata={{ fixture: 'conditional' }}>
                <Pressable
                  accessibilityLabel="Nested surface action"
                  onLongPress={() => logAppEvent('fixture.details.long_press')}
                  onPress={() => changeScreen('fixture_details')}
                  style={styles.control}
                >
                  <Text>Nested interactive surface</Text>
                </Pressable>
              </ALSurface>
            ) : null}
          </View>
        </ALSurface>

        <View style={styles.section}>
          <Text style={styles.heading}>Explicit publishers</Text>
          <View style={styles.buttonGrid}>
            <Button
              onPress={() => changeScreen('fixture_home')}
              title="Screen: home"
            />
            <Button
              onPress={() => changeScreen('fixture_details')}
              title="Screen: details"
            />
          </View>
          <Button
            onPress={() =>
              logAppEvent(
                'fixture.metadata.inspect',
                {
                  contactEmail: 'person@example.com',
                  count: 2,
                  nullable: null,
                },
                'warn'
              )
            }
            title="Log subscriber-policy metadata"
          />
          <Button
            onPress={() =>
              logDeepLinkOpen(
                'hyperion://fixture/details?account=potentially-sensitive',
                {
                  source: 'url_event',
                }
              )
            }
            title="Log raw deep link"
          />
          <FlatList
            data={[
              { id: 'one', label: 'first_item' },
              { id: 'two', label: 'second_item' },
            ]}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={listViewability.onViewableItemsChanged}
            renderItem={({ item }) => <Text>{item.label}</Text>}
            scrollEnabled={false}
            viewabilityConfig={listViewability.viewabilityConfig}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>React compatibility</Text>
          <Button
            onPress={() => setShowSuspense((value) => !value)}
            title="Toggle Suspense child"
          />
          <Suspense fallback={<Text>Suspense fallback</Text>}>
            {showSuspense ? <LazyFixture /> : null}
          </Suspense>
          <FixtureErrorBoundary resetKey={errorResetKey}>
            {throwRender ? (
              <ThrowingFixture />
            ) : (
              <Text>Error fixture ready</Text>
            )}
          </FixtureErrorBoundary>
          <Button
            onPress={() => {
              if (throwRender) {
                setThrowRender(false);
                setErrorResetKey((value) => value + 1);
              } else {
                setThrowRender(true);
              }
            }}
            title={throwRender ? 'Reset error fixture' : 'Throw in render'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Registry API checks</Text>
          <Text>
            Root children:{' '}
            {rootChildren.map((node) => node.surfaceName).join(', ')}
          </Text>
          <Text>Dashboard parent: {dashboard?.parent.surface ?? 'root'}</Text>
          <Text>Inherited owner: {inherited ?? 'not set'}</Text>
          <Text>Elements: {dashboard?.getElements().length ?? 0}</Text>
          <Text numberOfLines={3}>
            {JSON.stringify(dashboard?.toJSON() ?? {})}
          </Text>
        </View>
      </ALSurface>

      <SurfaceTreeInspector revision={surfaceRevision} />
      <AutoLoggingInspector events={events} />
    </ScrollView>
  );
}

export default function App(): React.JSX.Element {
  return (
    <React.StrictMode>
      <SafeAreaView style={styles.safeArea}>
        <FixtureContent />
      </SafeAreaView>
    </React.StrictMode>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f4f5f7', flex: 1 },
  content: { gap: 12, padding: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  section: { backgroundColor: 'white', gap: 10, padding: 12 },
  buttonGrid: { gap: 8 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  control: { backgroundColor: '#dfe8ff', padding: 12 },
  input: { borderColor: '#889', borderWidth: 1, padding: 8 },
});
