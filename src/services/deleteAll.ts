import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";

const COLLECTIONS = ["stool_records", "symptom_records", "meal_records", "medication_records"];

async function deleteCollection(collection: string, userId: string): Promise<void> {
  const db = getDatabase();
  const PAGE_SIZE = 20;

  // 分页获取所有记录并删除
  while (true) {
    const res = await db.collection(collection).where({ userId }).limit(PAGE_SIZE).get();
    if (res.data.length === 0) break;

    for (const doc of res.data as { _id: string }[]) {
      await db.collection(collection).doc(doc._id).remove();
    }
  }
}

async function deleteUserSettings(userId: string): Promise<void> {
  const db = getDatabase();
  try {
    await db.collection("user_settings").doc(userId).remove();
  } catch {
    // User settings may not exist
  }
}

async function deleteCloudFiles(userId: string): Promise<void> {
  try {
    // List and delete user's cloud files (avatar, exports)
    const fileList = await Taro.cloud.getTempFileURL({
      fileList: [
        `cloud://cloud1-8gzx205084c1da0f.636c-cloud1-8gzx205084c1da0f-1255262839/${userId}/avatar.jpg`,
      ],
    });

    const existingFiles = fileList.fileList.filter((f) => f.status === 0).map((f) => f.fileID);

    if (existingFiles.length > 0) {
      await Taro.cloud.deleteFile({ fileList: existingFiles });
    }
  } catch {
    // Files may not exist
  }
}

export async function deleteAllUserData(): Promise<void> {
  const userId = await getOpenId();

  // Delete all records in parallel
  await Promise.all([
    ...COLLECTIONS.map((col) => deleteCollection(col, userId)),
    deleteUserSettings(userId),
    deleteCloudFiles(userId),
  ]);
}

export async function confirmAndDeleteAllData(): Promise<void> {
  return new Promise((resolve) => {
    Taro.showModal({
      title: "确认删除",
      content: "将删除所有健康记录和个人资料，此操作无法撤销",
      confirmText: "继续",
      confirmColor: "#ff4d4f",
      success: (res) => {
        if (res.confirm) {
          // Second confirmation
          Taro.showModal({
            title: "最后确认",
            content: "确定要删除全部数据吗？",
            confirmText: "删除",
            confirmColor: "#ff4d4f",
            success: async (res2) => {
              if (res2.confirm) {
                Taro.showLoading({ title: "正在删除...", mask: true });
                try {
                  await deleteAllUserData();
                  Taro.hideLoading();
                  Taro.showToast({ title: "数据已删除", icon: "success" });
                } catch (error) {
                  Taro.hideLoading();
                  console.error("删除失败:", error);
                  Taro.showToast({ title: "删除失败，请重试", icon: "none" });
                }
              }
              resolve();
            },
          });
        } else {
          resolve();
        }
      },
    });
  });
}
