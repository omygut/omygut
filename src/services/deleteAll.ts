import Taro from "@tarojs/taro";
import { COLORS } from "../constants/colors";
import { getDatabase, getOpenId } from "../utils/cloud";

const COLLECTIONS = [
  "stool_records",
  "symptom_records",
  "meal_records",
  "medication_records",
  "labtest_records",
  "exam_records",
  "assessment_records",
];

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

export async function deleteAllUserData(): Promise<void> {
  const userId = await getOpenId();

  // Delete all records in parallel
  await Promise.all(COLLECTIONS.map((col) => deleteCollection(col, userId)));
}

export async function confirmAndDeleteAllData(): Promise<void> {
  return new Promise((resolve) => {
    // First confirmation: remind to export
    Taro.showModal({
      title: "删除前请先导出",
      content: "建议先导出数据备份，删除后将无法恢复",
      confirmText: "继续删除",
      confirmColor: COLORS.red,
      success: (res) => {
        if (res.confirm) {
          // Second confirmation
          Taro.showModal({
            title: "确认删除",
            content: "将从服务器上删除所有健康记录，此操作无法撤销",
            confirmText: "继续",
            confirmColor: COLORS.red,
            success: (res2) => {
              if (res2.confirm) {
                // Third confirmation
                Taro.showModal({
                  title: "最后确认",
                  content: "确定要删除全部数据吗？",
                  confirmText: "删除",
                  confirmColor: COLORS.red,
                  success: async (res3) => {
                    if (res3.confirm) {
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
        } else {
          resolve();
        }
      },
    });
  });
}
