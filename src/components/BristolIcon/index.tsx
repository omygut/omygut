import { Image } from "@tarojs/components";

type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// 生成 Bristol 图标 SVG，支持灰色（未选中）和彩色（选中）
function generateBristolSvg(type: BristolType, active: boolean): string {
  // 灰色渐变（未选中）
  const grayGradient = `
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bbb"/>
      <stop offset="100%" stop-color="#999"/>
    </linearGradient>`;

  // 彩色渐变（选中）
  const colorGradients: Record<BristolType, string> = {
    1: `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b7355"/>
      <stop offset="100%" stop-color="#5c4536"/>
    </linearGradient>`,
    2: `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7d6b5d"/>
      <stop offset="100%" stop-color="#5c4d42"/>
    </linearGradient>`,
    3: `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6b5d52"/>
      <stop offset="100%" stop-color="#4a3f36"/>
    </linearGradient>`,
    4: `<linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#9b8365"/>
      <stop offset="30%" stop-color="#8b7355"/>
      <stop offset="100%" stop-color="#6b5344"/>
    </linearGradient>
    <linearGradient id="gh" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>`,
    5: `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9b8b7b"/>
      <stop offset="100%" stop-color="#7b6b5b"/>
    </linearGradient>`,
    6: `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a89888"/>
      <stop offset="100%" stop-color="#887868"/>
    </linearGradient>`,
    7: `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b8a898"/>
      <stop offset="100%" stop-color="#988878"/>
    </linearGradient>`,
  };

  const gradient = active ? colorGradients[type] : grayGradient;
  const lineColor = active ? "#3d342c" : "#aaa";

  const shapes: Record<BristolType, string> = {
    // Type 1: 分散硬块
    1: `<ellipse cx="12" cy="12" rx="5" ry="4.5" fill="url(#g)"/>
      <ellipse cx="28" cy="10" rx="6" ry="5" fill="url(#g)"/>
      <ellipse cx="38" cy="18" rx="5" ry="4" fill="url(#g)"/>
      <ellipse cx="10" cy="26" rx="5.5" ry="5" fill="url(#g)"/>
      <ellipse cx="24" cy="24" rx="5" ry="4.5" fill="url(#g)"/>
      <ellipse cx="18" cy="38" rx="6" ry="5" fill="url(#g)"/>
      <ellipse cx="34" cy="34" rx="5" ry="5.5" fill="url(#g)"/>`,
    // Type 2: 块状香肠形
    2: `<ellipse cx="10" cy="24" rx="6" ry="7" fill="url(#g)"/>
      <ellipse cx="20" cy="24" rx="6" ry="8" fill="url(#g)"/>
      <ellipse cx="30" cy="24" rx="6" ry="7" fill="url(#g)"/>
      <ellipse cx="40" cy="24" rx="5" ry="6" fill="url(#g)"/>`,
    // Type 3: 有裂纹香肠形
    3: `<rect x="4" y="18" width="40" height="12" rx="6" fill="url(#g)"/>
      <line x1="12" y1="18" x2="14" y2="24" stroke="${lineColor}" stroke-width="1.5"/>
      <line x1="22" y1="18" x2="24" y2="26" stroke="${lineColor}" stroke-width="1.5"/>
      <line x1="32" y1="18" x2="34" y2="24" stroke="${lineColor}" stroke-width="1.5"/>
      <line x1="18" y1="30" x2="16" y2="25" stroke="${lineColor}" stroke-width="1"/>
      <line x1="28" y1="30" x2="26" y2="26" stroke="${lineColor}" stroke-width="1"/>`,
    // Type 4: 光滑香肠形
    4: active
      ? `<path d="M6 24 Q6 19 12 19 Q24 16 36 19 Q42 19 42 24 Q42 29 36 29 Q24 26 12 29 Q6 29 6 24 Z" fill="url(#g)"/>
        <path d="M10 21 Q24 18 38 21 Q24 20 10 21 Z" fill="url(#gh)"/>`
      : `<path d="M6 24 Q6 19 12 19 Q24 16 36 19 Q42 19 42 24 Q42 29 36 29 Q24 26 12 29 Q6 29 6 24 Z" fill="url(#g)"/>`,
    // Type 5: 软块状
    5: `<path d="M10 22 Q8 18 12 16 Q16 14 20 18 Q22 16 18 22 Q20 26 14 26 Q8 26 10 22 Z" fill="url(#g)"/>
      <path d="M22 18 Q20 14 24 14 Q30 14 32 18 Q34 22 30 24 Q26 26 22 22 Q20 22 22 18 Z" fill="url(#g)"/>
      <path d="M16 32 Q14 28 18 28 Q24 28 26 32 Q26 36 22 36 Q16 36 16 32 Z" fill="url(#g)"/>
      <path d="M30 28 Q28 24 32 24 Q38 24 38 28 Q38 32 34 32 Q30 32 30 28 Z" fill="url(#g)"/>`,
    // Type 6: 糊状
    6: `<path d="M10 28 Q6 24 10 18 Q14 12 24 14 Q34 10 38 18 Q44 22 40 28 Q42 36 32 38 Q24 42 16 38 Q8 36 10 28 Z" fill="url(#g)"/>`,
    // Type 7: 水样
    7: `<path d="M8 28 Q4 24 8 20 Q12 16 18 18 Q22 14 28 16 Q34 14 38 18 Q44 20 42 26 Q44 32 38 34 Q32 38 24 36 Q16 38 10 34 Q4 32 8 28 Z" fill="url(#g)"/>
      <ellipse cx="10" cy="14" rx="3" ry="2" fill="url(#g)"/>
      <ellipse cx="38" cy="12" rx="2.5" ry="1.5" fill="url(#g)"/>
      <ellipse cx="16" cy="40" rx="2" ry="1.5" fill="url(#g)"/>
      <ellipse cx="34" cy="38" rx="2.5" ry="1.5" fill="url(#g)"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>${gradient}</defs>
    ${shapes[type]}
  </svg>`;
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim());
  return `data:image/svg+xml,${encoded}`;
}

interface BristolIconProps {
  type: BristolType;
  size?: number;
  active?: boolean;
}

export default function BristolIcon({ type, size = 48, active = true }: BristolIconProps) {
  return (
    <Image
      src={svgToDataUri(generateBristolSvg(type, active))}
      style={{ width: `${size}px`, height: `${size}px` }}
      mode="aspectFit"
    />
  );
}
