import * as fs from "fs";
import * as path from "path";

const MODELS = ["Qwen/Qwen3.5-35B-A3B", "zai-org/GLM-4.6V", "PaddlePaddle/PaddleOCR-VL-1.5"];

const SYSTEM_PROMPT = `请识别图片中的所有文字，按原始布局输出。`;

async function imageToBase64(filePath: string): Promise<string> {
  const absolutePath = filePath.startsWith("~")
    ? path.join(process.env.HOME || "", filePath.slice(1))
    : filePath;
  const buffer = fs.readFileSync(absolutePath);
  return buffer.toString("base64");
}

async function testModel(model: string, imageBase64: string): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing model: ${model}`);
  console.log("=".repeat(60));

  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    console.error("Error: SILICONFLOW_API_KEY environment variable is not set");
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
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
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "请识别图片中的所有文字。",
              },
            ],
          },
        ],
        stream: false,
      }),
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    if (!response.ok) {
      const error = await response.text();
      console.error(`Error: ${response.status} - ${error}`);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`\nTime: ${duration.toFixed(2)}s`);
    console.log(`\nResponse:`);
    console.log(content);

    // Parse CSV and count indicators
    const lines = content
      .trim()
      .split("\n")
      .filter((line: string) => line.trim() && line.includes(","));
    console.log(`\nIndicators found: ${lines.length}`);

    // Show token usage if available
    if (data.usage) {
      console.log(
        `\nTokens: prompt=${data.usage.prompt_tokens}, completion=${data.usage.completion_tokens}, total=${data.usage.total_tokens}`,
      );
    }
  } catch (error) {
    console.error(`Error testing ${model}:`, error);
  }
}

async function main() {
  const imagePath = "~/Downloads/labtest2_converted.jpg";
  console.log(`Loading image: ${imagePath}`);

  const imageBase64 = await imageToBase64(imagePath);
  console.log(`Image size: ${(imageBase64.length / 1024).toFixed(2)} KB (base64)`);

  for (const model of MODELS) {
    await testModel(model, imageBase64);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test completed");
}

main().catch(console.error);
