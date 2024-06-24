/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from "react";
import { SyncChannel } from "../Channel";
import { ALChannelEvent } from "@hyperion/hyperion-autologging/src/AutoLogging";
import { ALSessionGraph } from "@hyperion/hyperion-autologging-visualizer/src/component/ALSessionGraph.react";
import { ALGraphInfo } from "@hyperion/hyperion-autologging-visualizer/src/component/ALGraphInfo.react";
import { LocalStoragePersistentData } from "@hyperion/hyperion-util/src/PersistentData";
import { ALFlowletEvent } from "@hyperion/hyperion-autologging/src/ALType";
import * as  ALGraph from "@hyperion/hyperion-autologging-visualizer/src/component/ALGraph";
import { getEventExtension } from "@hyperion/hyperion-autologging/src/ALEventExtension";

function EventInfoViewer(props: { eventInfo: ALGraph.EventInfos }): React.ReactNode {
  const { eventInfo } = props;
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (ref.current) {
      const snapshot = getEventExtension<{ snapshot: string }>(eventInfo.eventData, 'autologging')?.snapshot;
      if (snapshot) {
        ref.current.innerHTML = snapshot;
      }
    }
  }, [eventInfo]);

  return <table>
    <thead>
      <tr>
        <th colSpan={2}>{eventInfo.eventName}[{eventInfo.eventData.event}]</th>
      </tr>
    </thead>
    <tbody>
      {
        Object.entries(eventInfo.eventData).map(prop => {
          const [key, value] = prop;
          return <tr key={key}><th>{key}</th><td>{String(value)}</td></tr>
        })
      }
    </tbody>
    <tfoot >
      <tr>
        <th>Snapshot</th>
        <td>
          <div ref={ref}></div>
        </td>
      </tr>
    </tfoot>
  </table>
}

export default function () {
  // Better to first setup listeners before initializing AutoLogging so we don't miss any events (e.g. Heartbeat(START))

  return <ALGraphInfo
    channel={SyncChannel}
    width="99%"
    height="1000px"
    renderer={eventInfo => <EventInfoViewer eventInfo={eventInfo} />}
  // graphFilter='edge, node[label !^= "al_surface"]'
  />
}