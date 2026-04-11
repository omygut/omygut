import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";
import type { MedicalRecord } from "../types";

const COLLECTION = "medical_records";
const CLOUD_PATH_PREFIX = "medical-images";

// 上传图片到云存储
export async function uploadImage(filePath: string): Promise<string> {
  const userId = await getOpenId();
  const timestamp = Date.now();
  const ext = filePath.split(".").pop() || "jpg";
  const cloudPath = `${CLOUD_PATH_PREFIX}/${userId}/${timestamp}_${Math.random().toString(36).slice(2)}.${ext}`;

  const res = await Taro.cloud.uploadFile({
    cloudPath,
    filePath,
  });

  return res.fileID;
}

// 批量上传图片
export async function uploadImages(filePaths: string[]): Promise<string[]> {
  const results = await Promise.all(filePaths.map((path) => uploadImage(path)));
  return results;
}

// 添加医疗检查记录
export async function addMedicalRecord(
  data: Omit<MedicalRecord, "_id" | "userId" | "createdAt">,
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

// 获取最近的医疗检查记录
export async function getRecentMedicalRecords(limit: number = 20): Promise<MedicalRecord[]> {
  const db = getDatabase();
  const userId = await getOpenId();

  const res = await db
    .collection(COLLECTION)
    .where({ userId })
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return res.data as MedicalRecord[];
}

// 删除医疗检查记录
export async function deleteMedicalRecord(id: string): Promise<void> {
  const db = getDatabase();

  await db.collection(COLLECTION).doc(id).remove();
}
