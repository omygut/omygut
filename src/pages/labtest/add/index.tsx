import { View, Text, Image, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { labTestService } from "../../../services/labtest";
import { chooseImage, uploadImage, deleteCloudFile } from "../../../utils/upload";
import { formatDate, formatTime } from "../../../utils/date";
import { LABTEST_TYPES } from "../../../constants/labtest";
import "./index.css";

export default function LabTestAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [type, setType] = useState(LABTEST_TYPES[0]);
  const [imageFileIds, setImageFileIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await labTestService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setType(record.type);
        setImageFileIds(record.imageFileIds || []);
      }
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseImage = async () => {
    if (uploading) return;

    try {
      const tempPaths = await chooseImage(9 - imageFileIds.length);
      if (tempPaths.length === 0) return;

      setUploading(true);
      Taro.showLoading({ title: "上传中..." });

      const uploadPromises = tempPaths.map((path) => uploadImage(path));
      const newFileIds = await Promise.all(uploadPromises);

      setImageFileIds([...imageFileIds, ...newFileIds]);
      Taro.hideLoading();
    } catch (error) {
      console.error("上传图片失败:", error);
      Taro.hideLoading();
      Taro.showToast({ title: "上传失败", icon: "none" });
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewImage = (fileId: string) => {
    Taro.previewImage({
      current: fileId,
      urls: imageFileIds,
    });
  };

  const handleDeleteImage = async (fileId: string) => {
    const res = await Taro.showModal({
      title: "删除图片",
      content: "确定要删除这张图片吗？",
    });

    if (res.confirm) {
      try {
        await deleteCloudFile(fileId);
        setImageFileIds(imageFileIds.filter((id) => id !== fileId));
      } catch (error) {
        console.error("删除图片失败:", error);
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const handleDelete = async () => {
    if (!editId) return;

    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        // 删除云存储中的图片
        for (const fileId of imageFileIds) {
          await deleteCloudFile(fileId);
        }
        await labTestService.delete(editId);
        Taro.showToast({ title: "已删除", icon: "success" });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } catch {
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (imageFileIds.length === 0) {
      Taro.showToast({ title: "请上传化验单图片", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        date,
        time,
        type,
        imageFileIds,
        indicators: [],
      };

      if (isEdit && editId) {
        await labTestService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await labTestService.add(data);
        Taro.showToast({ title: "记录成功", icon: "success" });
      }

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="add-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="add-page">
      {/* 日期时间 */}
      <View className="section">
        <Text className="section-title">时间</Text>
        <View className="time-row">
          <Picker mode="date" value={date} onChange={(e) => setDate(e.detail.value)}>
            <View className="picker-value">{date}</View>
          </Picker>
          <Picker mode="time" value={time} onChange={(e) => setTime(e.detail.value)}>
            <View className="picker-value">{time}</View>
          </Picker>
        </View>
      </View>

      {/* 化验类型 */}
      <View className="section">
        <Text className="section-title">化验类型</Text>
        <View className="type-options">
          {LABTEST_TYPES.map((t) => (
            <View
              key={t}
              className={`type-item ${type === t ? "active" : ""}`}
              onClick={() => setType(t)}
            >
              {t}
            </View>
          ))}
        </View>
      </View>

      {/* 图片上传 */}
      <View className="section">
        <Text className="section-title">化验单图片</Text>
        <View className="image-grid">
          {imageFileIds.map((fileId) => (
            <View key={fileId} className="image-item">
              <Image
                className="image-preview"
                src={fileId}
                mode="aspectFill"
                onClick={() => handlePreviewImage(fileId)}
              />
              <View className="image-delete" onClick={() => handleDeleteImage(fileId)}>
                ×
              </View>
            </View>
          ))}
          {imageFileIds.length < 9 && (
            <View className="image-add" onClick={handleChooseImage}>
              <Text className="image-add-icon">+</Text>
              <Text className="image-add-text">添加图片</Text>
            </View>
          )}
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View
          className={`submit-btn ${submitting || uploading ? "disabled" : ""}`}
          onClick={handleSubmit}
        >
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </View>
        {isEdit && (
          <View className="delete-btn" onClick={handleDelete}>
            删除记录
          </View>
        )}
      </View>
    </View>
  );
}
