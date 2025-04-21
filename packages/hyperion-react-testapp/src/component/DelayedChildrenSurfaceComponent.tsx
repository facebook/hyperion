/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { SimpleSurface } from './Surface';

export default function DelayedChildrenSurfaceComponent(): React.ReactElement {
  return (<_DelayedSurface skey="A"><_DelayedSurface skey="B"/></_DelayedSurface>);
}


function _DelayedSurface(props : {
  skey: string;
  children?: React.ReactNode | undefined;
}): React.ReactElement {
  const [showChildren, setShowChildren] = useState(false);
  const [delayMs, setDelayMs] = useState(10000);
  const [manualControl, setManualControl] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  // Effect to handle automatic showing of children after delay
  useEffect(() => {
    if (!manualControl) {
      const timer = setTimeout(() => {
        setShowChildren(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [delayMs, manualControl, resetCounter]);

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setDelayMs(isNaN(value) ? 1000 : value);
  };

  const handleManualToggle = () => {
    setManualControl(!manualControl);
    if (!manualControl) {
      // When switching to manual, don't automatically show children
      setShowChildren(false);
    }
  };

  const handleShowChildren = () => {
    setShowChildren(true);
  };

  const handleHideChildren = () => {
    setShowChildren(false);
  };

  return (
    <div>
      <h3>Surface ({props.skey}) with Delayed Children</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>
          <input
            type="checkbox"
            checked={manualControl}
            onChange={handleManualToggle}
          />
          Manual Control
        </label>
      </div>

      {manualControl ? (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleShowChildren}>Show Children</button>
          <button onClick={handleHideChildren} style={{ marginLeft: '10px' }}>Hide Children</button>
        </div>
      ) : (
        <div style={{ marginBottom: '10px' }}>
          <label>
            Delay (ms):
            <input
              type="number"
              value={delayMs}
              onChange={handleDelayChange}
              style={{ marginLeft: '5px' }}
            />
          </label>
          <button
            onClick={() => {
              setShowChildren(false);
              setResetCounter(prev => prev + 1);
            }}
            style={{ marginLeft: '10px' }}
          >
            Reset
          </button>
        </div>
      )}

      <div style={{ padding: '10px', border: '1px dashed #ccc' }}>
        <SimpleSurface surface={`DelayedSurface${props.skey}`} capability={{ trackVisibilityThreshold: 0.5 }}>
            {showChildren ? (
              <>
                <div>Child content is now visible!</div>
                <div>This tests the observer switching from parent to child.</div>
                {props.children}
              </>
            ) : null}
        </SimpleSurface>
      </div>
    </div>
  );
}
