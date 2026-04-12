import Taro from "@tarojs/taro";
import type { LabTestIndicator } from "../types";

// 视觉模型 - 支持图片识别
const VISION_MODEL = "Pro/Qwen/Qwen2.5-VL-72B-Instruct";

const SYSTEM_PROMPT = `你是一个专业的医学化验单识别助手。请分析用户上传的化验单图片，提取所有化验指标信息。

对于每个指标，请提取：
- name: 指标名称
- value: 检测数值
- unit: 单位（如有）
- reference: 参考范围（如有）
- abnormal: 是否异常（true/false，根据参考范围判断，或根据图片上的标记如↑↓等）

请以 JSON 数组格式返回，例如：
[
  {"name": "白细胞", "value": "6.5", "unit": "10^9/L", "reference": "4.0-10.0", "abnormal": false},
  {"name": "红细胞", "value": "3.2", "unit": "10^12/L", "reference": "4.0-5.5", "abnormal": true}
]

只返回 JSON 数组，不要包含其他文字说明。如果无法识别任何指标，返回空数组 []。`;

/**
 * 将图片文件转换为 base64
 */
async function imageToBase64(filePath: string): Promise<string> {
  const fs = Taro.getFileSystemManager();
  return new Promise((resolve, reject) => {
    fs.readFile({
      filePath,
      encoding: "base64",
      success: (res) => resolve(res.data as string),
      fail: reject,
    });
  });
}

/**
 * 识别化验单图片中的指标
 */
export async function recognizeLabTestImage(imageFilePath: string): Promise<LabTestIndicator[]> {
  try {
    // 将图片转换为 base64
    const base64 = await imageToBase64(imageFilePath);
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    // 调用视觉模型（非流式）
    const model = Taro.cloud.extend.AI.createModel("siliconflow-custom");

    const res = await model.generateText({
      data: {
        model: VISION_MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: "请识别这张化验单上的所有指标。",
              },
            ],
          },
        ],
      },
    });

    const fullResponse = res.text || "";

    // 解析 JSON 响应
    const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("无法解析 AI 响应:", fullResponse);
      return [];
    }

    const indicators = JSON.parse(jsonMatch[0]) as LabTestIndicator[];
    return indicators;
  } catch (error) {
    console.error("AI 识别失败:", error);
    throw error;
  }
}
