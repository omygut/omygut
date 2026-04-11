import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.css";

export default function Index() {
  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <View className="index">
      <View className="header">
        <Text className="title">MyGut</Text>
        <Text className="subtitle">肠胃健康追踪</Text>
      </View>

      <View className="menu-list">
        <View className="menu-item" onClick={() => handleNavigate("/pages/symptom/index/index")}>
          <Text className="menu-icon">🩺</Text>
          <View className="menu-content">
            <Text className="menu-title">身体状态</Text>
            <Text className="menu-desc">记录症状和整体感受</Text>
          </View>
          <Text className="menu-arrow">›</Text>
        </View>

        <View className="menu-item" onClick={() => handleNavigate("/pages/meal/index/index")}>
          <Text className="menu-icon">🍚</Text>
          <View className="menu-content">
            <Text className="menu-title">饮食记录</Text>
            <Text className="menu-desc">记录每日饮食</Text>
          </View>
          <Text className="menu-arrow">›</Text>
        </View>

        <View className="menu-item" onClick={() => handleNavigate("/pages/stool/index/index")}>
          <Text className="menu-icon">🚽</Text>
          <View className="menu-content">
            <Text className="menu-title">排便记录</Text>
            <Text className="menu-desc">记录排便情况</Text>
          </View>
          <Text className="menu-arrow">›</Text>
        </View>

        <View className="menu-item disabled">
          <Text className="menu-icon">💊</Text>
          <View className="menu-content">
            <Text className="menu-title">用药记录</Text>
            <Text className="menu-desc">记录每日用药</Text>
          </View>
          <Text className="menu-arrow">›</Text>
        </View>

        <View className="menu-item disabled">
          <Text className="menu-icon">📋</Text>
          <View className="menu-content">
            <Text className="menu-title">医疗检查</Text>
            <Text className="menu-desc">记录检查报告</Text>
          </View>
          <Text className="menu-arrow">›</Text>
        </View>
      </View>
    </View>
  );
}
