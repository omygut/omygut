import type { LabTestIndicator } from "../types";

const MODEL = "Qwen/Qwen3-VL-32B-Instruct";

const LAB_TEST_PROMPT = `识别化验单图片中的指标，返回CSV格式（无表头）。

列：名称,数值,单位

示例：
白细胞,6.5,10^9/L
红细胞,3.2,10^12/L

只返回CSV，无其他文字。`;

const FOOD_PROMPT = `识别这张食物图片中的主要食物。

返回JSON格式：
{"foods": ["食物1", "食物2", ...]}

要求：
1. 识别图片中能看到的主要食物
2. 最多返回5种食物
3. 优先使用以下常用名称：米饭、炒饭、粥、面条、意面、饺子、馄饨、包子、馒头、煎饼、卷饼、面包、三明治、汉堡、热狗、披萨、寿司、沙拉、鸡蛋、牛奶、酸奶、豆浆、鸡肉、鸡腿、鸭肉、猪肉、牛肉、牛排、羊肉、排骨、培根、鱼、虾、螃蟹、龙虾、青菜、白菜、土豆、玉米、西红柿、黄瓜、胡萝卜、西兰花、南瓜、茄子、苹果、香蕉、橙子、西瓜、葡萄、草莓、桃子、梨、芒果、猕猴桃、樱桃、饼干、坚果、薯条、爆米花、糖果、巧克力、布丁、月饼、蛋糕、冰淇淋、咖啡、茶、果汁、可乐、奶茶、啤酒、红酒
4. 如果食物不在上述列表中，使用简洁的中文名称
5. 只返回JSON，无其他文字`;

const EXAM_PROMPT = `识别这张检查报告的检查名称、类型、日期和完整内容。

返回JSON格式：
{"examName": "具体检查名称", "examType": "类型代码", "date": "YYYY-MM-DD", "content": "报告完整内容"}

要求：
1. examName: 具体检查名称，如"胸部CT"、"肠道超声"、"腰椎MRI"、"结肠镜检查"等
2. examType: 根据检查类型返回对应代码：
   - ultrasound: B超/超声（腹部超声、肠道超声、盆腔超声等）
   - ct: CT扫描（胸部CT、腹部CT等）
   - mri: MRI/核磁共振
   - colonoscopy: 肠镜/结肠镜
   - gastroscopy: 胃镜
   - xray: X光/X射线
   - other: 其他类型
3. date: 提取报告中的检查日期，格式为YYYY-MM-DD，如找不到则返回空字符串
4. content: 完整提取报告中的所有检查内容，包括检查所见、检查结果、诊断结论等，不要遗漏任何信息，保持原文格式

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
  examName: string; // 具体检查名称，如"胸部CT"
  examType: string; // 类型代码：ultrasound, ct, mri, colonoscopy, gastroscopy, xray, other
  date: string; // YYYY-MM-DD or empty
  content: string; // 报告完整内容
}

export async function recognizeExamReport(imageFilePath: string): Promise<ExamRecognitionResult> {
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
        examName: result.examName || "",
        examType: result.examType || "",
        date: result.date || "",
        content: result.content || "",
      };
    } catch {
      // 如果解析失败，将整个响应作为内容
      return {
        examName: "",
        examType: "",
        date: "",
        content: fullResponse.trim(),
      };
    }
  } catch (error) {
    console.error("AI 识别失败:", error);
    throw error;
  }
}

export async function recognizeFoodImage(imageFilePath: string): Promise<string[]> {
  try {
    const base64 = await imageToBase64(imageFilePath);
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    const res = await wx.cloud.extend.AI.createModel("siliconflow-custom").streamText({
      data: {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: FOOD_PROMPT,
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
                text: "请识别这张图片中的食物。",
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
      const foods = result.foods || [];
      // 确保最多返回5个
      return foods.slice(0, 5);
    } catch {
      return [];
    }
  } catch (error) {
    console.error("AI 识别失败:", error);
    throw error;
  }
}
