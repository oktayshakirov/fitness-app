export const muscleIds = [
  "chest",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "lats",
  "traps",
  "middle_back",
  "lower_back",
  "adductors",
  "abductors",
  "neck",
] as const;
export type Muscle = (typeof muscleIds)[number];
export type Model = "male" | "female";
export type CameraView = "front" | "side" | "threeq" | "back" | "foot" | "rear";
/** Serialized media references are independent of Metro and hosting. */
export interface MediaAsset {
  path: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}
export interface ExerciseView {
  video: MediaAsset;
  poster: MediaAsset;
}
export interface Exercise {
  id: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: string[];
  steps: string[];
  cues: string[];
  mistakes: string[];
  breathing: string;
  source: string;
  media: Partial<Record<Model, Partial<Record<CameraView, ExerciseView>>>>;
}
export interface BodyView {
  base: MediaAsset;
  masks: Partial<Record<Muscle, MediaAsset>>;
  hitRegions: MediaAsset;
}
export interface ContentRelease {
  schemaVersion: 1;
  minAppSchema: number;
  contentVersion: string;
  exercises: Exercise[];
  bodymap: Partial<Record<Model, Partial<Record<"front" | "back", BodyView>>>>;
  heroes: Partial<Record<Model, MediaAsset>>;
  attribution: string;
}
export type MediaSource = number | { uri: string };
export interface ContentRepository {
  release: ContentRelease;
  resolve: (asset: MediaAsset) => MediaSource;
}
