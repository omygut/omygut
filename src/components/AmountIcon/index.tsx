import { Image } from "@tarojs/components";

function generateAmountSvg(level: 1 | 2 | 3): string {
  const filled = "#5FCF9A";
  const empty = "#E5E5E5";
  const colors = [
    level >= 1 ? filled : empty,
    level >= 2 ? filled : empty,
    level >= 3 ? filled : empty,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 12">
    <rect x="0" y="0" width="10" height="12" rx="2" fill="${colors[0]}"/>
    <rect x="13" y="0" width="10" height="12" rx="2" fill="${colors[1]}"/>
    <rect x="26" y="0" width="10" height="12" rx="2" fill="${colors[2]}"/>
  </svg>`;
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim());
  return `data:image/svg+xml,${encoded}`;
}

interface AmountIconProps {
  level: 1 | 2 | 3;
  size?: number;
}

export default function AmountIcon({ level, size = 36 }: AmountIconProps) {
  const height = size / 3;
  return (
    <Image
      src={svgToDataUri(generateAmountSvg(level))}
      style={{ width: size, height }}
      mode="aspectFit"
    />
  );
}
