import Taro from "@tarojs/taro";
import { createRecordService } from "./base";
import type { ExerciseRecord } from "../types";

const baseService = createRecordService<ExerciseRecord>("exercise_records");

const RECENT_EXERCISES_KEY = "recent_exercises";
const MAX_RECENT_EXERCISES = 50;

function getRecentExercises(): string[] {
  const stored = Taro.getStorageSync(RECENT_EXERCISES_KEY);
  return Array.isArray(stored) ? stored : [];
}

function addRecentExercise(exerciseType: string) {
  const existing = getRecentExercises();
  const updated = [exerciseType, ...existing.filter((e) => e !== exerciseType)].slice(
    0,
    MAX_RECENT_EXERCISES,
  );
  Taro.setStorageSync(RECENT_EXERCISES_KEY, updated);
}

export const exerciseService = {
  ...baseService,

  async add(data: Omit<ExerciseRecord, "_id" | "userId" | "createdAt">): Promise<string> {
    const id = await baseService.add(data);
    addRecentExercise(data.type);
    return id;
  },

  getTopExercises(limit = 10): string[] {
    const recentExercises = getRecentExercises();
    const exerciseCount = new Map<string, number>();
    for (const exercise of recentExercises) {
      exerciseCount.set(exercise, (exerciseCount.get(exercise) || 0) + 1);
    }

    return [...exerciseCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([exercise]) => exercise);
  },
};
