import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { saveExportToFile } from "../../services/export";
import { confirmAndDeleteAllData } from "../../services/deleteAll";
import "./index.css";

declare const APP_VERSION: string;
declare const APP_NAME: string;

export default function Settings() {
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

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
      <View className="data-section">
        <Text className="section-title">数据管理</Text>
        <View className="data-item" onClick={saveExportToFile}>
          <Text className="data-label">导出数据</Text>
          <Text className="data-arrow">›</Text>
        </View>
        <View className="data-item" onClick={confirmAndDeleteAllData}>
          <Text className="data-label data-label-danger">删除全部数据</Text>
          <Text className="data-arrow">›</Text>
        </View>
      </View>

      <View className="about-section">
        <Text className="section-title">关于</Text>
        <View className="about-item" onClick={handleAppNameTap}>
          <Text className="about-label">名称</Text>
          <Text className="about-value">{APP_NAME}</Text>
        </View>
        <View className="about-item">
          <Text className="about-label">版本</Text>
          <Text className="about-value">{APP_VERSION}</Text>
        </View>
        <View
          className="about-item"
          onClick={() => Taro.navigateTo({ url: "/pages/privacy/index" })}
        >
          <Text className="about-label">隐私政策</Text>
          <Text className="about-arrow">›</Text>
        </View>
        <Button className="about-item contact-btn" openType="contact">
          <Text className="about-label">联系开发者</Text>
          <Text className="about-arrow">›</Text>
        </Button>
      </View>

      {devModeEnabled && (
        <View className="data-section">
          <Text className="section-title">开发调试</Text>
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
        </View>
      )}

      <View className="disclaimer-section">
        <Text className="disclaimer-text">感谢「协你同心」群友们的支持与反馈。</Text>
        <Text className="disclaimer-text">
          本应用仅供个人健康记录使用，不提供医疗建议。如有健康问题，请咨询专业医生。
        </Text>
      </View>
    </View>
  );
}
