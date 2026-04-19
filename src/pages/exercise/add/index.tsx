import { View, Text, Input, Textarea } from "@tarojs/components";
import Taro, { useDidShow, useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { exerciseService } from "../../../services/exercise";
import {
  EXERCISE_CATEGORIES,
  DURATION_OPTIONS,
  INTENSITY_OPTIONS,
} from "../../../constants/exercise";
import { formatDate, formatTime } from "../../../utils/date";
import { showError } from "../../../utils/error";
import CalendarPopup from "../../../components/CalendarPopup";
import TimePicker from "../../../components/TimePicker";
import ExerciseIntensityIcon from "../../../components/ExerciseIntensityIcon";
import type { ExerciseRecord } from "../../../types";
import "./index.css";

const CUSTOM_EXERCISES_KEY = "custom_exercises";

const ALL_PRESET_EXERCISES = new Set(
  EXERCISE_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.name)),
);

const EXERCISE_EMOJI_MAP = new Map(
  EXERCISE_CATEGORIES.flatMap((cat) => cat.items.map((item) => [item.name, item.emoji])),
);

function getStoredCustomExercises(): string[] {
  const stored = Taro.getStorageSync(CUSTOM_EXERCISES_KEY);
  return Array.isArray(stored) ? stored : [];
}

function saveCustomExercise(exercise: string) {
  const existing = getStoredCustomExercises();
  if (!existing.includes(exercise)) {
    Taro.setStorageSync(CUSTOM_EXERCISES_KEY, [...existing, exercise]);
  }
}

function removeCustomExercise(exercise: string) {
  const existing = getStoredCustomExercises();
  Taro.setStorageSync(
    CUSTOM_EXERCISES_KEY,
    existing.filter((e) => e !== exercise),
  );
}

