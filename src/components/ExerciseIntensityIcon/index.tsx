import { Image } from "@tarojs/components";
import { COLORS } from "../../constants/colors";

type IntensityLevel = 1 | 2 | 3;

function generateIntensitySvg(level: IntensityLevel, active: boolean): string {
  const baseColor = active ? "#ccc" : "#e0e0e0";
  const activeColor = active
    ? level === 1
      ? COLORS.primary
      : level === 2
        ? COLORS.yellow
        : COLORS.orange
    : "#e0e0e0";

  // 三个火焰，根据强度点亮
  const flame1 = level >= 1 ? activeColor : baseColor;
  const flame2 = level >= 2 ? activeColor : baseColor;
  const flame3 = level >= 3 ? activeColor : baseColor;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <!-- 火焰1（左） -->
    <path d="M10 36 Q8 28 12 24 Q10 20 14 16 Q16 22 18 20 Q20 28 16 32 Q18 36 14 38 Q10 40 10 36 Z" fill="${flame1}"/>
    <!-- 火焰2（中） -->
    <path d="M20 34 Q18 24 22 18 Q20 12 24 8 Q26 16 28 14 Q32 24 28 30 Q30 36 26 38 Q20 40 20 34 Z" fill="${flame2}"/>
    <!-- 火焰3（右） -->
    <path d="M32 36 Q30 28 34 24 Q32 20 36 16 Q38 22 40 20 Q42 28 38 32 Q40 36 36 38 Q32 40 32 36 Z" fill="${flame3}"/>
  </svg>`;
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.replace(/\s+/g, " ").trim());
  return `data:image/svg+xml,${encoded}`;
}

interface ExerciseIntensityIconProps {
  level: IntensityLevel;
  size?: number;
  active?: boolean;
}

export default function ExerciseIntensityIcon({
  level,
  size = 48,
  active = true,
}: ExerciseIntensityIconProps) {
  return (
    <Image
      src={svgToDataUri(generateIntensitySvg(level, active))}
      style={{ width: `${size}px`, height: `${size}px` }}
      mode="aspectFit"
    />
  );
}
