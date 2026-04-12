import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";
import type { User } from "../types";

const COLLECTION = "users";

// 获取当前用户信息
export async function getCurrentUser(): Promise<User> {
  const db = getDatabase();
  const openId = await getOpenId();

  try {
    const res = (await db.collection(COLLECTION).doc(openId).get()) as { data: User | null };

    if (res.data) {
      return res.data;
    }
  } catch {
    // 用户不存在
  }

  // 用户不存在，返回默认值
  return {
    _id: openId,
    createdAt: new Date(),
  };
}

// 获取默认昵称
export function getDefaultNickname(openId: string): string {
  return `微信用户 ${openId.slice(-4)}`;
}

// 更新用户信息（如果用户不存在则创建）
export async function updateUser(data: { nickname?: string; avatar?: string }): Promise<void> {
  const db = getDatabase();
  const openId = await getOpenId();

  try {
    // 先尝试更新
    await db
      .collection(COLLECTION)
      .doc(openId)
      .update({
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
  } catch {
    // 用户不存在，创建新记录
    await db.collection(COLLECTION).add({
      data: {
        _id: openId,
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
