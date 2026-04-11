import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { getRecentMedicalRecords } from "../../../services/medical";
import { formatDisplayDate } from "../../../utils/date";
import type { MedicalRecord } from "../../../types";
import "./index.css";

export default function MedicalIndex() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getRecentMedicalRecords(50);
      setRecords(data);
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/medical/add/index" });
  };

  const handleDelete = async (id: string) => {
    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        const { deleteMedicalRecord } = await import("../../../services/medical");
        await deleteMedicalRecord(id);
        Taro.showToast({ title: "已删除", icon: "success" });
        loadRecords();
      } catch {
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const handlePreviewImage = (record: MedicalRecord, index: number) => {
    Taro.previewImage({
      current: record.images[index],
      urls: record.images,
    });
  };

  return (
    <View className="medical-page">
      <View className="header">
        <Text className="title">检查记录</Text>
        <View className="add-btn" onClick={handleAdd}>
          + 添加
        </View>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
          <Text className="empty-hint">点击右上角添加检查记录</Text>
        </View>
      ) : (
        <View className="record-list">
          {records.map((record) => (
            <View
              key={record._id}
              className="record-item"
              onLongPress={() => handleDelete(record._id!)}
            >
              <View className="record-header">
                <Text className="record-date">{formatDisplayDate(record.date)}</Text>
                <Text className="image-count">{record.images.length}张图片</Text>
              </View>

              <View className="image-grid">
                {record.images.map((img, idx) => (
                  <Image
                    key={idx}
                    className="thumbnail"
                    src={img}
                    mode="aspectFill"
                    onClick={() => handlePreviewImage(record, idx)}
                  />
                ))}
              </View>

              {record.note && <Text className="record-note">{record.note}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
