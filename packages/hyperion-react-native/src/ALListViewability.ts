/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import {
  useCallback,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from './ALRuntime';
import { useSurface } from './ALSurfaceContext';
import type {
  ALListImpressionEventData,
  ALReactNativeEventMap,
  SurfaceMetadata,
} from './ALTypes';

const DEFAULT_MINIMUM_VIEW_TIME_MS = 500;
const DEFAULT_ITEM_VISIBLE_PERCENT_THRESHOLD = 50;
export const MAX_DEDUPED_ITEMS_PER_SCREEN = 2_000;

interface ListRuntime {
  active: boolean;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly context: ALReactNativeRuntimeContext;
}

let listRuntime: ListRuntime | null = null;

export function reactNativeListImpressions<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-list-impressions',
    install(channel, context) {
      const runtime: ListRuntime = {
        active: false,
        channel:
          channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
        context,
      };
      listRuntime = runtime;
      return {
        start() {
          runtime.active = true;
        },
        dispose() {
          runtime.active = false;
          if (listRuntime === runtime) listRuntime = null;
        },
      };
    },
  };
}

export interface ALViewToken<Item> {
  readonly item: Item;
  readonly key: string;
  readonly index: number | null;
  readonly isViewable: boolean;
}

export interface ALViewabilityInfo<Item> {
  readonly viewableItems: readonly ALViewToken<Item>[];
  readonly changed: readonly ALViewToken<Item>[];
}

export interface ALViewabilityConfig {
  readonly minimumViewTime?: number;
  readonly itemVisiblePercentThreshold?: number;
  readonly viewAreaCoveragePercentThreshold?: number;
  readonly waitForInteraction?: boolean;
}

export interface ALListViewabilityOptions<Item> {
  readonly listName: string;
  readonly getItemName?: (
    item: Item,
    index: number | null
  ) => string | null | undefined;
  readonly metadata?: SurfaceMetadata;
  readonly onViewableItemsChanged?: (info: ALViewabilityInfo<Item>) => void;
  readonly viewabilityConfig?: ALViewabilityConfig;
}

export interface ALListViewabilityResult<Item> {
  onViewableItemsChanged(info: ALViewabilityInfo<Item>): void;
  readonly viewabilityConfig: ALViewabilityConfig;
}

interface CommittedOptions<Item> {
  getItemName?: ALListViewabilityOptions<Item>['getItemName'];
  listName?: string;
  metadata?: SurfaceMetadata;
  onViewableItemsChanged?: ALListViewabilityOptions<Item>['onViewableItemsChanged'];
  surface?: string;
  surfaceMetadata?: SurfaceMetadata;
}

interface DedupeState {
  readonly itemKeys: Set<string>;
  listName?: string;
  screenId?: string;
}

export function useALListViewability<Item>(
  options: ALListViewabilityOptions<Item>
): ALListViewabilityResult<Item> {
  const surface = useSurface();
  const committedOptions = useRef<CommittedOptions<Item>>({});
  const dedupeState = useRef<DedupeState>({ itemKeys: new Set() });
  const [viewabilityConfig] = useState(() =>
    createViewabilityConfig(options.viewabilityConfig)
  );
  useInsertionEffect(() => {
    committedOptions.current = {
      getItemName: options.getItemName,
      listName: getExplicitText(options.listName),
      metadata: options.metadata,
      onViewableItemsChanged: options.onViewableItemsChanged,
      surface: surface?.interactivePath || undefined,
      surfaceMetadata: surface?.interactiveMetadata,
    };
  }, [
    options.getItemName,
    options.listName,
    options.metadata,
    options.onViewableItemsChanged,
    surface,
  ]);
  const onViewableItemsChanged = useCallback(
    (info: ALViewabilityInfo<Item>) => {
      const committed = committedOptions.current;
      try {
        emitListImpressions(committed, dedupeState.current, info.changed);
      } catch {
        // Instrumentation is best-effort; the application callback still runs.
      }
      return committed.onViewableItemsChanged?.(info);
    },
    []
  );
  return useMemo(
    () => ({ onViewableItemsChanged, viewabilityConfig }),
    [onViewableItemsChanged, viewabilityConfig]
  );
}

