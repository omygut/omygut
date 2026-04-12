import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { medicationService } from "../../../services/medication";
import { formatDisplayDate } from "../../../utils/date";
import type { MedicationRecord } from "../../../types";
import "./index.css";

export default function MedicationIndex() {
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await medicationService.getRecent(50);
      setRecords(data);
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/medication/add/index" });
  };

  const handleDelete = async (id: string) => {
    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        const { medicationService: svc } = await import("../../../services/medication");
        await svc.delete(id);
        Taro.showToast({ title: "已删除", icon: "success" });
        loadRecords();
      } catch {
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  return (
    <View className="medication-page">
      <View className="header">
        <Text className="title">用药记录</Text>
        <View className="add-btn" onClick={handleAdd}>
          + 添加
        </View>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
          <Text className="empty-hint">点击右上角添加用药记录</Text>
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
                <Text className="record-date">
                  {formatDisplayDate(record.date)} {record.time}
                </Text>
              </View>

              <Text className="medication-name">{record.name}</Text>

              {record.dosage && <Text className="medication-dosage">{record.dosage}</Text>}

              {record.note && <Text className="record-note">{record.note}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
