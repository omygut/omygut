import { createRecordService } from "./base";
import type { StoolRecord } from "../types";

export const stoolService = createRecordService<StoolRecord>("stool_records");
