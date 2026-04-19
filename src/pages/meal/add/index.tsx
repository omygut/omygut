import { View, Text, Input, Textarea, Image } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { mealService } from "../../../services/meal";
import { recognizeFoodImage } from "../../../services/ai";
import { chooseImage, uploadImage, deleteCloudFile } from "../../../utils/upload";
import { FOOD_CATEGORIES, AMOUNT_OPTIONS } from "../../../constants/meal";
import { formatDate, formatTime } from "../../../utils/date";
import { showError } from "../../../utils/error";
import { validateFood } from "../../../utils/validation";
import CalendarPopup from "../../../components/CalendarPopup";
import TimePicker from "../../../components/TimePicker";
import MealAmountIcon from "../../../components/MealAmountIcon";
import "./index.css";

const CUSTOM_FOODS_KEY = "custom_foods";

// 所有预设食物的名称集合（用于判断是否为自定义食物）
const ALL_PRESET_FOODS = new Set(
  FOOD_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.name)),
);

// 食物名称到 emoji 的映射
const FOOD_EMOJI_MAP = new Map(
  FOOD_CATEGORIES.flatMap((cat) => cat.items.map((item) => [item.name, item.emoji])),
);

function getStoredCustomFoods(): string[] {
  const stored = Taro.getStorageSync(CUSTOM_FOODS_KEY);
  return Array.isArray(stored) ? stored : [];
}

function saveCustomFood(food: string) {
  const existing = getStoredCustomFoods();
  if (!existing.includes(food)) {
    Taro.setStorageSync(CUSTOM_FOODS_KEY, [...existing, food]);
  }
}

function removeCustomFood(food: string) {
  const existing = getStoredCustomFoods();
  Taro.setStorageSync(
    CUSTOM_FOODS_KEY,
    existing.filter((f) => f !== food),
  );
}

