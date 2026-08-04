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
import { getALRuntimeChannel } from './ALChannel';
import { getExplicitText } from './ALMetadata';
import { isALRuntimeEnabled } from './ALRuntime';
import { getScreenId } from './ALSession';
import { useSurface } from './ALSurface';
import type { SurfaceMetadata } from './ALTypes';

const DEFAULT_MINIMUM_VIEW_TIME_MS = 500;
const DEFAULT_ITEM_VISIBLE_PERCENT_THRESHOLD = 50;
export const MAX_DEDUPED_ITEMS_PER_SCREEN = 2_000;

export interface ALViewToken<Item> {
  item: Item;
  key: string;
  index: number | null;
  isViewable: boolean;
}

export interface ALViewabilityInfo<Item> {
  viewableItems: readonly ALViewToken<Item>[];
  changed: readonly ALViewToken<Item>[];
}

export interface ALViewabilityConfig {
  minimumViewTime?: number;
  itemVisiblePercentThreshold?: number;
  viewAreaCoveragePercentThreshold?: number;
  waitForInteraction?: boolean;
}

export interface ALListViewabilityOptions<Item> {
  listName: string;
  getItemName?: (item: Item, index: number | null) => string | null | undefined;
  metadata?: SurfaceMetadata;
  onViewableItemsChanged?: (info: ALViewabilityInfo<Item>) => void;
  viewabilityConfig?: ALViewabilityConfig;
}

export interface ALListViewabilityResult<Item> {
  onViewableItemsChanged(info: ALViewabilityInfo<Item>): void;
  viewabilityConfig: ALViewabilityConfig;
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
  itemKeys: Set<string>;
  listName?: string;
  screenId: string;
}

export function useALListViewability<Item>(
  options: ALListViewabilityOptions<Item>
): ALListViewabilityResult<Item> {
  const surface = useSurface();
  const committedOptions = useRef<CommittedOptions<Item>>({});
  const dedupeState = useRef<DedupeState>({
    itemKeys: new Set(),
    screenId: getScreenId(),
  });
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
  if (!isALRuntimeEnabled() || options.listName == null) return;
  const channel = getALRuntimeChannel();
  if (channel == null) return;
  const screenId = getScreenId();
  if (dedupe.screenId !== screenId || dedupe.listName !== options.listName) {
    dedupe.screenId = screenId;
    dedupe.listName = options.listName;
    dedupe.itemKeys.clear();
  }
  for (const token of changed) {
    if (!token.isViewable || !rememberItem(dedupe.itemKeys, token.key))
      continue;
    let itemName: string | undefined;
    try {
      itemName = getExplicitText(
        options.getItemName?.(token.item, token.index) ?? undefined
      );
    } catch {
      // Item label extraction must not interrupt list viewability handling.
    }
    channel.emitSafely('al_list_impression_request', {
      timestamp: Date.now(),
      listName: options.listName,
      itemName,
      itemIndex: token.index,
      surface: options.surface,
      surfaceMetadata: options.surfaceMetadata,
      metadata: options.metadata,
    });
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
  const config: ALViewabilityConfig = {
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
