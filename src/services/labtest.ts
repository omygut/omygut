import { createRecordService } from "./base";
import type { LabTestRecord } from "../types";

export const labTestService = createRecordService<LabTestRecord>("labtest_records");
