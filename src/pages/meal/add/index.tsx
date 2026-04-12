import { View, Text, Input, Textarea, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { mealService } from "../../../services/meal";
import { FOOD_CATEGORIES, AMOUNT_OPTIONS } from "../../../constants/meal";
import { formatDate, formatTime } from "../../../utils/date";
import "./index.css";

export default function MealAdd() {
  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [amount, setAmount] = useState<1 | 2 | 3>(2);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFoodClick = (food: string) => {
    if (selectedFoods.includes(food)) {
      setSelectedFoods(selectedFoods.filter((f) => f !== food));
    } else {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  const handleManualAdd = () => {
    const food = manualInput.trim();
    if (!food) {
      Taro.showToast({ title: "请输入食物名称", icon: "none" });
      return;
    }
    if (selectedFoods.includes(food)) {
      Taro.showToast({ title: "已添加该食物", icon: "none" });
      return;
    }
    setSelectedFoods([...selectedFoods, food]);
    setManualInput("");
  };

  const handleRemoveFood = (food: string) => {
    setSelectedFoods(selectedFoods.filter((f) => f !== food));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (selectedFoods.length === 0) {
      Taro.showToast({ title: "请选择至少一种食物", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      await mealService.add({
        date,
        time,
        foods: selectedFoods,
        amount,
        note: note.trim() || undefined,
      });

      Taro.showToast({ title: "记录成功", icon: "success" });
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

  const currentCategory = FOOD_CATEGORIES[selectedCategory];

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

      {/* 食物选择 */}
      <View className="section">
        <Text className="section-title">选择食物</Text>

        {/* 分类标签 */}
        <View className="category-tabs">
          {FOOD_CATEGORIES.map((cat, index) => (
            <View
              key={cat.name}
              className={`category-tab ${selectedCategory === index ? "active" : ""}`}
              onClick={() => setSelectedCategory(index)}
            >
              {cat.name}
            </View>
          ))}
        </View>

        {/* 食物网格 */}
        <View className="food-grid">
          {currentCategory.items.map((food) => (
            <View
              key={food}
              className={`food-item ${selectedFoods.includes(food) ? "selected" : ""}`}
              onClick={() => handleFoodClick(food)}
            >
              {food}
            </View>
          ))}
        </View>

        {/* 手动输入 */}
        <View className="manual-input-row">
          <Input
            className="manual-input"
            placeholder="输入其他食物"
            value={manualInput}
            onInput={(e) => setManualInput(e.detail.value)}
          />
          <View className="manual-add-btn" onClick={handleManualAdd}>
            添加
          </View>
        </View>
      </View>

      {/* 已选食物 */}
      <View className="section">
        <Text className="section-title">已选食物</Text>
        {selectedFoods.length === 0 ? (
          <Text className="no-food-hint">请从上方选择或输入食物</Text>
        ) : (
          <View className="selected-foods">
            {selectedFoods.map((food) => (
              <View key={food} className="selected-food-tag">
                <Text className="selected-food-name">{food}</Text>
                <Text className="remove-food-btn" onClick={() => handleRemoveFood(food)}>
                  x
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 进食量 */}
      <View className="section">
        <Text className="section-title">进食量</Text>
        <View className="amount-options">
          {AMOUNT_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={`amount-item ${amount === option.value ? "active" : ""}`}
              onClick={() => setAmount(option.value as typeof amount)}
            >
              <Text className="amount-emoji">{option.emoji}</Text>
              <Text className="amount-label">{option.label}</Text>
            </View>
          ))}
        </View>
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
