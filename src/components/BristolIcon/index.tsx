import { Image } from "@tarojs/components";

// Base64 encoded SVG icons for Bristol stool types
const BRISTOL_SVGS: Record<number, string> = {
  // Type 1: 分散硬块 - 散落的不规则硬块
  1: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8b7355"/>
        <stop offset="100%" stop-color="#5c4536"/>
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="12" rx="5" ry="4.5" fill="url(#g1)"/>
    <ellipse cx="28" cy="10" rx="6" ry="5" fill="url(#g1)"/>
    <ellipse cx="38" cy="18" rx="5" ry="4" fill="url(#g1)"/>
    <ellipse cx="10" cy="26" rx="5.5" ry="5" fill="url(#g1)"/>
    <ellipse cx="24" cy="24" rx="5" ry="4.5" fill="url(#g1)"/>
    <ellipse cx="18" cy="38" rx="6" ry="5" fill="url(#g1)"/>
    <ellipse cx="34" cy="34" rx="5" ry="5.5" fill="url(#g1)"/>
  </svg>`,

  // Type 2: 块状香肠形 - 凹凸不平的块状条
  2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7d6b5d"/>
        <stop offset="100%" stop-color="#5c4d42"/>
      </linearGradient>
    </defs>
    <path d="M8 24 Q8 16 14 16 Q18 14 22 16 Q26 14 30 16 Q34 14 38 16 Q44 16 44 24 Q44 32 38 32 Q34 34 30 32 Q26 34 22 32 Q18 34 14 32 Q8 32 8 24 Z" fill="url(#g2)"/>
  </svg>`,

  // Type 3: 有裂纹香肠形 - 表面有裂纹的条状
  3: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6b5d52"/>
        <stop offset="100%" stop-color="#4a3f36"/>
      </linearGradient>
    </defs>
    <rect x="4" y="18" width="40" height="12" rx="6" fill="url(#g3)"/>
    <line x1="12" y1="18" x2="14" y2="24" stroke="#3d342c" stroke-width="1.5"/>
    <line x1="22" y1="18" x2="24" y2="26" stroke="#3d342c" stroke-width="1.5"/>
    <line x1="32" y1="18" x2="34" y2="24" stroke="#3d342c" stroke-width="1.5"/>
    <line x1="18" y1="30" x2="16" y2="25" stroke="#3d342c" stroke-width="1"/>
    <line x1="28" y1="30" x2="26" y2="26" stroke="#3d342c" stroke-width="1"/>
  </svg>`,

  // Type 4: 光滑香肠形 - 平滑的条状（理想）
  4: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g4" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#8b7355"/>
        <stop offset="50%" stop-color="#7a6348"/>
        <stop offset="100%" stop-color="#6b5344"/>
      </linearGradient>
    </defs>
    <rect x="4" y="19" width="40" height="10" rx="5" fill="url(#g4)"/>
  </svg>`,

  // Type 5: 软块状 - 分散的软块，边缘清晰
  5: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9b8b7b"/>
        <stop offset="100%" stop-color="#7b6b5b"/>
      </linearGradient>
    </defs>
    <ellipse cx="14" cy="18" rx="8" ry="6" fill="url(#g5)"/>
    <ellipse cx="32" cy="16" rx="7" ry="5.5" fill="url(#g5)"/>
    <ellipse cx="20" cy="32" rx="9" ry="6" fill="url(#g5)"/>
    <ellipse cx="36" cy="30" rx="6" ry="5" fill="url(#g5)"/>
  </svg>`,

  // Type 6: 糊状 - 蓬松的不规则边缘
  6: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a89888"/>
        <stop offset="100%" stop-color="#887868"/>
      </linearGradient>
    </defs>
    <path d="M10 28 Q6 24 10 18 Q14 12 24 14 Q34 10 38 18 Q44 22 40 28 Q42 36 32 38 Q24 42 16 38 Q8 36 10 28 Z" fill="url(#g6)"/>
  </svg>`,

  // Type 7: 水样 - 一滩水
  7: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <defs>
      <linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b8a898"/>
        <stop offset="100%" stop-color="#988878"/>
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="26" rx="18" ry="10" fill="url(#g7)"/>
  </svg>`,
};

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim());
  return `data:image/svg+xml,${encoded}`;
}

interface BristolIconProps {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  size?: number;
}

export default function BristolIcon({ type, size = 48 }: BristolIconProps) {
  return (
    <Image
      src={svgToDataUri(BRISTOL_SVGS[type])}
      style={{ width: size, height: size }}
      mode="aspectFit"
    />
  );
}
