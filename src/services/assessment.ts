import { createRecordService } from "./base";
import type { AssessmentRecord } from "../types";

export const assessmentService = createRecordService<AssessmentRecord>("assessment_records");
