import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";
import type {
  ExportData,
  StoolRecord,
  SymptomRecord,
  MealRecord,
  MedicationRecord,
} from "../types";

async function getAllRecords<T>(collection: string, userId: string): Promise<T[]> {
  const db = getDatabase();
  const res = await db.collection(collection).where({ userId }).get();
  return res.data as T[];
}

export async function exportAllData(): Promise<ExportData> {
  const userId = await getOpenId();

  const [stoolRecords, symptomRecords, mealRecords, medicationRecords] = await Promise.all([
    getAllRecords<StoolRecord>("stool_records", userId),
    getAllRecords<SymptomRecord>("symptom_records", userId),
    getAllRecords<MealRecord>("meal_records", userId),
    getAllRecords<MedicationRecord>("medication_records", userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    stool_records: stoolRecords,
    symptom_records: symptomRecords,
    meal_records: mealRecords,
    medication_records: medicationRecords,
  };
}

export async function saveExportToFile(): Promise<void> {
  Taro.showLoading({ title: "正在导出...", mask: true });

  try {
    const data = await exportAllData();
    const jsonString = JSON.stringify(data, null, 2);

    // Write to temp file
    const fs = Taro.getFileSystemManager();
    const tempPath = `${Taro.env.USER_DATA_PATH}/mygut-export.json`;

    await new Promise<void>((resolve, reject) => {
      fs.writeFile({
        filePath: tempPath,
        data: jsonString,
        encoding: "utf8",
        success: () => resolve(),
        fail: (err) => reject(err),
      });
    });

    // Upload to cloud storage
    const userId = await getOpenId();
    const timestamp = Date.now();
    const cloudPath = `${userId}/exports/export-${timestamp}.json`;

    const uploadRes = await Taro.cloud.uploadFile({
      cloudPath,
      filePath: tempPath,
    });

    // Download to local
    const { tempFilePath } = await Taro.cloud.downloadFile({
      fileID: uploadRes.fileID,
    });

    Taro.hideLoading();

    // Save to system file manager
    const date = new Date().toISOString().split("T")[0];
    const fileName = `mygut-export-${date}.json`;

    // @ts-ignore - saveFileToPlatform is not in Taro types yet
    await Taro.saveFileToPlatform({
      filePath: tempFilePath,
      fileName,
    });

    Taro.showToast({ title: "导出成功", icon: "success" });
  } catch (error) {
    Taro.hideLoading();
    console.error("导出失败:", error);

    // User cancelled save - silent handling
    if ((error as { errMsg?: string })?.errMsg?.includes("cancel")) {
      return;
    }

    Taro.showToast({ title: "导出失败，请重试", icon: "none" });
  }
}
