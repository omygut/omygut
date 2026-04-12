import type { LabTestIndicator } from "../types";

const MODEL = "Qwen/Qwen3-VL-32B-Instruct";

const SYSTEM_PROMPT = `识别化验单图片中的指标，返回CSV格式（无表头）。

列：名称,数值,单位

示例：
白细胞,6.5,10^9/L
红细胞,3.2,10^12/L

只返回CSV，无其他文字。`;

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