function emitListImpressions<Item>(
  options: CommittedOptions<Item>,
  dedupe: DedupeState,
  changed: readonly ALViewToken<Item>[]
): void {
  const runtime = listRuntime;
  if (runtime?.active !== true || options.listName == null) return;
  const screenId = runtime.context.session.getScreenId();
  if (dedupe.screenId !== screenId || dedupe.listName !== options.listName) {
    dedupe.screenId = screenId;
    dedupe.listName = options.listName;
    dedupe.itemKeys.clear();
  }
  for (const token of changed) {
    if (!token.isViewable || !rememberItem(dedupe.itemKeys, token.key)) {
      continue;
    }
    let itemName: string | undefined;
    try {
      itemName = getExplicitText(
        options.getItemName?.(token.item, token.index) ?? undefined
      );
    } catch {
      // Item label extraction must not interrupt list viewability handling.
    }
    const itemIndex =
      Number.isInteger(token.index) && (token.index ?? -1) >= 0
        ? token.index ?? undefined
        : undefined;
    const surfaceMetadata = mergeMetadata(options.surfaceMetadata);
    const event = {
      ...runtime.context.eventFactory.createEvent({
        metadata: mergeMetadata(options.metadata),
      }),
      event: 'list_item_visible' as const,
      listName: options.listName,
    };
    setIfDefined(event, 'itemName', itemName);
    setIfDefined(event, 'itemIndex', itemIndex);
    setIfDefined(event, 'surface', options.surface);
    setIfDefined(
      event,
      'surfaceMetadata',
      Object.keys(surfaceMetadata).length === 0 ? undefined : surfaceMetadata
    );
    runtime.channel.emit(
      'al_list_impression_event',
      event as ALListImpressionEventData
    );
  }
}

function rememberItem(itemKeys: Set<string>, itemKey: string): boolean {
  if (itemKeys.has(itemKey)) return false;
  if (itemKeys.size >= MAX_DEDUPED_ITEMS_PER_SCREEN) {
    const oldestKey = itemKeys.values().next().value;
    if (oldestKey != null) itemKeys.delete(oldestKey);
  }
  itemKeys.add(itemKey);
  return true;
}

function createViewabilityConfig(
  input?: ALViewabilityConfig
): ALViewabilityConfig {
  const config: {
    minimumViewTime: number;
    itemVisiblePercentThreshold?: number;
    viewAreaCoveragePercentThreshold?: number;
    waitForInteraction?: boolean;
  } = {
    minimumViewTime: boundedNumber(
      input?.minimumViewTime,
      DEFAULT_MINIMUM_VIEW_TIME_MS,
      0,
      Number.MAX_SAFE_INTEGER
    ),
    ...(input?.waitForInteraction == null
      ? {}
      : { waitForInteraction: input.waitForInteraction }),
  };
  if (input?.viewAreaCoveragePercentThreshold != null) {
    config.viewAreaCoveragePercentThreshold = boundedNumber(
      input.viewAreaCoveragePercentThreshold,
      DEFAULT_ITEM_VISIBLE_PERCENT_THRESHOLD,
      0,
      100
    );
  } else {
    config.itemVisiblePercentThreshold = boundedNumber(
      input?.itemVisiblePercentThreshold,
      DEFAULT_ITEM_VISIBLE_PERCENT_THRESHOLD,
      0,
      100
    );
  }
  return config;
}

function boundedNumber(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  return value == null || !Number.isFinite(value)
    ? fallback
    : Math.min(maximum, Math.max(minimum, value));
}

function setIfDefined(target: object, key: string, value: unknown): void {
  if (value !== undefined) (target as Record<string, unknown>)[key] = value;
}

export default Object.freeze({
  MAX_DEDUPED_ITEMS_PER_SCREEN,
  reactNativeListImpressions,
  useALListViewability,
});
