import hitRegions from "./hit-regions.json";
import type { BodyView, Muscle } from "./types";
type Regions = Record<string, Partial<Record<Muscle, number[][]>>>;
/** Muscle under a point in the body view's 800×1000 frame, or undefined. */
export function muscleAt(
  view: BodyView,
  x: number,
  y: number,
  regions: Regions = hitRegions as Regions,
) {
  const map = regions[view.hitRegions.path];
  if (!map) return undefined;
  for (const [muscle, rings] of Object.entries(map) as [Muscle, number[][]][]) {
    let inside = false;
    for (const ring of rings)
      for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const [xi, yi, xj, yj] = [
          ring[i]!,
          ring[i + 1]!,
          ring[j]!,
          ring[j + 1]!,
        ];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
          inside = !inside;
      }
    if (inside) return muscle;
  }
  return undefined;
}
