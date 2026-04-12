import { View, Text, Image, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useRef } from "react";
import { labTestService } from "../../../services/labtest";
import { recognizeLabTestImage } from "../../../services/ai";
import { chooseImage, uploadImage, deleteCloudFile } from "../../../utils/upload";
import { formatDate, formatTime } from "../../../utils/date";
import type { LabTestIndicator } from "../../../types";
import "./index.css";

export default function LabTestAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  // 本地待上传的图片路径
  const [localImages, setLocalImages] = useState<string[]>([]);
  // 已上传到云存储的 fileId（编辑模式）
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [indicators, setIndicators] = useState<LabTestIndicator[]>([]);
  const [loading, setLoading] = useState(isEdit);

  const localImagesRef = useRef(localImages);
  localImagesRef.current = localImages;

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }

    // 监听打码完成事件
    const handleMosaicComplete = (data: { resultPath: string }) => {
      // 新增打码后的图片到本地列表
      setLocalImages([...localImagesRef.current, data.resultPath]);
    };
    Taro.eventCenter.on("mosaicComplete", handleMosaicComplete);

    return () => {
      Taro.eventCenter.off("mosaicComplete", handleMosaicComplete);
    };
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await labTestService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setUploadedImages(record.imageFileIds || []);
        setIndicators(record.indicators || []);
      }
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseImage = async () => {
    const totalImages = localImages.length + uploadedImages.length;
    if (totalImages >= 9) return;

    try {
      // 每次只选择一张图片，立即进入打码流程
      const tempPaths = await chooseImage(1);
      if (tempPaths.length === 0) return;

      // 跳转到打码页面
      Taro.navigateTo({
        url: `/pages/labtest/mosaic/index?url=${encodeURIComponent(tempPaths[0])}`,
      });
    } catch (error) {
      console.error("选择图片失败:", error);
      Taro.showToast({ title: "选择失败", icon: "none" });
    }
  };

  const handlePreviewImage = (imagePath: string) => {
    const allImages = [...uploadedImages, ...localImages];
    Taro.previewImage({
      current: imagePath,
      urls: allImages,
    });
  };

  const handleDeleteLocalImage = (index: number) => {
    setLocalImages(localImages.filter((_, i) => i !== index));
  };

  const handleDeleteUploadedImage = async (index: number) => {
    const fileId = uploadedImages[index];

    const res = await Taro.showModal({
      title: "删除图片",
      content: "确定要删除这张图片吗？",
    });

    if (res.confirm) {
      try {
        await deleteCloudFile(fileId);
        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
      } catch (error) {
        console.error("删除云存储图片失败:", error);
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const handleRecognize = async () => {
    if (recognizing) return;

    const totalImages = localImages.length + uploadedImages.length;
    if (totalImages === 0) {
      Taro.showToast({ title: "请先添加图片", icon: "none" });
      return;
    }

    setRecognizing(true);
    try {
      Taro.showLoading({ title: "识别中..." });
      // 识别本地图片
      const recognitionPromises = localImages.map((path) => recognizeLabTestImage(path));
      const recognitionResults = await Promise.all(recognitionPromises);
      const newIndicators = recognitionResults.flat();
      setIndicators(newIndicators);
      Taro.hideLoading();

      if (newIndicators.length === 0) {
        Taro.showToast({ title: "未识别到指标", icon: "none" });
      } else {
        Taro.showToast({ title: `识别到 ${newIndicators.length} 项指标`, icon: "success" });
      }
    } catch (error) {
      console.error("识别失败:", error);
      Taro.hideLoading();
      Taro.showToast({ title: "识别失败", icon: "none" });
    } finally {
      setRecognizing(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!editId) return;

    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        // 删除云存储中的图片
        for (const fileId of uploadedImages) {
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

    const totalImages = localImages.length + uploadedImages.length;
    if (totalImages === 0) {
      Taro.showToast({ title: "请上传化验单图片", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      // 上传本地图片到云存储
      let newFileIds: string[] = [];
      if (localImages.length > 0) {
        Taro.showLoading({ title: "上传中..." });
        const uploadPromises = localImages.map((path) => uploadImage(path));
        newFileIds = await Promise.all(uploadPromises);
        Taro.hideLoading();
      }

      const imageFileIds = [...uploadedImages, ...newFileIds];

      const data = {
        date,
        time,
        imageFileIds,
        indicators,
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
      Taro.hideLoading();
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

  const totalImages = localImages.length + uploadedImages.length;

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

      {/* 图片 */}
      <View className="section">
        <Text className="section-title">化验单图片</Text>
        <View className="image-grid">
          {/* 已上传的图片（只能删除） */}
          {uploadedImages.map((fileId, index) => (
            <View key={fileId} className="image-item">
              <Image
                className="image-preview"
                src={fileId}
                mode="aspectFill"
                onClick={() => handlePreviewImage(fileId)}
              />
              <View className="image-delete" onClick={() => handleDeleteUploadedImage(index)}>
                ×
              </View>
            </View>
          ))}
          {/* 本地待上传的图片（只能删除） */}
          {localImages.map((path, index) => (
            <View key={path} className="image-item image-item-local">
              <Image
                className="image-preview"
                src={path}
                mode="aspectFill"
                onClick={() => handlePreviewImage(path)}
              />
              <View className="image-delete" onClick={() => handleDeleteLocalImage(index)}>
                ×
              </View>
            </View>
          ))}
          {/* 添加按钮 */}
          {totalImages < 9 && (
            <View className="image-add" onClick={handleChooseImage}>
              <Text className="image-add-icon">+</Text>
              <Text className="image-add-text">添加图片</Text>
            </View>
          )}
        </View>
      </View>

      {/* AI 识别 */}
      {totalImages > 0 && (
        <View className="section">
          <View className="section-header">
            <Text className="section-title">识别结果</Text>
            <View
              className={`recognize-btn ${recognizing ? "disabled" : ""}`}
              onClick={handleRecognize}
            >
              {recognizing ? "识别中..." : "AI 识别"}
            </View>
          </View>
          {indicators.length > 0 ? (
            <View className="indicators-list">
              {indicators.map((indicator, index) => (
                <View key={index} className="indicator-item">
                  <Text className="indicator-name">{indicator.name}</Text>
                  <Text className="indicator-value">
                    {indicator.value} {indicator.unit || ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="no-indicators">点击"AI 识别"按钮识别化验指标</Text>
          )}
        </View>
      )}

      {/* 提交按钮 */}
      <View className="submit-section">
        <View className={`submit-btn ${submitting ? "disabled" : ""}`} onClick={handleSubmit}>
          {submitting ? "保存中..." : isEdit ? "更新记录" : "保存记录"}
        </View>
        {isEdit && (
          <View className="delete-btn" onClick={handleDeleteRecord}>
            删除记录
          </View>
        )}
      </View>
    </View>
  );
}
