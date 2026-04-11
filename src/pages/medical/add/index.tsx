import { View, Text, Image, Textarea, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { addMedicalRecord, uploadImages } from "../../../services/medical";
import { MAX_IMAGES } from "../../../constants/medical";
import { formatDate } from "../../../utils/date";
import "./index.css";

export default function MedicalAdd() {
  const [date, setDate] = useState(formatDate());
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChooseImage = async () => {
    const remaining = MAX_IMAGES - localImages.length;
    if (remaining <= 0) {
      Taro.showToast({ title: `最多上传${MAX_IMAGES}张图片`, icon: "none" });
      return;
    }

    try {
      const res = await Taro.chooseImage({
        count: remaining,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });
      setLocalImages([...localImages, ...res.tempFilePaths]);
    } catch {
      // 用户取消选择
    }
  };

  const handleRemoveImage = (index: number) => {
    setLocalImages(localImages.filter((_, i) => i !== index));
  };

  const handlePreviewImage = (index: number) => {
    Taro.previewImage({
      current: localImages[index],
      urls: localImages,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (localImages.length === 0) {
      Taro.showToast({ title: "请至少上传一张图片", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      Taro.showLoading({ title: "上传中..." });

      // 上传图片到云存储
      const cloudImages = await uploadImages(localImages);

      // 保存记录到数据库
      await addMedicalRecord({
        date,
        images: cloudImages,
        note: note.trim() || undefined,
      });

      Taro.hideLoading();
      Taro.showToast({ title: "保存成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      Taro.hideLoading();
      console.error("保存失败:", error);
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="add-page">
      {/* 日期 */}
      <View className="section">
        <Text className="section-title">检查日期</Text>
        <Picker mode="date" value={date} onChange={(e) => setDate(e.detail.value)}>
          <View className="picker-value">{date}</View>
        </Picker>
      </View>

      {/* 图片上传 */}
      <View className="section">
        <Text className="section-title">检查报告图片</Text>
        <View className="image-grid">
          {localImages.map((img, index) => (
            <View key={index} className="image-item">
              <Image
                className="preview-image"
                src={img}
                mode="aspectFill"
                onClick={() => handlePreviewImage(index)}
              />
              <View className="remove-btn" onClick={() => handleRemoveImage(index)}>
                ×
              </View>
            </View>
          ))}
          {localImages.length < MAX_IMAGES && (
            <View className="add-image-btn" onClick={handleChooseImage}>
              <Text className="add-icon">+</Text>
              <Text className="add-text">添加图片</Text>
            </View>
          )}
        </View>
        <Text className="image-hint">支持从相册选择或拍照，最多{MAX_IMAGES}张</Text>
      </View>

      {/* 备注 */}
      <View className="section">
        <Text className="section-title">备注</Text>
        <Textarea
          className="note-input"
          placeholder="添加备注（可选）"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={500}
        />
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View className={`submit-btn ${submitting ? "disabled" : ""}`} onClick={handleSubmit}>
          {submitting ? "保存中..." : "保存记录"}
        </View>
      </View>
    </View>
  );
}
