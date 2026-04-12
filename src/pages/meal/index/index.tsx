import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { mealService } from "../../../services/meal";
import { AMOUNT_OPTIONS } from "../../../constants/meal";
import { formatDisplayDate } from "../../../utils/date";
import type { MealRecord } from "../../../types";
import "./index.css";

export default function MealIndex() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    loadRecords();
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await mealService.getRecent(50);
      setRecords(data);
    } catch (error) {
      console.error("加载记录失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: "/pages/meal/add/index" });
  };

  const handleEdit = (id: string) => {
    Taro.navigateTo({ url: `/pages/meal/add/index?id=${id}` });
  };

  const getAmountInfo = (amount: 1 | 2 | 3) => {
    return AMOUNT_OPTIONS.find((a) => a.value === amount);
  };

  return (
    <View className="meal-page">
      <View className="header">
        <Text className="title">饮食记录</Text>
        <View className="add-btn" onClick={handleAdd}>
          + 添加
        </View>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : records.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无记录</Text>
          <Text className="empty-hint">点击右上角添加记录</Text>
        </View>
      ) : (
        <View className="record-list">
          {records.map((record) => {
            const amount = getAmountInfo(record.amount);
            return (
              <View
                key={record._id}
                className="record-item"
                onClick={() => handleEdit(record._id!)}
              >
                <View className="record-main">
                  <View className="record-header">
                    <Text className="record-date">
                      {formatDisplayDate(record.date)} {record.time}
                    </Text>
                    <View className="amount-badge">
                      <Text className="amount-emoji">{amount?.emoji}</Text>
                      <Text className="amount-label">{amount?.label}</Text>
                    </View>
                  </View>

                  <View className="foods">
                    {record.foods.map((food, idx) => (
                      <Text key={idx} className="food-tag">
                        {food}
                      </Text>
                    ))}
                  </View>

                  {record.note && <Text className="record-note">{record.note}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
