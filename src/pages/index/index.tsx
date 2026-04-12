import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { getUserSettings } from "../../services/user";
import "./index.css";

export default function Index() {
  const [userSettings, setUserSettings] = useState<{
    _id: string;
    nickname?: string;
    avatar?: string;
  } | null>(null);

  const loadUserSettings = useCallback(async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      console.error("加载用户设置失败:", error);
    }
  }, []);

  useDidShow(() => {
    loadUserSettings();
  });

  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <View className="home-page">
      <View className="top-header">
        <View className="title-section">
          <Text className="app-title">MyGut</Text>
          <Text className="app-subtitle">肠道健康记录</Text>
        </View>
        <View className="header-avatar">
          {userSettings?.avatar ? (
            <Image className="avatar-img" src={userSettings.avatar} mode="aspectFill" />
          ) : (
            <View className="avatar-default" />
          )}
        </View>
      </View>

      <View className="quick-actions">
        <Text className="section-title">快速记录</Text>
        <View className="action-grid">
          <View className="action-item" onClick={() => handleNavigate("/pages/symptom/add/index")}>
            <Text className="action-icon">🌡️</Text>
            <Text className="action-label">体感</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate("/pages/meal/add/index")}>
            <Text className="action-icon">🍱</Text>
            <Text className="action-label">饮食</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate("/pages/stool/add/index")}>
            <Text className="action-icon">💩</Text>
            <Text className="action-label">排便</Text>
          </View>
          <View
            className="action-item"
            onClick={() => handleNavigate("/pages/medication/add/index")}
          >
            <Text className="action-icon">💊</Text>
            <Text className="action-label">用药</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
