import { getDatabase, getOpenId } from "../utils/cloud";
import type { SymptomRecord } from "../types";

const COLLECTION = "symptom_records";

// 添加症状记录
export async function addSymptomRecord(
  data: Omit<SymptomRecord, "_id" | "userId" | "createdAt">,
): Promise<string> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db.collection(COLLECTION).add({
    data: {
      ...data,
      userId,
      createdAt: new Date(),
    },
  });

  return res._id as string;
}

// 获取最近的症状记录
export async function getRecentSymptomRecords(limit: number = 20): Promise<SymptomRecord[]> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db
    .collection(COLLECTION)
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return res.data as SymptomRecord[];
}

// 删除症状记录
export async function deleteSymptomRecord(id: string): Promise<void> {
  const db = getDatabase();

  await db.collection(COLLECTION).doc(id).remove();
}
