/**
 * 从 CSV 生成 lab-indicators.ts
 * 运行: pnpm tsx scripts/generate-lab-indicators.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const csvPath = join(__dirname, "../src/data/lab-indicators.csv");
const outputPath = join(__dirname, "../src/data/lab-indicators.ts");

const csv = readFileSync(csvPath, "utf-8");
const lines = csv.trim().split("\n");
const header = lines[0].split(",");

const indicators = lines.slice(1).map((line) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);

  const obj: Record<string, unknown> = {};
  header.forEach((key, i) => {
    const value = values[i]?.trim() || "";
    if (!value) return;

    if (key === "refMin" || key === "refMax") {
      obj[key] = parseFloat(value);
    } else if (key === "aliases") {
      obj[key] = value.split("|").filter(Boolean);
    } else {
      obj[key] = value;
    }
  });

  return obj;
});

const output = `// 此文件由 scripts/generate-lab-indicators.ts 自动生成
// 请勿手动编辑，修改请编辑 src/data/lab-indicators.csv

import type { StandardIndicator } from "../services/lab-standards";

export const STANDARD_INDICATORS: StandardIndicator[] = ${JSON.stringify(indicators, null, 2)};
`;

writeFileSync(outputPath, output);
console.log(`Generated ${outputPath} with ${indicators.length} indicators`);
