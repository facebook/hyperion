/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ALSurfaceData,
  type ALSurfaceDataNode,
  type ALSurfaceDataRoot,
} from 'hyperion-react-native';
import {
  clearDebugEvents,
  DEBUG_EVENT_TYPES,
  type DebugEvent,
  type EventType,
} from './EventStore';

type EventFilter = EventType | 'all';

const EVENT_LABELS: Readonly<Record<EventType, string>> = {
  al_ui_event: 'UI',
  al_surface_mutation_event: 'Surface',
  al_heartbeat_event: 'Heartbeat',
  al_custom_event: 'Custom',
  al_app_state_event: 'App state',
  al_screen_transition_event: 'Screen',
  al_list_impression_event: 'List',
  al_deep_link_event: 'Deep link',
  al_react_error_event: 'React error',
};

export function AutoLoggingInspector({
  events,
}: {
  events: readonly DebugEvent[];
}): React.JSX.Element {
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedSequence, setSelectedSequence] = useState<number | null>(null);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const visibleEvents = useMemo(
    () =>
      events
        .filter((entry) => filter === 'all' || entry.eventType === filter)
        .slice()
        .reverse(),
    [events, filter]
  );
  const selected = events.find((entry) => entry.sequence === selectedSequence);
  const counts = useMemo(() => {
    const result = Object.fromEntries(
      DEBUG_EVENT_TYPES.map((eventType) => [eventType, 0])
    ) as Record<EventType, number>;
    for (const entry of events) result[entry.eventType]++;
    return result;
  }, [events]);

  return (
    <View style={styles.inspector} testID="autologging-inspector">
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Application event inspector</Text>
          <Text style={styles.caption}>
            {events.length} retained events (max 250)
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clearDebugEvents();
            setSelectedSequence(null);
          }}
          style={styles.smallButton}
          testID="clear-event-log"
        >
          <Text>Clear</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <FilterChip
          active={filter === 'all'}
          count={events.length}
          label="All"
          onPress={() => setFilter('all')}
        />
        {DEBUG_EVENT_TYPES.map((eventType) => (
          <FilterChip
            active={filter === eventType}
            count={counts[eventType]}
            key={eventType}
            label={EVENT_LABELS[eventType]}
            onPress={() => setFilter(eventType)}
          />
        ))}
      </ScrollView>

      <ScrollView
        nestedScrollEnabled
        style={styles.eventList}
        testID="event-log-list"
      >
        {visibleEvents.length === 0 ? (
          <Text style={styles.empty}>No events match this filter yet.</Text>
        ) : (
          visibleEvents.map((entry) => (
            <Pressable
              accessibilityLabel={`Inspect ${
                EVENT_LABELS[entry.eventType]
              } event ${entry.event.eventIndex}`}
              key={entry.sequence}
              onPress={() =>
                setSelectedSequence((current) =>
                  current === entry.sequence ? null : entry.sequence
                )
              }
              style={[
                styles.eventRow,
                selectedSequence === entry.sequence && styles.selectedRow,
              ]}
              testID={`event-row-${entry.sequence}`}
            >
              <Text style={styles.eventKind}>
                {EVENT_LABELS[entry.eventType]}
              </Text>
              <Text style={styles.eventSummary} numberOfLines={1}>
                #{entry.event.eventIndex} {summarizeEvent(entry)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {selected != null ? (
        <View style={styles.payload} testID="selected-event-payload">
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>
              {showEnvelope ? 'Transport envelope' : 'Public event payload'}
            </Text>
            <Pressable
              onPress={() => setShowEnvelope((value) => !value)}
              style={styles.smallButton}
            >
              <Text>{showEnvelope ? 'Show event' : 'Show envelope'}</Text>
            </Pressable>
          </View>
          <Text selectable style={styles.json}>
            {prettyJSON(showEnvelope ? selected.envelope : selected.event)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function SurfaceTreeInspector({
  revision,
}: {
  revision: number;
}): React.JSX.Element {
  const children = ALSurfaceData.root.getChildren();
  return (
    <View style={styles.inspector} testID="surface-tree-inspector">
      <Text style={styles.title}>Committed ALSurfaceData tree</Text>
      <Text style={styles.caption}>
        Registry revision {revision}; only committed, mounted nodes are shown.
      </Text>
      <SurfaceTreeNode node={ALSurfaceData.root} depth={0} />
      {children.length === 0 ? (
        <Text style={styles.empty}>No committed surfaces.</Text>
      ) : null}
    </View>
  );
}

function SurfaceTreeNode({
  node,
  depth,
}: {
  node: ALSurfaceDataNode | ALSurfaceDataRoot;
  depth: number;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = node.getChildren();
  const isRoot = node === ALSurfaceData.root;
  const data = isRoot ? null : (node as ALSurfaceDataNode);
  return (
    <View style={[styles.treeNode, { marginLeft: depth * 12 }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setExpanded((value) => !value)}
        style={styles.treeHeader}
      >
        <Text style={styles.disclosure}>{expanded ? '−' : '+'}</Text>
        <Text style={styles.treeName}>
          {isRoot ? 'root' : data?.surfaceName}
        </Text>
        <Text style={styles.treeCount}>{children.length} child(ren)</Text>
      </Pressable>
      {expanded && data != null ? (
        <View style={styles.treeDetails}>
          <Text selectable style={styles.mono}>
            lifecycle: {data.nonInteractiveSurface}
          </Text>
          <Text selectable style={styles.mono}>
            interactive: {data.surface || '(root)'}
          </Text>
          <Text style={styles.mono}>
            parent: {data.parent.surface ?? 'root'} · non-interactive:{' '}
            {String(data.nonInteractive)}
          </Text>
          <Text selectable style={styles.json}>
            {prettyJSON(data.toJSON())}
          </Text>
        </View>
      ) : null}
      {expanded
        ? children.map((child) => (
            <SurfaceTreeNode
              depth={depth + 1}
              key={child.nonInteractiveSurface}
              node={child}
            />
          ))
        : null}
    </View>
  );
}

function FilterChip({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean;
  count: number;
  label: string;
  onPress(): void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.activeChip]}
    >
      <Text style={active && styles.activeChipText}>
        {label} {count}
      </Text>
    </Pressable>
  );
}

function summarizeEvent(entry: DebugEvent): string {
  const event = entry.event as unknown as Record<string, unknown>;
  return String(
    event.eventName ??
      event.elementName ??
      event.surfacePath ??
      event.screen ??
      event.listName ??
      event.targetURI ??
      event.heartbeatType ??
      event.appState ??
      event.errorName ??
      event.event
  );
}

function prettyJSON(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item: unknown) => {
      if (item instanceof Error)
        return { name: item.name, message: item.message };
      return item;
    },
    2
  );
}

const styles = StyleSheet.create({
  inspector: { backgroundColor: 'white', gap: 10, padding: 12 },
  title: { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 14, fontWeight: '600' },
  caption: { color: '#596273', fontSize: 12 },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: { backgroundColor: '#e5e9f2', borderRadius: 4, padding: 8 },
  chip: {
    backgroundColor: '#edf0f5',
    borderRadius: 16,
    marginRight: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  activeChip: { backgroundColor: '#244ca3' },
  activeChipText: { color: 'white' },
  eventList: { gap: 4, maxHeight: 320 },
  eventRow: {
    alignItems: 'center',
    borderColor: '#d9deea',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  selectedRow: { backgroundColor: '#eaf0ff', borderColor: '#244ca3' },
  eventKind: { fontSize: 11, fontWeight: '700', width: 70 },
  eventSummary: { flex: 1, fontFamily: 'Courier', fontSize: 11 },
  payload: { backgroundColor: '#f4f6fa', gap: 8, padding: 10 },
  empty: { color: '#596273', fontStyle: 'italic' },
  json: { fontFamily: 'Courier', fontSize: 10 },
  mono: { fontFamily: 'Courier', fontSize: 10 },
  treeNode: { borderLeftColor: '#b8c0cf', borderLeftWidth: 1, paddingLeft: 6 },
  treeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 5,
  },
  disclosure: { fontSize: 16, width: 14 },
  treeName: { fontWeight: '600' },
  treeCount: { color: '#596273', fontSize: 10 },
  treeDetails: { backgroundColor: '#f7f8fb', gap: 3, padding: 7 },
});
