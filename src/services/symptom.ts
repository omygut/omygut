import { createRecordService } from "./base";
import type { SymptomRecord } from "../types";

export const symptomService = createRecordService<SymptomRecord>("symptom_records");
