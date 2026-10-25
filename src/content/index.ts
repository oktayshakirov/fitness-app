import raw from "./bundled.json";
import { bundledAssets } from "./bundled-assets";
import type {
  CameraView,
  ContentRelease,
  ContentRepository,
  Exercise,
  Model,
} from "./types";
export const content: ContentRepository = {
  release: raw as ContentRelease,
  resolve: (asset) => {
    const source = bundledAssets[asset.path];
    if (source === undefined)
      throw new Error(`Missing bundled asset: ${asset.path}`);
    return source;
  },
};
export const exercises = content.release.exercises;
export function mediaFor(exercise: Exercise, model: Model) {
  const selected =
    exercise.media[model] ?? exercise.media.male ?? exercise.media.female;
  if (!selected) throw new Error(`No approved media for ${exercise.id}`);
  return {
    views: selected,
    model: exercise.media[model]
      ? model
      : exercise.media.male
        ? "male"
        : "female",
  };
}
export const viewLabels: Record<CameraView, string> = {
  front: "Front",
  side: "Side",
  threeq: "¾",
  back: "Back",
  foot: "Foot",
  rear: "Rear",
};
export function label(value: string) {
  return value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
