import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { stoolService } from "../../../services/stool";
import { BRISTOL_TYPES, STOOL_AMOUNTS, STOOL_COLORS } from "../../../constants/stool";
import { formatDisplayDate } from "../../../utils/date";
import type { StoolRecord } from "../../../types";
import "./index.css";

export default function StoolIndex() {
  const [records, setRecords] = useState<StoolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await stoolService.getRecent(50);
      setRecords(data);
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/stool/add/index" });
  };

  const handleDelete = async (id: string) => {
    const res = await Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条记录吗？",
    });

    if (res.confirm) {
      try {
        const { stoolService: svc } = await import("../../../services/stool");
        await svc.delete(id);
        Taro.showToast({ title: "已删除", icon: "success" });
        loadRecords();
      } catch {
        Taro.showToast({ title: "删除失败", icon: "none" });
      }
    }
  };

  const getBristolInfo = (type: number) => {
    return BRISTOL_TYPES.find((t) => t.value === type);
  };

  const getColorLabel = (color: string) => {
    return STOOL_COLORS.find((c) => c.value === color)?.label || color;
  };

  const getAmountLabel = (amount: number) => {
    return STOOL_AMOUNTS.find((a) => a.value === amount)?.label || "";
  };

  return (
    <View className="stool-page">
      <View className="header">
        <Text className="title">排便记录</Text>
        <View className="add-btn" onClick={handleAdd}>
          + 添加
        </View>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
          <Text className="empty-hint">点击右上角添加排便记录</Text>
        </View>
      ) : (
        <View className="record-list">
          {records.map((record) => {
            const bristol = getBristolInfo(record.type);
            return (
              <View
                key={record._id}
                className="record-item"
                onLongPress={() => handleDelete(record._id!)}
              >
                <View className="record-header">
                  <Text className="record-date">
                    {formatDisplayDate(record.date)} {record.time}
                  </Text>
                  <View className="bristol-badge">
                    <Text className="bristol-emoji">{bristol?.emoji}</Text>
                    <Text className="bristol-desc">{bristol?.desc}</Text>
                  </View>
                </View>

                <View className="record-details">
                  <View className="detail-row">
                    <Text className="detail-label">类型:</Text>
                    <Text className="detail-value">{bristol?.label}</Text>
                  </View>
                  <View className="detail-row">
                    <Text className="detail-label">量:</Text>
                    <Text className="detail-value">{getAmountLabel(record.amount)}</Text>
                  </View>
                  <View className="detail-row">
                    <Text className="detail-label">颜色:</Text>
                    <Text className="detail-value">{getColorLabel(record.color)}</Text>
                  </View>
                </View>

                {(record.hasBlood || record.hasMucus) && (
                  <View className="warning-tags">
                    {record.hasBlood && <Text className="warning-tag blood">带血</Text>}
                    {record.hasMucus && <Text className="warning-tag mucus">带粘液</Text>}
                  </View>
                )}

                {record.note && <Text className="record-note">{record.note}</Text>}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
