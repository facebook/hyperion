import { AUTO_LOGGING_SURFACE } from "./ALSurfaceConsts";

const SURFACE_SELECTOR = `[${AUTO_LOGGING_SURFACE}]`;

export function getSurfacePath(node: HTMLElement | null): string| null {
  return getAncestralSurfaceNode(node)?.getAttribute(AUTO_LOGGING_SURFACE) ?? null;
}

export function getAncestralSurfaceNode(node: Element| null): Element| null {
  return node?.closest(SURFACE_SELECTOR) ?? null;
}
