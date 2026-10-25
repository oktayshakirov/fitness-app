import type { Muscle } from "../content/types";
export interface TrainingSet {
  reps: number;
  weightKg: number;
}
export interface LogEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  timestamp: number;
  sets: TrainingSet[];
  note: string;
  primary: Muscle[];
  secondary: Muscle[];
}
export function validateSets(sets: TrainingSet[]) {
  if (
    sets.length > 100 ||
    sets.some(
      (s) =>
        !Number.isInteger(s.reps) ||
        s.reps < 1 ||
        s.reps > 1000 ||
        !Number.isFinite(s.weightKg) ||
        s.weightKg < 0 ||
        s.weightKg > 5000,
    )
  )
    throw new Error("Enter valid reps and a non-negative weight for each set.");
}
