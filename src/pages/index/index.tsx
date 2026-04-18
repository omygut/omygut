import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useState, useCallback, useEffect } from "react";
import { symptomService } from "../../services/symptom";
import { mealService } from "../../services/meal";
import { stoolService } from "../../services/stool";
import { medicationService } from "../../services/medication";
import { labTestService } from "../../services/labtest";
import { examService } from "../../services/exam";
import { assessmentService } from "../../services/assessment";
import { formatDate, getPrevDate, getNextDate, getWeekday } from "../../utils/date";
import RecordItem, { AnyRecord } from "../../components/RecordItem";
import CalendarPopup from "../../components/CalendarPopup";
import type { RecordType } from "../../types";
import { RECORD_TYPE_OPTIONS } from "../../types";
import logoImg from "../../assets/logo.jpg";
import "./index.css";

interface RecordGroup {
  type: RecordType;
  icon: string;
  title: string;
  addPath: string;
  records: AnyRecord[];
}

const COLLAPSED_STATE_KEY = "record_card_collapsed";

function getCollapsedState(): Record<RecordType, boolean> {
  const stored = Taro.getStorageSync(COLLAPSED_STATE_KEY);
  return stored || {};
}

function saveCollapsedState(state: Record<RecordType, boolean>) {
  Taro.setStorageSync(COLLAPSED_STATE_KEY, state);
}

export default function Index() {
  const [navHeight, setNavHeight] = useState({ statusBarHeight: 0, navBarHeight: 44 });
  const [currentDate, setCurrentDate] = useState(formatDate());
  const [loading, setLoading] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [recordGroups, setRecordGroups] = useState<RecordGroup[]>([]);
  const [collapsedState, setCollapsedState] =
    useState<Record<RecordType, boolean>>(getCollapsedState);

  useEffect(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const menuButton = Taro.getMenuButtonBoundingClientRect();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2;
    setNavHeight({ statusBarHeight, navBarHeight });
  }, []);

  const loadData = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const [symptoms, medications, meals, stools, labTests, exams, assessments] =
        await Promise.all([
          symptomService.getByDate(date),
          medicationService.getByDate(date),
          mealService.getByDate(date),
          stoolService.getByDate(date),
          labTestService.getByDate(date),
          examService.getByDate(date),
          assessmentService.getByDate(date),
        ]);

      const recordsMap: Record<RecordType, AnyRecord[]> = {
        symptom: symptoms.map((r) => ({ ...r, _type: "symptom" as const })),
        medication: medications.map((r) => ({ ...r, _type: "medication" as const })),
        meal: meals.map((r) => ({ ...r, _type: "meal" as const })),
        stool: stools.map((r) => ({ ...r, _type: "stool" as const })),
        labtest: labTests.map((r) => ({ ...r, _type: "labtest" as const })),
        exam: exams.map((r) => ({ ...r, _type: "exam" as const })),
        assessment: assessments.map((r) => ({ ...r, _type: "assessment" as const })),
      };

      const groups = RECORD_TYPE_OPTIONS.map((opt) => ({
        type: opt.value,
        icon: opt.icon,
        title: opt.label,
        addPath: opt.addPath,
        records: recordsMap[opt.value],
      }));
      setRecordGroups(groups);

      // Auto-collapse empty categories (only if user hasn't manually set)
      const storedState = getCollapsedState();
      const autoCollapsedState: Record<RecordType, boolean> = {};
      groups.forEach((group) => {
        // If user has manually set this category, keep their preference
        if (storedState[group.type] !== undefined) {
          autoCollapsedState[group.type] = storedState[group.type];
        } else {
          // Otherwise, collapse if empty
          autoCollapsedState[group.type] = group.records.length === 0;
        }
      });
      setCollapsedState(autoCollapsedState);
    } catch (error) {
      console.error("加载数据失败:", error);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleRecordChange = () => {
      loadData(currentDate);
    };
    Taro.eventCenter.on("recordChange", handleRecordChange);
    return () => {
      Taro.eventCenter.off("recordChange", handleRecordChange);
    };
  }, [currentDate, loadData]);

  useDidShow(() => {
    if (recordGroups.length === 0) {
      loadData(currentDate);
    }
  });

  usePullDownRefresh(async () => {
    await loadData(currentDate);
    Taro.stopPullDownRefresh();
  });

  const handlePrevDate = () => {
    const newDate = getPrevDate(currentDate);
    setCurrentDate(newDate);
    loadData(newDate);
  };

  const today = formatDate();
  const isToday = currentDate === today;

  const handleNextDate = () => {
    if (isToday) return;
    const newDate = getNextDate(currentDate);
    setCurrentDate(newDate);
    loadData(newDate);
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    loadData(newDate);
  };

  const toggleCollapsed = (type: RecordType) => {
    const newState = { ...collapsedState, [type]: !collapsedState[type] };
    setCollapsedState(newState);
    saveCollapsedState(newState);
  };

  const totalHeaderHeight = navHeight.statusBarHeight + navHeight.navBarHeight;

  return (
    <View className="index-page" style={{ paddingTop: `${totalHeaderHeight}px` }}>
      <View
        className="top-header"
        style={{
          paddingTop: `${navHeight.statusBarHeight}px`,
          height: `${navHeight.navBarHeight}px`,
        }}
      >
        <Image className="app-logo" src={logoImg} mode="aspectFit" />
        <Text className="app-title">MyGut - 肠道健康记录</Text>
      </View>

      {/* 日期选择器 */}
      <View className="date-selector">
        <Text className="date-arrow" onClick={handlePrevDate}>
          ◀
        </Text>
        <Text className="date-text" onClick={() => setCalendarVisible(true)}>
          {currentDate} {getWeekday(currentDate)}
        </Text>
        <Text className={`date-arrow ${isToday ? "disabled" : ""}`} onClick={handleNextDate}>
          ▶
        </Text>
      </View>

      <CalendarPopup
        visible={calendarVisible}
        value={currentDate}
        onChange={handleDateChange}
        onClose={() => setCalendarVisible(false)}
      />

      {loading ? (
        <View className="loading">加载中...</View>
      ) : (
        <View className="records-container">
          {recordGroups.map((group) => {
            const isCollapsed = collapsedState[group.type];
            return (
              <View key={group.type} className="record-card">
                <View className="card-header" onClick={() => toggleCollapsed(group.type)}>
                  <View className="card-title-row">
                    <Text className={`card-arrow ${isCollapsed ? "collapsed" : ""}`}>▼</Text>
                    <Text className="card-icon">{group.icon}</Text>
                    <Text className="card-title">{group.title}</Text>
                    <Text className="card-count">[{group.records.length}条]</Text>
                  </View>
                  <Text
                    className="card-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      Taro.navigateTo({ url: group.addPath });
                    }}
                  >
                    ＋
                  </Text>
                </View>
                {!isCollapsed && (
                  <View className="card-content">
                    {group.records.length === 0 ? (
                      <Text className="empty-hint">暂无记录</Text>
                    ) : (
                      group.records.map((record) => <RecordItem key={record._id} record={record} />)
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
