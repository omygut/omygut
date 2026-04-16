import { View, Text, Image } from "@tarojs/components";
import logoImg from "../../assets/logo.png";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import "./index.css";

export default function Index() {
  const [navHeight, setNavHeight] = useState({ statusBarHeight: 0, navBarHeight: 44 });

  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const menuButton = Taro.getMenuButtonBoundingClientRect();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    // 导航栏高度 = 胶囊按钮高度 + 上下间距
    const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2;
    setNavHeight({ statusBarHeight, navBarHeight });
  }, []);

  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <View className="home-page">
      <View
        className="top-header"
        style={{
          paddingTop: `${navHeight.statusBarHeight}px`,
          height: `${navHeight.navBarHeight}px`,
        }}
      >
        <Image className="app-logo" src={logoImg} mode="aspectFit" />
        <Text className="app-title">MyGut - 肠道健康记录</Text>
      </View>

      <View className="quick-actions">
        <Text className="section-title">快速记录</Text>
        <View className="action-grid">
          <View className="action-item" onClick={() => handleNavigate("/pages/symptom/add/index")}>
            <Text className="action-icon">🌱</Text>
            <Text className="action-label">体感</Text>
          </View>
          <View
            className="action-item"
            onClick={() => handleNavigate("/pages/medication/add/index")}
          >
            <Text className="action-icon">💊</Text>
            <Text className="action-label">用药</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate("/pages/meal/add/index")}>
            <Text className="action-icon">🍱</Text>
            <Text className="action-label">饮食</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate("/pages/stool/add/index")}>
            <Text className="action-icon">💩</Text>
            <Text className="action-label">排便</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate("/pages/labtest/add/index")}>
            <Text className="action-icon">🧪</Text>
            <Text className="action-label">化验</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate("/pages/exam/add/index")}>
            <Text className="action-icon">🩺</Text>
            <Text className="action-label">检查</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
