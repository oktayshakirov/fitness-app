import raw from "./bundled.json";
import { bundledAssets } from "./bundled-assets";
import { filterExercises, type ExerciseFilter } from "./query";
import {
  equipmentCategories,
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
export const viewLabels: Record<CameraView, string> = {
  front: "Front",
  side: "Side",
  threeq: "¾",
  back: "Back",
  foot: "Foot",
  rear: "Rear",
  top: "Top",
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
        exercises.some((e) => e.equipment.some((q) => f.equipment.includes(q))),
      )
  : [...new Set(exercises.flatMap((e) => e.equipment))]
      .sort()
      .map((id) => ({ id, title: label(id), equipment: [id] }));
const groups = Object.fromEntries(
  equipmentFilters.map((f) => [f.id, f.equipment]),
);
export const filterCatalog = (filter: ExerciseFilter) =>
  filterExercises(exercises, filter, groups);
export function equipmentSummary(exercise: Exercise) {
  const named = equipmentFilters
    .filter((f) => exercise.equipment.some((q) => f.equipment.includes(q)))
    .map((f) => f.title);
  return (named.length ? named : exercise.equipment.map(label)).join(" · ");
}
export { muscleAt } from "./hits";
