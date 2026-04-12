import Taro from "@tarojs/taro";
import { getOpenId } from "./cloud";

/**
 * 上传图片到云存储
 * 路径: {userId}/labtest_images/{timestamp}_{random}.jpg
 */
export async function uploadImage(tempFilePath: string): Promise<string> {
  const userId = await getOpenId();
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const cloudPath = `${userId}/labtest_images/${timestamp}_${random}.jpg`;

  const res = await Taro.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath,
  });

  return res.fileID;
}

/**
 * 选择图片（相册或拍照）
 */
export async function chooseImage(count = 1): Promise<string[]> {
  const res = await Taro.chooseImage({
    count,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
  });
  return res.tempFilePaths;
}

/**
 * 删除云存储文件
 */
export async function deleteCloudFile(fileId: string): Promise<void> {
  await Taro.cloud.deleteFile({
    fileList: [fileId],
  });
}
