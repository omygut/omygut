import { getDatabase, getOpenId } from "../utils/cloud";
import type { HealthRecord } from "../types";

const COLLECTION = "health_records";

// 添加身体状态记录
export async function addHealthRecord(
  data: Omit<HealthRecord, "_id" | "userId" | "createdAt">,
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

// 获取最近的身体状态记录
export async function getRecentHealthRecords(limit: number = 20): Promise<HealthRecord[]> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db
    .collection(COLLECTION)
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return res.data as HealthRecord[];
}

// 删除身体状态记录
export async function deleteHealthRecord(id: string): Promise<void> {
  const db = getDatabase();

  await db.collection(COLLECTION).doc(id).remove();
}
