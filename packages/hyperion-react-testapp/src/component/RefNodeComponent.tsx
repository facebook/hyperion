/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { SurfaceComp } from './Surface';

// Utility to merge multiple refs
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (node: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

const ComponenetWithRefs: React.FC<{ externalRef?: React.Ref<HTMLElement> }> = ({ externalRef }) => {
  const internalRef = useRef<HTMLElement | null>(null);

  const combinedRef = mergeRefs<HTMLElement>(externalRef, internalRef);

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.style.border = '2px solid blue';
      internalRef.current.textContent = 'Merged using useMergeRefs!';
    }
  }, []);

  return (
    <div
      ref={combinedRef}
      style={{ padding: '12px', marginTop: '20px', backgroundColor: '#eee' }}
    >
    A box with merged refs.
    </div>
  );
};

// Component that uses a merged ref
type RefNodeComponentProps = {
  externalRef?: React.Ref<HTMLElement>;
};

export const RefNodeComponent: React.FC<RefNodeComponentProps> = () => {
  const [element, setElement] = useState<HTMLElement | null>(null);

  // External callback ref
  const externalRef = (node: HTMLElement | null) => {
    console.log('External ref called with:', node);
    setElement(node);
  };

  return (
    <SurfaceComp surface='nodeRefs'>
      <div style={{ padding: '20px' }}>
        <h3>React Merged Ref Example</h3>
        <ComponenetWithRefs externalRef={externalRef} />
        {element && (
          <p>
            The tag name of the externally tracked element is: <strong>{element.tagName}</strong>
          </p>
        )}
      </div>
    </SurfaceComp>
  );

};
