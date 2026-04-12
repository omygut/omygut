import { useState } from "react";
import { View, Text, Image, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { updateUserSettings, uploadAvatar } from "../../services/user";
import "./index.css";

interface ProfilePopupProps {
  visible: boolean;
  nickname: string;
  avatar?: string;
  onClose: () => void;
  onSave: (data: { nickname: string; avatar?: string }) => void;
}

export default function ProfilePopup({
  visible,
  nickname,
  avatar,
  onClose,
  onSave,
}: ProfilePopupProps) {
  const [currentNickname, setCurrentNickname] = useState(nickname);
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
  const [tempAvatarPath, setTempAvatarPath] = useState<string>();
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  const handleChooseAvatar = (e: any) => {
    const tempPath = e.detail.avatarUrl;
    setTempAvatarPath(tempPath);
    setCurrentAvatar(tempPath);
  };

  const handleNicknameInput = (e: any) => {
    setCurrentNickname(e.detail.value);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      let avatarFileId = currentAvatar;

      // 如果有新选择的头像，先上传
      if (tempAvatarPath) {
        avatarFileId = await uploadAvatar(tempAvatarPath);
      }

      // 更新用户设置
      await updateUserSettings({
        nickname: currentNickname,
        avatar: avatarFileId,
      });

      onSave({
        nickname: currentNickname,
        avatar: avatarFileId,
      });

      Taro.showToast({ title: "保存成功", icon: "success" });
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="popup-mask" onClick={onClose}>
      <View className="popup-content" onClick={(e) => e.stopPropagation()}>
        <View className="popup-header">
          <Text className="popup-title">编辑资料</Text>
          <Text className="popup-close" onClick={onClose}>
            ✕
          </Text>
        </View>

        <View className="popup-body">
          <View className="avatar-section">
            <Button
              className="avatar-button"
              openType="chooseAvatar"
              onChooseAvatar={handleChooseAvatar}
            >
              {currentAvatar ? (
                <Image className="avatar-image" src={currentAvatar} mode="aspectFill" />
              ) : (
                <View className="avatar-placeholder" />
              )}
            </Button>
            <Text className="avatar-hint">点击更换头像</Text>
          </View>

          <View className="nickname-section">
            <Text className="nickname-label">昵称</Text>
            <Input
              className="nickname-input"
              type="nickname"
              value={currentNickname}
              onInput={handleNicknameInput}
              placeholder="请输入昵称"
            />
          </View>
        </View>

        <View className="popup-footer">
          <Button className="save-button" onClick={handleSave} loading={saving}>
            保存
          </Button>
        </View>
      </View>
    </View>
  );
}
