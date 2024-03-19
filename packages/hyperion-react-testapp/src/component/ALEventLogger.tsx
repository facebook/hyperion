/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from "react";
import { SyncChannel } from "../Channel";
import { ALChannelEvent } from "@hyperion/hyperion-autologging/src/AutoLogging";
import { ALSessionGraph } from "@hyperion/hyperion-autologging-visualizer/src/component/ALSessionGraph.react";
import { LocalStoragePersistentData } from "@hyperion/hyperion-util/src/PersistentData";
import { ALFlowletEvent } from "@hyperion/hyperion-autologging/src/ALType";

const EventsWithFlowlet = [
  'al_ui_event',
  'al_surface_mutation_event',
  'al_network_request',
  'al_network_response',
  'al_flowlet_event',
  'al_custom_event',
  'al_element_value_event',
] as const;

const EventsWithoutFlowlet = [
  'al_surface_mount',
  'al_surface_unmount',
  'al_heartbeat_event',
  'al_ui_event_capture',
  'al_ui_event_bubble',
] as const;

const PersistedValues: { [name: string]: LocalStoragePersistentData<boolean> } = {};
function persistedValue(name: string): LocalStoragePersistentData<boolean> {
  let value = PersistedValues[name];
  if (!value) {
    value = PersistedValues[name] = new LocalStoragePersistentData<boolean>(
      name,
      () => /^al_(ui|surface_mutation)_event$/.test(name),
      value => value ? '1' : '0',
      value => value === '1'
    );
  }
  return value;
}

function EventField<T extends keyof ALChannelEvent>(props: { eventName: T, onEnable: () => (() => void) }) {
  const { eventName } = props;
  const value = persistedValue(eventName);
  const [checked, setChecked] = React.useState<boolean>(value.getValue());

  const onChange = React.useCallback((event: React.ChangeEvent) => {
    const newValue = !checked;
    value.setValue(newValue);
    setChecked(newValue);
  }, [eventName, checked]);
  React.useLayoutEffect(() => {
    const handler = SyncChannel.on(eventName).add(ev => {
      // console.log(eventName, ev, performance.now(), ev.flowlet?.getFullName());
      if (checked) {
        console.log(eventName, ev, performance.now());
      }
    });
    return () => { SyncChannel.on(eventName).remove(handler); };
  }, [eventName, checked]);

  return <div>
    <input type="checkbox" id={eventName} onChange={onChange} defaultChecked={checked} ></input>
    <label htmlFor={eventName}>{eventName}</label>
  </div>;
}

export default function () {
  // Better to first setup listeners before initializing AutoLogging so we don't miss any events (e.g. Heartbeat(START))

  return <div>
    <div style={{ display: "flex", justifyContent: "space-around" }}>
      {
        EventsWithFlowlet.map(eventName =>
          <EventField key={eventName} eventName={eventName} onEnable={() => {
            const handler = SyncChannel.on(eventName).add(ev => {
              console.log(eventName, ev, performance.now(), ev.flowlet?.getFullName());
            });
            return () => SyncChannel.on(eventName).remove(handler);
          }} />
        ).concat(
          EventsWithoutFlowlet.map(eventName =>
            <EventField key={eventName} eventName={eventName} onEnable={() => {
              const handler = SyncChannel.on(eventName).add(ev => {
                console.log(eventName, ev, performance.now());
              });
              return () => SyncChannel.on(eventName).remove(handler);
            }} />
          )
        )
      }
    </div>
    <div>
      <ALSessionGraph />
    </div>
  </div>;
}