import { View, Text, Image, Picker, Input, Textarea, ScrollView } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useRef } from "react";
import { examService } from "../../../services/exam";
import { recognizeExamReport } from "../../../services/ai";
import { chooseImage, uploadImage, deleteCloudFile } from "../../../utils/upload";
import { formatDate } from "../../../utils/date";
import { EXAM_TYPES } from "../../../constants/exam";
import CalendarPopup from "../../../components/CalendarPopup";
import "./index.css";

export default function ExamAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState("10:00");
  const [examType, setExamType] = useState<(typeof EXAM_TYPES)[number]["value"]>(
    EXAM_TYPES[0].value,
  );
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const localImagesRef = useRef(localImages);
  localImagesRef.current = localImages;

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }

    const handleMosaicComplete = (data: { resultPath: string }) => {
      setLocalImages([...localImagesRef.current, data.resultPath]);
    };
    Taro.eventCenter.on("mosaicComplete", handleMosaicComplete);

    return () => {
      Taro.eventCenter.off("mosaicComplete", handleMosaicComplete);
    };
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await examService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || "10:00");
        setExamType(record.examType as (typeof EXAM_TYPES)[number]["value"]);
        setContent(record.content || "");
        setNote(record.note || "");
        setUploadedImages(record.imageFileIds || []);
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
    if (totalImages >= 6) return;

    try {
      const tempPaths = await chooseImage(1);
      if (tempPaths.length === 0) return;

      Taro.navigateTo({
        url: `/pages/common/mosaic/index?url=${encodeURIComponent(tempPaths[0])}&source=exam`,
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

    const confirmRes = await Taro.showModal({
      title: "隐私确认",
      content:
        "图片将发送至第三方 AI 服务进行识别。请确认已抹除图片中的姓名、住址、身份证号、手机号、就诊卡号等个人隐私信息。",
      confirmText: "确认识别",
    });

    if (!confirmRes.confirm) return;

    setRecognizing(true);
    try {
      Taro.showLoading({ title: "识别中..." });
      // 识别第一张本地图片
      if (localImages.length > 0) {
        const result = await recognizeExamReport(localImages[0]);
        if (result.date) {
          setDate(result.date);
        }
        if (result.content) {
          setContent(result.content);
        }
      }
      Taro.hideLoading();
      Taro.showToast({ title: "识别完成", icon: "success" });
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
        for (const fileId of uploadedImages) {
          await deleteCloudFile(fileId);
        }
        await examService.delete(editId);
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
      Taro.showToast({ title: "请上传检查报告图片", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
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
        examType,
        imageFileIds,
        content: content || undefined,
        note: note || undefined,
      };

      if (isEdit && editId) {
        await examService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await examService.add(data);
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
      {/* 时间 */}
      <View className="section">
        <Text className="section-title">时间</Text>
        <View className="time-row">
          <View className="picker-value" onClick={() => setCalendarVisible(true)}>
            {date}
          </View>
          <Picker mode="time" value={time} onChange={(e) => setTime(e.detail.value)}>
            <View className="picker-value">{time}</View>
          </Picker>
        </View>
        <CalendarPopup
          visible={calendarVisible}
          value={date}
          onChange={setDate}
          onClose={() => setCalendarVisible(false)}
        />
      </View>

      {/* 检查类型 */}
      <View className="section">
        <Text className="section-title">检查类型</Text>
        <ScrollView scrollX className="exam-type-scroll">
          <View className="exam-type-options">
            {EXAM_TYPES.map((opt) => (
              <View
                key={opt.value}
                className={`exam-type-item ${examType === opt.value ? "active" : ""}`}
                onClick={() => setExamType(opt.value)}
              >
                {opt.emoji} {opt.label}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 图片 */}
      <View className="section">
        <Text className="section-title">检查报告图片</Text>
        <View className="image-grid">
          {uploadedImages.map((fileId, index) => (
            <View key={fileId} className="image-item">
              <Image
                className="image-preview"
                src={fileId}
                mode="aspectFill"
                onClick={() => handlePreviewImage(fileId)}
              />
              <View className="image-delete" onClick={() => handleDeleteUploadedImage(index)}>
                x
              </View>
            </View>
          ))}
          {localImages.map((path, index) => (
            <View key={path} className="image-item image-item-local">
              <Image
                className="image-preview"
                src={path}
                mode="aspectFill"
                onClick={() => handlePreviewImage(path)}
              />
              <View className="image-delete" onClick={() => handleDeleteLocalImage(index)}>
                x
              </View>
            </View>
          ))}
          {totalImages < 6 && (
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
            <Text className="section-title">报告内容</Text>
            <View
              className={`recognize-btn ${recognizing ? "disabled" : ""}`}
              onClick={handleRecognize}
            >
              {recognizing ? "识别中..." : "AI 识别"}
            </View>
          </View>
          <Textarea
            className="content-input"
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            placeholder='点击"AI 识别"或手动输入报告内容'
            maxlength={2000}
          />
        </View>
      )}

      {/* 备注 */}
      <View className="section">
        <Text className="section-title">备注</Text>
        <Input
          className="note-input"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          placeholder="可选"
          maxlength={200}
        />
      </View>

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
