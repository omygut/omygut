import { getDatabase, getOpenId } from "../utils/cloud";
import type { MealRecord } from "../types";

const COLLECTION = "meal_records";

// 添加饮食记录
export async function addMealRecord(
  data: Omit<MealRecord, "_id" | "userId" | "createdAt">,
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

// 获取最近的饮食记录
export async function getRecentMealRecords(limit: number = 20): Promise<MealRecord[]> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db
    .collection(COLLECTION)
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return res.data as MealRecord[];
}

// 删除饮食记录
export async function deleteMealRecord(id: string): Promise<void> {
  const db = getDatabase();

  await db.collection(COLLECTION).doc(id).remove();
}
