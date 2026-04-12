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

      <View className="about-section">
        <Text className="section-title">关于</Text>
        <View className="about-item">
          <Text className="about-label">版本</Text>
          <Text className="about-value">{APP_VERSION}</Text>
        </View>
        <View className="about-item">
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
