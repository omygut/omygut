import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";
import type {
  ExportData,
  StoolRecord,
  SymptomRecord,
  MealRecord,
  MedicationRecord,
  LabTestRecord,
  ExamRecord,
} from "../types";

async function getAllRecords<T>(collection: string, userId: string): Promise<T[]> {
  const db = getDatabase();
  const res = await db.collection(collection).where({ userId }).get();
  return res.data as T[];
}

export async function exportAllData(): Promise<ExportData> {
  const userId = await getOpenId();

  const [stoolRecords, symptomRecords, mealRecords, medicationRecords, labtestRecords, examRecords] =
    await Promise.all([
      getAllRecords<StoolRecord>("stool_records", userId),
      getAllRecords<SymptomRecord>("symptom_records", userId),
      getAllRecords<MealRecord>("meal_records", userId),
      getAllRecords<MedicationRecord>("medication_records", userId),
      getAllRecords<LabTestRecord>("labtest_records", userId),
      getAllRecords<ExamRecord>("exam_records", userId),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    stool_records: stoolRecords,
    symptom_records: symptomRecords,
    meal_records: mealRecords,
    medication_records: medicationRecords,
    labtest_records: labtestRecords,
    exam_records: examRecords,
  };
}

// Cached file path for two-step export
let preparedFilePath: string | null = null;
let preparedFileName: string | null = null;

async function prepareExportFile(): Promise<void> {
  const data = await exportAllData();
  const jsonString = JSON.stringify(data, null, 2);

  const fs = Taro.getFileSystemManager();
  const fileName = `mygut-export-${new Date().toISOString().split("T")[0]}.json`;
  const filePath = `${Taro.env.USER_DATA_PATH}/${fileName}`;

  await new Promise<void>((resolve, reject) => {
    fs.writeFile({
      filePath,
      data: jsonString,
      encoding: "utf8",
      success: () => resolve(),
      fail: (err) => reject(err),
    });
  });

  preparedFilePath = filePath;
  preparedFileName = fileName;
}

function shareFile(): void {
  if (!preparedFilePath || !preparedFileName) return;

  wx.shareFileMessage({
    filePath: preparedFilePath,
    fileName: preparedFileName,
    success: () => {
      Taro.showToast({ title: "导出成功", icon: "success" });
    },
    fail: (err: { errMsg?: string }) => {
      if (!err.errMsg?.includes("cancel")) {
        Taro.showToast({ title: "分享失败", icon: "none" });
      }
    },
  });
}

export async function saveExportToFile(): Promise<void> {
  Taro.showLoading({ title: "正在准备数据...", mask: true });

  try {
    await prepareExportFile();
    Taro.hideLoading();

    // Show modal, user tap triggers shareFileMessage
    Taro.showModal({
      title: "数据已准备好",
      content: "点击确定将文件发送到聊天，可转发给「文件传输助手」保存",
      confirmText: "发送",
      success: (res) => {
        if (res.confirm) {
          shareFile();
        }
      },
    });
  } catch (error) {
    Taro.hideLoading();
    console.error("导出失败:", error);
    Taro.showToast({ title: "导出失败，请重试", icon: "none" });
  }
}
