/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from "@hyperion/hook/src/Channel";
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import * as Types from "@hyperion/hyperion-util/src/Types";
import React from "react";

export type InitOptions = Types.Options<
  {
    channel: Channel<AutoLogging.ALChannelEvent>
  }
>;

let _channell: InitOptions['channel'] | null = null;
export function init(options: InitOptions) {
  _channell = options.channel;
}

type Props = React.PropsWithChildren<{
  channel: Channel<AutoLogging.ALChannelEvent>
}>;

export function ElementTextTooltip(props: Props): React.ReactNode {
  const channel = props.channel ?? _channell;
  const [label, setLabel] = React.useState<string>('');
  if (channel) {
    React.useEffect(() => {
      const listener = channel.addListener('al_ui_event', event => {
        const { elementText } = event;
        if (elementText) {
          setLabel(`${elementText.source}:${elementText.text}`);
        }
      });
      return () => {
        channel.removeListener('al_ui_event', listener);
      }
    });
  }
  return (<>
    <div>
      <label>{label}</label>
    </div>
    {props.children}
  </>);
}