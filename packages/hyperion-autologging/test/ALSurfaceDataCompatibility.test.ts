/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

'use strict';

import { ALSurfaceData } from '../src/ALSurfaceData';
import type { IALFlowlet } from '../src/ALFlowletManager';
import type { ALSurfaceCapability, EventMetadata } from '../src/ALSurfaceTypes';

let nextSurfaceID = 0;

function createSurface(
  surfaceName: string,
  surface: string,
  parent: ALSurfaceData | typeof ALSurfaceData.root = ALSurfaceData.root,
  capability?: ALSurfaceCapability,
  uiEventMetadata?: EventMetadata
): ALSurfaceData {
  nextSurfaceID++;
  return new ALSurfaceData(
    surfaceName,
    surface,
    parent,
    `${surface}:non-interactive:${nextSurfaceID}`,
    {} as IALFlowlet,
    capability,
    {},
    uiEventMetadata,
    'data-al-surface-test',
    `surface-${nextSurfaceID}`
  );
}

describe('web ALSurfaceData compatibility contract', () => {
  it('keeps root, registry, element lookup, and removal behavior', () => {
    const surfaceName = `registered-${nextSurfaceID + 1}`;
    const surface = `/compatibility/${surfaceName}`;
    const data = createSurface(surfaceName, surface);
    const element = document.createElement('div');
    element.setAttribute(data.domAttributeName, data.domAttributeValue);
    document.body.appendChild(element);

    expect(ALSurfaceData.root.surface).toBeNull();
    expect(ALSurfaceData.root.parent).toBeNull();
    expect(ALSurfaceData.root.isRemovable()).toBe(false);
    expect(ALSurfaceData.tryGet(surface)).toBe(data);
    expect(ALSurfaceData.get(surface)).toBe(data);
    expect(data.getElements()).toEqual([]);
    expect(data.getElements(true)).toEqual([element]);

    data.addElement(element);
    expect(data.getElements()).toEqual([element]);
    data.removeElement(element);
    element.remove();
    expect(data.remove()).toBe(true);
    expect(ALSurfaceData.tryGet(surface)).toBeUndefined();
  });

  it('inherits later parent values and preserves child overrides', () => {
    const parentName = `parent-${nextSurfaceID + 1}`;
    const parent = createSurface(parentName, `/compatibility/${parentName}`);
    const childName = `child-${nextSurfaceID + 1}`;
    const child = createSurface(
      childName,
      `${parent.surface}/${childName}`,
      parent
    );

    parent.setInheritedPropery('shared-value', 'first');
    expect(child.getInheritedPropery('shared-value')).toBe('first');
    parent.setInheritedPropery('shared-value', 'second');
    expect(child.getInheritedPropery('shared-value')).toBe('second');
    child.setInheritedPropery('shared-value', 'child');
    parent.setInheritedPropery('shared-value', 'third');
    expect(parent.getInheritedPropery('shared-value')).toBe('third');
    expect(child.getInheritedPropery('shared-value')).toBe('child');
    expect(parent.isRemovable()).toBe(false);
    expect(child.isRemovable()).toBe(false);
  });

  it('merges inherited UI event metadata by event name', () => {
    const parentName = `metadata-parent-${nextSurfaceID + 1}`;
    const parent = createSurface(
      parentName,
      `/compatibility/${parentName}`,
      ALSurfaceData.root,
      undefined,
      {
        click: {
          inherited: 'parent',
          shared: 'parent',
        },
      }
    );
    const childName = `metadata-child-${nextSurfaceID + 1}`;
    const child = createSurface(
      childName,
      `${parent.surface}/${childName}`,
      parent,
      undefined,
      {
        click: {
          local: 'child',
          shared: 'child',
        },
      }
    );

    expect(child.getInheriteUIEventMetadata('click')).toEqual({
      inherited: 'parent',
      local: 'child',
      shared: 'child',
    });
  });

  it('keeps non-interactive surfaces out of global lookup', () => {
    const parentName = `interactive-parent-${nextSurfaceID + 1}`;
    const parent = createSurface(parentName, `/compatibility/${parentName}`);
    const childName = `non-interactive-${nextSurfaceID + 1}`;
    const child = createSurface(childName, parent.surface, parent, {
      nonInteractive: true,
    });

    expect(parent.getChild(childName)).toBe(child);
    expect(ALSurfaceData.tryGet(parent.surface)).toBe(parent);
    expect(ALSurfaceData.tryGet(child.nonInteractiveSurface)).toBeUndefined();
  });

  it('preserves name-keyed replacement and removal semantics', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const parentName = `replacement-parent-${nextSurfaceID + 1}`;
    const parent = createSurface(parentName, `/compatibility/${parentName}`);
    const childName = `replacement-child-${nextSurfaceID + 1}`;
    const first = createSurface(childName, parent.surface, parent, {
      nonInteractive: true,
    });
    const second = createSurface(childName, parent.surface, parent, {
      nonInteractive: true,
    });

    expect(parent.getChild(childName)).toBe(second);
    expect(first.remove()).toBe(true);
    expect(parent.getChild(childName)).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
