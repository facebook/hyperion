import { AUTO_LOGGING_SURFACE } from "./ALSurfaceConsts";

const SURFACE_SELECTOR = `[${AUTO_LOGGING_SURFACE}]`;

export function getSurfacePath(node: HTMLElement | null): string| null {
  const surfacePath = getAncestralSurfaceNode(node)?.getAttribute(AUTO_LOGGING_SURFACE);
  if (surfacePath != undefined) {
    return surfacePath;
  }
  return null;
}

export function getAncestralSurfaceNode(node: Element| null): Element| null {
  const surfaceNode = node?.closest(SURFACE_SELECTOR);
  if (surfaceNode != undefined) {
    return surfaceNode;
  }
  return null;
}
