import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import "./index.css";

interface NavBarProps {
  title: string;
  showBack?: boolean;
}

export default function NavBar({ title, showBack = true }: NavBarProps) {
  const [navHeight, setNavHeight] = useState({ statusBarHeight: 0, navBarHeight: 44 });

  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const menuButton = Taro.getMenuButtonBoundingClientRect();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2;
    setNavHeight({ statusBarHeight, navBarHeight });
  }, []);

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <View
      className="nav-bar"
      style={{
        paddingTop: `${navHeight.statusBarHeight}px`,
        height: `${navHeight.navBarHeight}px`,
      }}
    >
      <View className="nav-bar-left">
        {showBack && (
          <View className="nav-bar-back" onClick={handleBack}>
            <Text className="nav-bar-back-icon">‹</Text>
          </View>
        )}
      </View>
      <Text className="nav-bar-title">{title}</Text>
      <View className="nav-bar-right" />
    </View>
  );
}