export default function ExerciseAdd() {
  const router = useRouter();
  const editId = router.params.id;
  const isEdit = !!editId;

  const [date, setDate] = useState(formatDate());
  const [time, setTime] = useState(formatTime());
  const [selectedCategory, setSelectedCategory] = useState(-1);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [duration, setDuration] = useState<ExerciseRecord["duration"]>(30);
  const [intensity, setIntensity] = useState<ExerciseRecord["intensity"]>(2);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [topExercises, setTopExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (editId) {
      loadRecord(editId);
    }
  }, [editId]);

  const loadRecord = async (id: string) => {
    try {
      const record = await exerciseService.getById(id);
      if (record) {
        setDate(record.date);
        setTime(record.time || formatTime());
        setSelectedExercise(record.type);
        setDuration(record.duration);
        setIntensity(record.intensity);
        setNote(record.note || "");
      }
    } catch (error) {
      showError("加载失败", error);
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    setCustomExercises(getStoredCustomExercises());
    const exercises = exerciseService.getTopExercises(10);
    setTopExercises(exercises.filter((e) => ALL_PRESET_EXERCISES.has(e)));
  });

  const handleExerciseClick = (exercise: string) => {
    setSelectedExercise(selectedExercise === exercise ? "" : exercise);
  };

  const handleManualAdd = () => {
    const exercise = manualInput.trim();
    if (!exercise) {
      Taro.showToast({ title: "请输入运动名称", icon: "none" });
      return;
    }

    if (exercise.length > 20) {
      Taro.showToast({ title: "名称不能超过20个字符", icon: "none" });
      return;
    }

    setSelectedExercise(exercise);
    setManualInput("");
    if (!ALL_PRESET_EXERCISES.has(exercise)) {
      saveCustomExercise(exercise);
      setCustomExercises(getStoredCustomExercises());
    }
  };

  const handleDeleteCustomExercise = async (exercise: string) => {
    const res = await Taro.showModal({
      title: "删除运动",
      content: `确定要删除"${exercise}"吗？`,
    });
    if (res.confirm) {
      removeCustomExercise(exercise);
      setCustomExercises(getStoredCustomExercises());
      if (selectedExercise === exercise) {
        setSelectedExercise("");
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
        await exerciseService.delete(editId);
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

    if (!selectedExercise) {
      Taro.showToast({ title: "请选择运动类型", icon: "none" });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        date,
        time,
        type: selectedExercise,
        duration,
        intensity,
        note: note.trim() || undefined,
      };

      if (isEdit && editId) {
        await exerciseService.update(editId, data);
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        await exerciseService.add(data);
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

  const myFavoriteExercises = [
    ...topExercises,
    ...customExercises.filter((e) => !topExercises.includes(e)),
  ];

  const currentExercises =
    selectedCategory === -1
      ? myFavoriteExercises.map((name) => ({ name, emoji: EXERCISE_EMOJI_MAP.get(name) }))
      : EXERCISE_CATEGORIES[selectedCategory].items;

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

      {/* 运动类型选择 */}
      <View className="section">
        <Text className="section-title">运动类型</Text>

        {/* 分类标签 */}
        <View className="category-tabs">
          <View
            className={`category-tab ${selectedCategory === -1 ? "active" : ""}`}
            onClick={() => setSelectedCategory(-1)}
          >
            常用
          </View>
          {EXERCISE_CATEGORIES.map((cat, index) => (
            <View
              key={cat.name}
              className={`category-tab ${selectedCategory === index ? "active" : ""}`}
              onClick={() => setSelectedCategory(index)}
            >
              {cat.name}
            </View>
          ))}
        </View>

        {/* 运动网格 */}
        <View className="food-grid">
          {currentExercises.length === 0 ? (
            <Text className="no-food-hint">暂无常用运动，请从其他分类选择或手动输入</Text>
          ) : (
            currentExercises.map((exercise) => {
              const isCustom = selectedCategory === -1 && customExercises.includes(exercise.name);
              return (
                <View
                  key={exercise.name}
                  className={`food-item ${selectedExercise === exercise.name ? "selected" : ""} ${isCustom ? "custom" : ""}`}
                  onClick={() => handleExerciseClick(exercise.name)}
                  onLongPress={
                    isCustom ? () => handleDeleteCustomExercise(exercise.name) : undefined
                  }
                >
                  {exercise.emoji && <Text className="food-emoji">{exercise.emoji}</Text>}
                  <Text className="food-name">{exercise.name}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* 手动输入 */}
        {selectedCategory === -1 && (
          <View className="manual-input-row">
            <Input
              className="manual-input"
              placeholder="输入其他运动"
              value={manualInput}
              onInput={(e) => setManualInput(e.detail.value)}
              onConfirm={handleManualAdd}
            />
            <View className="manual-add-btn" onClick={handleManualAdd}>
              添加
            </View>
          </View>
        )}

        {/* 已选运动 */}
        {selectedExercise && (
          <View className="selected-exercise">
            <Text>已选：{selectedExercise}</Text>
          </View>
        )}
      </View>

      {/* 时长 */}
      <View className="section">
        <Text className="section-title">时长</Text>
        <View className="amount-options">
          {DURATION_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={`amount-item ${duration === option.value ? "active" : ""}`}
              onClick={() => setDuration(option.value as ExerciseRecord["duration"])}
            >
              <Text className="amount-label">{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 强度 */}
      <View className="section">
        <Text className="section-title">强度</Text>
        <View className="bristol-options">
          {INTENSITY_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={`bristol-item ${intensity === option.value ? "active" : ""}`}
              onClick={() => setIntensity(option.value as ExerciseRecord["intensity"])}
            >
              <ExerciseIntensityIcon
                level={option.value as 1 | 2 | 3}
                size={48}
                active={intensity === option.value}
              />
            </View>
          ))}
        </View>
        <View className="bristol-selected">
          <Text className="bristol-selected-label">{INTENSITY_OPTIONS[intensity - 1].label}</Text>
          <Text className="bristol-selected-desc">{INTENSITY_OPTIONS[intensity - 1].desc}</Text>
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
