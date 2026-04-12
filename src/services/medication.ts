import { createRecordService } from "./base";
import type { MedicationRecord } from "../types";

export const medicationService = createRecordService<MedicationRecord>("medication_records");
