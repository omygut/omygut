import { View } from "@tarojs/components";
import "./index.css";

interface BristolIconProps {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  size?: number;
}

export default function BristolIcon({ type, size = 48 }: BristolIconProps) {
  const renderIcon = () => {
    switch (type) {
      case 1:
        // 分散硬块 - 多个小圆点
        return (
          <View className="bristol-icon type-1">
            <View className="ball" />
            <View className="ball" />
            <View className="ball" />
            <View className="ball" />
            <View className="ball" />
          </View>
        );
      case 2:
        // 块状香肠形 - 凹凸不平的条状
        return (
          <View className="bristol-icon type-2">
            <View className="lumpy-bar" />
          </View>
        );
      case 3:
        // 有裂纹香肠形 - 有纹理的条状
        return (
          <View className="bristol-icon type-3">
            <View className="cracked-bar">
              <View className="crack" />
              <View className="crack" />
              <View className="crack" />
            </View>
          </View>
        );
      case 4:
        // 光滑香肠形 - 平滑的条状
        return (
          <View className="bristol-icon type-4">
            <View className="smooth-bar" />
          </View>
        );
      case 5:
        // 软块状 - 分散的软块
        return (
          <View className="bristol-icon type-5">
            <View className="blob" />
            <View className="blob" />
            <View className="blob" />
          </View>
        );
      case 6:
        // 糊状 - 不规则的糊状
        return (
          <View className="bristol-icon type-6">
            <View className="mushy" />
          </View>
        );
      case 7:
        // 水样 - 水滴/液态
        return (
          <View className="bristol-icon type-7">
            <View className="liquid" />
            <View className="drop" />
            <View className="drop small" />
          </View>
        );
    }
  };

  return (
    <View className="bristol-icon-wrapper" style={{ width: size, height: size }}>
      {renderIcon()}
    </View>
  );
}
