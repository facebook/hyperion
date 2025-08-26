/**
 * React Native Surface Implementation
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as React from "react";
import * as AutoLoggingWrapper from "./AutoLoggingWrapper";

export interface SurfaceCapability {
  nonInteractive?: boolean;
  trackVisibilityThreshold?: number;
}

export interface RNSurfaceProps {
  surface: string;
  capability?: SurfaceCapability;
  metadata?: Record<string, any>;
}

interface SurfaceContextValue {
  surface: string | null;
  nonInteractiveSurface: string | null;
}

const SurfaceContext = React.createContext<SurfaceContextValue>({
  surface: null,
  nonInteractiveSurface: null,
});

/**
 * Hook to get current surface context
 */
export function useSurfaceContext(): SurfaceContextValue {
  return React.useContext(SurfaceContext);
}

function SurfaceComponent(props: React.PropsWithChildren<RNSurfaceProps>) {
  const { surface, capability, metadata = {}, children } = props;
  const parentContext = useSurfaceContext();

  const surfacePath = parentContext.surface
    ? `${parentContext.surface}/${surface}`
    : `/${surface}`;

  const nonInteractiveSurfacePath = parentContext.nonInteractiveSurface
    ? `${parentContext.nonInteractiveSurface}/${surface}`
    : `/${surface}`;

  React.useEffect(() => {
      AutoLoggingWrapper.trackSurfaceMount(
        surfacePath,
        nonInteractiveSurfacePath,
        parentContext.surface,
        capability,
        metadata
      );

      return () => {
        AutoLoggingWrapper.trackSurfaceUnmount(surfacePath, nonInteractiveSurfacePath);
      };
  }, [surfacePath, nonInteractiveSurfacePath, parentContext.surface, capability?.trackVisibilityThreshold]);

  // Context value for child surfaces
  const contextValue: SurfaceContextValue = {
    surface: capability?.nonInteractive ? parentContext.surface : surfacePath,
    nonInteractiveSurface: nonInteractiveSurfacePath,
  };

  return (
    <SurfaceContext.Provider value={contextValue}>
      {children}
    </SurfaceContext.Provider>
  );
}

/**
 * Main Surface HOC for React Native - renders children completely as-is
 */
export const Surface = (props: RNSurfaceProps) => {
  return (children: React.ReactNode) => {
    return <SurfaceComponent {...props}>{children}</SurfaceComponent>;
  };
};

/**
 * Component-style Surface wrapper - renders children as-is
 */
export function SurfaceComp(props: React.PropsWithChildren<RNSurfaceProps>) {
  return <SurfaceComponent {...props} />;
}
