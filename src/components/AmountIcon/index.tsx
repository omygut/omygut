import { Image } from "@tarojs/components";

function generateAmountSvg(level: 0 | 1 | 2 | 3 | 4): string {
  const bucketColor = "#999";
  const filledColor = "#5FCF9A";

  // Bucket shape: top width 20 (x: 2-22), bottom width 16 (x: 4-20)
  // Height from y=4 to y=18 (14 units)
  const numBars = level + 1;
  const bars = [];
  for (let i = 0; i < numBars; i++) {
    const y = 15.5 - i * 2.6;
    // Calculate width at this y position (linear interpolation)
    // At y=18 (bottom): left=4, right=20, width=16
    // At y=4 (top): left=2, right=22, width=20
    const t = (18 - y) / 14; // 0 at bottom, 1 at top
    const left = 4 - t * 2 + 1; // +1 for padding
    const right = 20 + t * 2 - 1; // -1 for padding
    const width = right - left;
    bars.push(
      `<rect x="${left}" y="${y}" width="${width}" height="2" rx="1" fill="${filledColor}"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20">
    <!-- Bucket outline (slightly wider at top) -->
    <path d="M2 4 L4 18 L20 18 L22 4" fill="none" stroke="${bucketColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Food bars -->
    ${bars.join("")}
  </svg>`;
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim());
  return `data:image/svg+xml,${encoded}`;
}

interface AmountIconProps {
  level: 0 | 1 | 2 | 3 | 4;
  size?: number;
}

export default function AmountIcon({ level, size = 24 }: AmountIconProps) {
  const height = (size / 24) * 20;
  return (
    <Image
      src={svgToDataUri(generateAmountSvg(level))}
      style={{ width: size, height }}
      mode="aspectFit"
    />
  );
}
