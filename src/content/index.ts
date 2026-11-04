import raw from "./bundled.json";
import bundledHits from "./hit-regions.json";
import { bundledAssets } from "./bundled-assets";
import { loadDeviceContent } from "./device";
import { muscleAt as muscleIn } from "./hits";
import { NO_EQUIPMENT, equipmentOf, filterExercises, type ExerciseFilter } from "./query";
import type { Bundled, HitRegions } from "./remote";
import {
  equipmentCategories,
  type BodyView,
  type CameraView,
  type ContentRelease,
  type ContentRepository,
  type EquipmentCategory,
  type Exercise,
  type MediaAsset,
  type Model,
} from "./types";
/** Exercise videos and posters are rendered on white (MVP request of 2026-10-26). */
export const mediaBackground = "#FFFFFF";
export const bundled: Bundled = {
  release: raw as ContentRelease,
  hits: bundledHits as HitRegions,
  assets: bundledAssets,
};
/** Chosen once per JS start: a verified downloaded release, else the bundle. */
const loaded = loadDeviceContent(bundled);
export const content: ContentRepository = {
  release: loaded.release,
  resolve: loaded.resolve,
};
export const contentOrigin = loaded.origin;
/** Muscle under a point in the active release's body view. */
export const muscleAt = (view: BodyView, x: number, y: number) =>
  muscleIn(view, x, y, loaded.hits);
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
/** The clip used for grid posters and thumbnails. */
export function coverFor(exercise: Exercise, model: Model) {
  const views = mediaFor(exercise, model).views;
  return views.threeq ?? views.side ?? Object.values(views)[0]!;
}
export const viewOrder: CameraView[] = [
  "threeq",
  "front",
  "side",
  "back",
  "rear",
  "top",
  "foot",
];
/** Short names for the camera angle picker (checked against the v0.3.0 renders). */
export const viewLabels: Record<CameraView, string> = {
  front: "Front",
  side: "Side",
  threeq: "Angled",
  back: "Back",
  foot: "Foot end",
  rear: "Rear angle",
  top: "Above",
};
/** Spoken hint: where the camera is. */
export const viewHints: Record<CameraView, string> = {
  front: "Camera faces you from the front",
  side: "Camera at your side, in profile",
  threeq: "Camera at a three-quarter angle",
  back: "Camera directly behind you",
  foot: "Camera at the foot end of the bench",
  rear: "Camera behind you at an angle",
  top: "Camera looking straight down from above",
};
export function label(value: string) {
  return value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
export function bodyFor(model: Model) {
  return (
    content.release.bodymap[model] ??
    content.release.bodymap.male ??
    content.release.bodymap.female
  );
}
/** Equipment chips: the release's icon categories, or one chip per catalog id. */
export const equipmentFilters: {
  id: string;
  title: string;
  icon?: MediaAsset;
  equipment: string[];
}[] = content.release.equipmentIcons
  ? equipmentCategories
      .filter((c) => content.release.equipmentIcons?.[c])
      .map((c: EquipmentCategory) => ({
        id: c,
        title: label(c),
        icon: content.release.equipmentIcons![c]!.icon,
        equipment: content.release.equipmentIcons![c]!.equipment,
      }))
      .filter((f) =>
        exercises.some(
          (e) =>
            e.equipment.some((q) => f.equipment.includes(q)) ||
            (f.id === NO_EQUIPMENT && !e.equipment.length),
        ),
      )
  : [...new Set(exercises.flatMap((e) => e.equipment))]
      .sort()
      .map((id) => ({ id, title: label(id), equipment: [id] }));
const groups = Object.fromEntries(
  equipmentFilters.map((f) => [f.id, f.equipment]),
);
export const filterCatalog = (filter: ExerciseFilter) =>
  filterExercises(exercises, filter, groups);
/** "Barbell · Bench"; exercises that need nothing read "Bodyweight". */
export function equipmentSummary(exercise: Exercise) {
  if (!exercise.equipment.length) return label(NO_EQUIPMENT);
  const named = equipmentFilters
    .filter((f) => equipmentOf(exercise).some((q) => f.equipment.includes(q)))
    .map((f) => f.title);
  return (named.length ? named : exercise.equipment.map(label)).join(" · ");
}
