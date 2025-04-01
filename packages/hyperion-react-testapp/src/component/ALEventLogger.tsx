/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { ALChannelEvent } from "hyperion-autologging/src/AutoLogging";
import { LocalStoragePersistentData } from "hyperion-util/src/PersistentData";
import * as React from "react";
import { SyncChannel } from "../Channel";

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

function EventField<T extends keyof ALChannelEvent>(props: {
  eventName: T,
  logger: (ev: ALChannelEvent[T][0]) => (string | null | undefined)[]
}) {
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
        const logger = props.logger;
        const extra = logger(ev);
        console.log(eventName, ev, performance.now(), ...extra);
      }
    });
    return () => { SyncChannel.on(eventName).remove(handler); };
  }, [eventName, checked]);

  return <tr>
    <td><input type="checkbox" id={eventName} onChange={onChange} defaultChecked={checked} ></input></td>
    <td align="left"><label htmlFor={eventName}>{eventName}</label></td>
  </tr>;
}

export default function () {
  // Better to first setup listeners before initializing AutoLogging so we don't miss any events (e.g. Heartbeat(START))

  return <div style={{ display: "flex", justifyContent: "space-around" }}>
    <table>
      <tbody>
        <EventField eventName='al_ui_event' logger={ev => [ev.surface, ev.triggerFlowlet?.getFullName()]}></EventField>
        <EventField eventName='al_surface_mutation_event' logger={ev => [ev.surface, ev.triggerFlowlet?.getFullName()]}></EventField>
        <EventField eventName='al_surface_visibility_event' logger={ev => [ev.surface, ev.triggerFlowlet?.getFullName()]}></EventField>
        <EventField eventName='al_network_request' logger={ev => [ev.triggerFlowlet?.getFullName()]}></EventField>
        <EventField eventName='al_network_response' logger={ev => [ev.triggerFlowlet?.getFullName()]}></EventField>
        <EventField eventName='al_flowlet_event' logger={ev => [ev.flowlet?.getFullName()]}></EventField>
        <EventField eventName='al_custom_event' logger={ev => [ev.triggerFlowlet?.getFullName()]}></EventField>
        <EventField eventName='al_surface_mount' logger={ev => [ev.surface,]}></EventField>
        <EventField eventName='al_surface_unmount' logger={ev => [ev.surface,]}></EventField>
        <EventField eventName='al_heartbeat_event' logger={ev => []}></EventField>
        <EventField eventName='al_ui_event_capture' logger={ev => [ev.surface,]}></EventField>
        <EventField eventName='al_ui_event_bubble' logger={ev => []}></EventField>
      </tbody>
    </table>
  </div>;
}