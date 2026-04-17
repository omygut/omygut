import { View, Text, Image, Button } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { getUserSettings, getDefaultNickname } from "../../services/user";
import { saveExportToFile } from "../../services/export";
import { confirmAndDeleteAllData } from "../../services/deleteAll";
import ProfilePopup from "../../components/ProfilePopup";
import "./index.css";

declare const APP_VERSION: string;
declare const APP_NAME: string;

export default function Settings() {
  const [userSettings, setUserSettings] = useState<{
    _id: string;
    nickname?: string;
    avatar?: string;
  } | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [devModeExpanded, setDevModeExpanded] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

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

  const handleProfileClick = () => {
    setShowProfilePopup(true);
  };

  const handleProfileClose = () => {
    setShowProfilePopup(false);
  };

  const handleProfileSave = (data: { nickname: string; avatar?: string }) => {
    setUserSettings((prev) => (prev ? { ...prev, ...data } : prev));
    setShowProfilePopup(false);
  };

  const displayNickname =
    userSettings?.nickname ||
    (userSettings?._id ? getDefaultNickname(userSettings._id) : "加载中...");

  const handleAppNameTap = () => {
    const now = Date.now();
    // 如果距离上次点击超过2秒，重置计数
    if (now - lastTapTime > 2000) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5 && !devModeEnabled) {
        setDevModeEnabled(true);
        Taro.showToast({ title: "开发者模式已开启", icon: "none" });
      }
    }
    setLastTapTime(now);
  };

  return (
    <View className="settings-page">
      <View className="profile-section" onClick={handleProfileClick}>
        <View className="profile-avatar">
          {userSettings?.avatar ? (
            <Image className="avatar-img" src={userSettings.avatar} mode="aspectFill" />
          ) : (
            <View className="avatar-default" />
          )}
        </View>
        <View className="profile-info">
          <Text className="profile-nickname">{displayNickname}</Text>
          <Text className="profile-hint">点击编辑个人资料</Text>
        </View>
        <Text className="profile-arrow">›</Text>
      </View>

      <ProfilePopup
        visible={showProfilePopup}
        nickname={displayNickname}
        avatar={userSettings?.avatar}
        onClose={handleProfileClose}
        onSave={handleProfileSave}
      />

      <View className="data-section">
        <Text className="section-title">数据管理</Text>
        <View className="data-item" onClick={saveExportToFile}>
          <Text className="data-label">导出数据</Text>
          <Text className="data-arrow">›</Text>
        </View>
        <Text className="data-hint">导出所有历史记录为 JSON 文件</Text>
        <View className="data-item" onClick={confirmAndDeleteAllData}>
          <Text className="data-label data-label-danger">删除全部数据</Text>
          <Text className="data-arrow">›</Text>
        </View>
        <Text className="data-hint">删除后数据无法恢复</Text>
      </View>

      <View className="about-section">
        <Text className="section-title">关于</Text>
        <View className="about-item">
          <Text className="about-label">版本</Text>
          <Text className="about-value">{APP_VERSION}</Text>
        </View>
        <View className="about-item" onClick={handleAppNameTap}>
          <Text className="about-label">名称</Text>
          <Text className="about-value">{APP_NAME}</Text>
        </View>
        <View
          className="about-item"
          onClick={() => Taro.navigateTo({ url: "/pages/privacy/index" })}
        >
          <Text className="about-label">隐私政策</Text>
          <Text className="about-arrow">›</Text>
        </View>
      </View>

      {devModeEnabled && (
        <View className="data-section">
          <View className="data-item" onClick={() => setDevModeExpanded(!devModeExpanded)}>
            <Text className="section-title" style={{ marginBottom: 0 }}>
              开发调试
            </Text>
            <Text className="data-arrow">{devModeExpanded ? "∨" : "›"}</Text>
          </View>
          {devModeExpanded && (
            <>
              <View
                className="data-item"
                onClick={() => {
                  Taro.showToast({ title: "已触发测试错误", icon: "none" });
                  setTimeout(() => {
                    throw new Error("测试错误上报");
                  }, 100);
                }}
              >
                <Text className="data-label">测试错误上报</Text>
                <Text className="data-arrow">›</Text>
              </View>
              <Text className="data-hint">触发一个测试错误，验证错误上报功能</Text>
            </>
          )}
        </View>
      )}

      <View className="contact-section">
        <Button className="contact-btn" openType="contact">
          联系开发者
        </Button>
      </View>

      <View className="disclaimer-section">
        <Text className="disclaimer-text">
          本应用仅供个人健康记录使用，不提供医疗建议。如有健康问题，请咨询专业医生。
        </Text>
      </View>
    </View>
  );
}
