import { useState, useEffect, useRef } from "react";
import { View, Text, Image, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { updateUserSettings, uploadAvatar } from "../../services/user";
import { validateNickname } from "../../utils/validation";
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
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    // 只在弹窗打开时（visible 从 false 变为 true）初始化状态
    if (visible && !prevVisibleRef.current) {
      setCurrentNickname(nickname);
      setCurrentAvatar(avatar);
      setTempAvatarPath(undefined);
    }
    prevVisibleRef.current = visible;
  }, [visible, nickname, avatar]);

  if (!visible) return null;

  const handleChooseAvatar = async () => {
    const res = await Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });
    const tempPath = res.tempFilePaths[0];
    setTempAvatarPath(tempPath);
    setCurrentAvatar(tempPath);
  };

  const handleNicknameInput = (e: any) => {
    setCurrentNickname(e.detail.value);
  };

  const handleSave = async () => {
    if (saving) return;

    const nicknameError = validateNickname(currentNickname);
    if (nicknameError) {
      Taro.showToast({ title: nicknameError, icon: "none" });
      return;
    }

    setSaving(true);

    try {
      let avatarToSave: string | undefined;
      let avatarToDisplay: string | undefined = currentAvatar;

      // 如果有新选择的头像，先上传
      if (tempAvatarPath) {
        const { fileID, tempURL } = await uploadAvatar(tempAvatarPath);
        avatarToSave = fileID; // 保存 fileID 到数据库
        avatarToDisplay = tempURL; // 用临时 URL 显示
      }

      // 更新用户设置（只有新上传的头像才需要更新）
      await updateUserSettings({
        nickname: currentNickname.trim(),
        ...(avatarToSave && { avatar: avatarToSave }),
      });

      onSave({
        nickname: currentNickname.trim(),
        avatar: avatarToDisplay,
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
            <View className="avatar-button" onClick={handleChooseAvatar}>
              {currentAvatar ? (
                <Image className="avatar-image" src={currentAvatar} mode="aspectFill" />
              ) : (
                <View className="avatar-placeholder" />
              )}
            </View>
            <Text className="avatar-hint">点击更换头像</Text>
          </View>

          <View className="nickname-section">
            <Text className="nickname-label">昵称</Text>
            <Input
              className="nickname-input"
              type="text"
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
