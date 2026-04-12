import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";

const COLLECTION = "user_settings";

interface UserSettings {
  _id?: string;
  userId: string;
  nickname?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 获取当前用户设置
export async function getUserSettings(): Promise<UserSettings> {
  const db = getDatabase();
  const userId = await getOpenId();

  try {
    const res = await db.collection(COLLECTION).where({ userId }).limit(1).get();

    if (res.data && res.data.length > 0) {
      return res.data[0] as UserSettings;
    }
  } catch {
    // 用户设置不存在
  }

  // 返回默认值
  return {
    userId,
  };
}

// 获取默认昵称
export function getDefaultNickname(userId: string): string {
  return `微信用户 ${userId.slice(-4)}`;
}

// 更新用户设置（如果不存在则创建）
export async function updateUserSettings(data: {
  nickname?: string;
  avatar?: string;
}): Promise<void> {
  const db = getDatabase();
  const userId = await getOpenId();

  // 查找现有记录
  const res = await db.collection(COLLECTION).where({ userId }).limit(1).get();

  if (res.data && res.data.length > 0) {
    // 更新现有记录
    const doc = res.data[0] as UserSettings;
    await db
      .collection(COLLECTION)
      .doc(doc._id!)
      .update({
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
  } else {
    // 创建新记录
    await db.collection(COLLECTION).add({
      data: {
        userId,
        ...data,
        createdAt: new Date(),
      },
    });
  }
}

// 上传头像到云存储
export async function uploadAvatar(tempFilePath: string): Promise<string> {
  const openId = await getOpenId();
  const cloudPath = `${openId}/avatar.jpg`;

  const res = await Taro.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath,
  });

  return res.fileID;
}