export default function MealAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [selectedCategory, setSelectedCategory] = useState(-1); // -1 = 我的常用
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [amount, setAmount] = useState<0 | 1 | 2 | 3 | 4>(2);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customFoods, setCustomFoods] = useState<string[]>([]);
  const [topFoods, setTopFoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await mealService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setSelectedFoods(record.foods);
        setAmount(record.amount);
        setNote(record.note || "");
        setUploadedImages(record.imageFileIds || []);
      }
    } catch (error) {
      showError("加载失败", error);
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    setCustomFoods(getStoredCustomFoods());
    // 只保留预设食物中的高频食物
    const foods = mealService.getTopFoods(10);
    setTopFoods(foods.filter((f) => ALL_PRESET_FOODS.has(f)));
  });

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

    const error = validateFood(food);
    if (error) {
      Taro.showToast({ title: error, icon: "none" });
      return;
    }

    if (selectedFoods.includes(food)) {
      Taro.showToast({ title: "已添加该食物", icon: "none" });
      return;
    }
    setSelectedFoods([...selectedFoods, food]);
    setManualInput("");
    // 如果不在预设中，保存到自定义列表
    if (!ALL_PRESET_FOODS.has(food)) {
      saveCustomFood(food);
      setCustomFoods(getStoredCustomFoods());
    }
  };

  const handleDeleteCustomFood = async (food: string) => {
    const res = await Taro.showModal({
      title: "删除食物",
      content: `确定要删除"${food}"吗？`,
    });
    if (res.confirm) {
      removeCustomFood(food);
      setCustomFoods(getStoredCustomFoods());
      setSelectedFoods(selectedFoods.filter((f) => f !== food));
    }
  };

  const handleRemoveFood = (food: string) => {
    setSelectedFoods(selectedFoods.filter((f) => f !== food));
  };

  const handleChooseImage = async () => {
    const totalImages = localImages.length + uploadedImages.length;
    const remaining = 9 - totalImages;
    if (remaining <= 0) {
      Taro.showToast({ title: "最多添加9张图片", icon: "none" });
      return;
    }

    try {
      const tempPaths = await chooseImage(remaining);
      if (tempPaths.length === 0) return;

      setLocalImages([...localImages, ...tempPaths]);

      // 询问是否识别第一张新添加的图片
      const res = await Taro.showModal({
        title: "识别食物",
        content: "是否使用 AI 识别图片中的食物？",
        confirmText: "识别",
        cancelText: "跳过",
      });

      if (res.confirm) {
        await handleRecognize(tempPaths[0]);
      }
    } catch (error) {
      showError("选择图片失败", error);
    }
  };

  const handleRecognize = async (imagePath: string) => {
    if (recognizing) return;

    setRecognizing(true);
    Taro.showLoading({ title: "识别中..." });

    try {
      const foods = await recognizeFoodImage(imagePath);
      Taro.hideLoading();

      if (foods.length === 0) {
        Taro.showToast({ title: "未识别到食物", icon: "none" });
        return;
      }

      // 显示识别结果，让用户选择
      const res = await Taro.showModal({
        title: "识别结果",
        content: `识别到以下食物：\n${foods.join("、")}\n\n是否添加到已选列表？`,
        confirmText: "添加",
      });

      if (res.confirm) {
        const newFoods: string[] = [];
        for (const food of foods) {
          if (!selectedFoods.includes(food)) {
            newFoods.push(food);
            // 如果不在预设中，保存到自定义列表
            if (!ALL_PRESET_FOODS.has(food)) {
              saveCustomFood(food);
            }
          }
        }
        if (newFoods.length > 0) {
          setSelectedFoods([...selectedFoods, ...newFoods]);
          setCustomFoods(getStoredCustomFoods());
          Taro.showToast({ title: `已添加${newFoods.length}种食物`, icon: "success" });
        } else {
          Taro.showToast({ title: "食物已在列表中", icon: "none" });
        }
      }
    } catch (error) {
      Taro.hideLoading();
      showError("识别失败", error);
    } finally {
      setRecognizing(false);
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
        showError("删除失败", error);
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
        for (const fileId of uploadedImages) {
          await deleteCloudFile(fileId);
        }
        await mealService.delete(editId);
        Taro.showToast({ title: "已删除", icon: "success" });
        Taro.eventCenter.trigger("recordChange");
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } catch (error) {
        showError("删除失败", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (selectedFoods.length === 0) {
      Taro.showToast({ title: "请选择至少一种食物", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      // 上传本地图片
      let newFileIds: string[] = [];
      if (localImages.length > 0) {
        Taro.showLoading({ title: "上传图片..." });
        const uploadPromises = localImages.map((path) => uploadImage(path));
        newFileIds = await Promise.all(uploadPromises);
        Taro.hideLoading();
      }

      const imageFileIds = [...uploadedImages, ...newFileIds];

      const data = {
        date,
        time,
        foods: selectedFoods,
        amount,
        imageFileIds: imageFileIds.length > 0 ? imageFileIds : undefined,
        note: note.trim() || undefined,
      };

      if (isEdit && editId) {
        await mealService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await mealService.add(data);
        Taro.showToast({ title: "记录成功", icon: "success" });
      }

      Taro.eventCenter.trigger("recordChange");
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      showError("保存失败", error);
    } finally {
      setSubmitting(false);
    }
  };

  // 「我的常用」的食物列表：自定义食物 + 预设高频食物
  const myFavoriteFoods = [...customFoods, ...topFoods.filter((f) => !customFoods.includes(f))];

  // 当前分类的食物列表（统一为 { name, emoji } 格式）
  const currentFoods =
    selectedCategory === -1
      ? myFavoriteFoods.map((name) => ({ name, emoji: FOOD_EMOJI_MAP.get(name) }))
      : FOOD_CATEGORIES[selectedCategory].items;

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
          <View className="picker-value" onClick={() => setCalendarVisible(true)}>
            {date}
          </View>
          <TimePicker value={time} onChange={setTime} />
        </View>
        <CalendarPopup
          visible={calendarVisible}
          value={date}
          onChange={setDate}
          onClose={() => setCalendarVisible(false)}
        />
      </View>

      {/* 食物选择 */}
      <View className="section">
        <Text className="section-title">选择食物</Text>

        {/* 分类标签 */}
        <View className="category-tabs">
          <View
            className={`category-tab ${selectedCategory === -1 ? "active" : ""}`}
            onClick={() => setSelectedCategory(-1)}
          >
            常用
          </View>
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
          {currentFoods.length === 0 ? (
            <Text className="no-food-hint">暂无常用食物，请从其他分类选择或手动输入</Text>
          ) : (
            currentFoods.map((food) => {
              const isCustom = selectedCategory === -1 && customFoods.includes(food.name);
              return (
                <View
                  key={food.name}
                  className={`food-item ${selectedFoods.includes(food.name) ? "selected" : ""} ${isCustom ? "custom" : ""}`}
                  onClick={() => handleFoodClick(food.name)}
                  onLongPress={isCustom ? () => handleDeleteCustomFood(food.name) : undefined}
                >
                  {food.emoji && <Text className="food-emoji">{food.emoji}</Text>}
                  <Text className="food-name">{food.name}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* 手动输入（仅在「我的常用」分类下显示） */}
        {selectedCategory === -1 && (
          <View className="manual-input-row">
            <Input
              className="manual-input"
              placeholder="输入其他食物"
              value={manualInput}
              onInput={(e) => setManualInput(e.detail.value)}
              onConfirm={handleManualAdd}
            />
            <View className="manual-add-btn" onClick={handleManualAdd}>
              添加
            </View>
          </View>
        )}
      </View>

      {/* 食物照片 */}
      <View className="section">
        <Text className="section-title">食物照片（可选）</Text>
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
                ×
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
                ×
              </View>
            </View>
          ))}
          {localImages.length + uploadedImages.length < 9 && (
            <View className="image-add" onClick={handleChooseImage}>
              <Text className="image-add-icon">📷</Text>
              <Text className="image-add-text">拍照识别</Text>
            </View>
          )}
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
              <View key={food} className="selected-food-tag" onClick={() => handleRemoveFood(food)}>
                <Text className="selected-food-name">{food}</Text>
                <Text className="remove-food-btn">×</Text>
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
              <MealAmountIcon level={option.value} active={amount === option.value} />
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
          autoHeight
        />
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <View className={`submit-btn ${submitting ? "disabled" : ""}`} onClick={handleSubmit}>
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
