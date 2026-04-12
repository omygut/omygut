import { createRecordService } from "./base";
import type { MealRecord } from "../types";

export const mealService = createRecordService<MealRecord>("meal_records");
