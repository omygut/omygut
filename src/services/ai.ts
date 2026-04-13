import type { LabTestIndicator } from "../types";

const MODEL = "Qwen/Qwen3-VL-32B-Instruct";

const LAB_TEST_PROMPT = `识别化验单图片中的指标，返回CSV格式（无表头）。

列：名称,数值,单位

示例：
白细胞,6.5,10^9/L
红细胞,3.2,10^12/L

只返回CSV，无其他文字。`;

const EXAM_PROMPT = `识别这张检查报告（B超/CT/MRI/肠镜/胃镜等）的检查日期和完整内容。

返回JSON格式：
{"date": "YYYY-MM-DD", "content": "报告完整内容"}

要求：
1. date: 提取报告中的检查日期，格式为YYYY-MM-DD，如找不到则返回空字符串
2. content: 完整提取报告中的所有检查内容，包括检查所见、检查结果、诊断结论等，不要遗漏任何信息，保持原文格式

只返回JSON，无其他文字。`;

type MessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

interface Message {
  role: string;
  content: MessageContent;
}

declare const wx: {
  cloud: {
    extend: {
      AI: {
        createModel(name: string): {
          streamText(options: {
            data: { model: string; messages: Message[] };
          }): Promise<{ eventStream: AsyncIterable<{ data: string }> }>;
        };
      };
    };
  };
  getFileSystemManager(): {
    readFile(options: {
      filePath: string;
      encoding: string;
      success: (res: { data: string }) => void;
      fail: (error: unknown) => void;
    }): void;
  };
};

async function imageToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: "base64",
      success: (res) => resolve(res.data),
      fail: reject,
    });
  });
}

export async function recognizeLabTestImage(imageFilePath: string): Promise<LabTestIndicator[]> {
  try {
    const base64 = await imageToBase64(imageFilePath);
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    const res = await wx.cloud.extend.AI.createModel("siliconflow-custom").streamText({
      data: {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: LAB_TEST_PROMPT,
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

    let fullResponse = "";
    for await (const event of res.eventStream) {
      if (event.data === "[DONE]") {
        break;
      }
      try {
        const data = JSON.parse(event.data);
        const text = data?.choices?.[0]?.delta?.content;
        if (text) {
          fullResponse += text;
        }
      } catch {
        // 忽略解析错误
      }
    }

    console.log("AI 响应:", fullResponse);

    // 解析 CSV 响应
    const lines = fullResponse
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const indicators: LabTestIndicator[] = [];

    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length >= 2) {
        indicators.push({
          name: parts[0]?.trim() || "",
          value: parts[1]?.trim() || "",
          unit: parts[2]?.trim() || undefined,
        });
      }
    }

    return indicators;
  } catch (error) {
    console.error("AI 识别失败:", error);
    throw error;
  }
}

export interface ExamRecognitionResult {
  date: string; // YYYY-MM-DD or empty
  content: string; // 报告完整内容
}

export async function recognizeExamReport(
  imageFilePath: string
): Promise<ExamRecognitionResult> {
  try {
    const base64 = await imageToBase64(imageFilePath);
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    const res = await wx.cloud.extend.AI.createModel("siliconflow-custom").streamText({
      data: {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: EXAM_PROMPT,
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
                text: "请识别这张检查报告的检查日期和诊断结论。",
              },
            ],
          },
        ],
      },
    });

    let fullResponse = "";
    for await (const event of res.eventStream) {
      if (event.data === "[DONE]") {
        break;
      }
      try {
        const data = JSON.parse(event.data);
        const text = data?.choices?.[0]?.delta?.content;
        if (text) {
          fullResponse += text;
        }
      } catch {
        // 忽略解析错误
      }
    }

    console.log("AI 响应:", fullResponse);

    // 解析 JSON 响应
    try {
      const result = JSON.parse(fullResponse.trim());
      return {
        date: result.date || "",
        content: result.content || "",
      };
    } catch {
      // 如果解析失败，将整个响应作为内容
      return {
        date: "",
        content: fullResponse.trim(),
      };
    }
  } catch (error) {
    console.error("AI 识别失败:", error);
    throw error;
  }
}
