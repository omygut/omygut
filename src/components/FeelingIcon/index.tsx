import { Image } from "@tarojs/components";
import { COLORS } from "../../constants/colors";

type FeelingLevel = 1 | 2 | 3 | 4 | 5;

// 1很差-红, 2较差-橙, 3一般-黄, 4良好-蓝, 5很好-绿
const FEELING_COLORS: Record<FeelingLevel, string> = {
  1: COLORS.red,
  2: COLORS.orange,
  3: COLORS.yellow,
  4: COLORS.lightBlue,
  5: COLORS.primary,
};

function generateFeelingSvg(level: FeelingLevel, active: boolean): string {
  const faceColor = active ? FEELING_COLORS[level] : "#e0e0e0";
  const lineColor = active ? "#333" : "#999";

  // 眼睛和嘴巴根据等级变化
  let eyes: string;
  let mouth: string;

  switch (level) {
    case 1: // 很差 - 紧闭眼睛，大哭嘴
      eyes = `
        <path d="M7 10 L10 8 L13 10" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M17 10 L20 8 L23 10" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      `;
      mouth = `<path d="M10 22 Q15 16 20 22" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
      break;
    case 2: // 较差 - 睁眼，难过嘴
      eyes = `
        <circle cx="10" cy="10" r="1.5" fill="${lineColor}"/>
        <circle cx="20" cy="10" r="1.5" fill="${lineColor}"/>
      `;
      mouth = `<path d="M10 21 Q15 17 20 21" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
      break;
    case 3: // 一般 - 睁眼，平嘴
      eyes = `
        <circle cx="10" cy="10" r="1.5" fill="${lineColor}"/>
        <circle cx="20" cy="10" r="1.5" fill="${lineColor}"/>
      `;
      mouth = `<line x1="10" y1="19" x2="20" y2="19" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round"/>`;
      break;
    case 4: // 良好 - 睁眼，微笑
      eyes = `
        <circle cx="10" cy="10" r="1.5" fill="${lineColor}"/>
        <circle cx="20" cy="10" r="1.5" fill="${lineColor}"/>
      `;
      mouth = `<path d="M10 17 Q15 21 20 17" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
      break;
    case 5: // 很好 - 笑眯眯眼睛，大笑嘴
      eyes = `
        <path d="M7 10 Q10 7 13 10" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M17 10 Q20 7 23 10" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      `;
      mouth = `<path d="M9 16 Q15 23 21 16" stroke="${lineColor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="14" fill="${faceColor}" stroke="${lineColor}" stroke-width="1.5"/>
    ${eyes}
    ${mouth}
  </svg>`;
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim());
  return `data:image/svg+xml,${encoded}`;
}

interface FeelingIconProps {
  level: FeelingLevel;
  size?: number;
  active?: boolean;
}

export default function FeelingIcon({ level, size = 48, active = false }: FeelingIconProps) {
  return (
    <Image
      src={svgToDataUri(generateFeelingSvg(level, active))}
      style={{ width: size, height: size }}
      mode="aspectFit"
    />
  );
}
