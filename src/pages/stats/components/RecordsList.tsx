import { View, Text, ScrollView } from "@tarojs/components";
import RecordItem, { AnyRecord } from "../../../components/RecordItem";
import { formatDisplayDate, getWeekday } from "../../../utils/date";

interface RecordsListProps {
  records: AnyRecord[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
}

export default function RecordsList({
  records,
  loading,
  loadingMore,
  hasMore,
  onRefresh,
  onLoadMore,
}: RecordsListProps) {
  if (loading) {
    return <View className="loading">加载中...</View>;
  }

  if (records.length === 0) {
    return (
      <View className="empty">
        <Text className="empty-text">暂无记录</Text>
      </View>
    );
  }

  // Group records by date
  const groupedRecords: { date: string; records: AnyRecord[] }[] = [];
  let currentDate = "";
  records.forEach((record) => {
    if (record.date !== currentDate) {
      currentDate = record.date;
      groupedRecords.push({ date: record.date, records: [] });
    }
    groupedRecords[groupedRecords.length - 1].records.push(record);
  });

  return (
    <ScrollView
      className="records-scroll"
      scrollY
      refresherEnabled
      refresherTriggered={loading}
      onRefresherRefresh={onRefresh}
      onScrollToLower={onLoadMore}
      lowerThreshold={100}
    >
      <View className="records-list">
        {groupedRecords.map((group) => (
          <View key={group.date} className="date-group">
            <View className="date-header">
              <Text className="date-text">
                {formatDisplayDate(group.date)} {getWeekday(group.date)}
              </Text>
            </View>
            <View className="date-records">
              {group.records.map((record) => (
                <RecordItem key={record._id} record={record} />
              ))}
            </View>
          </View>
        ))}
      </View>
      {loadingMore && (
        <View className="loading-more">
          <Text>加载中...</Text>
        </View>
      )}
      {!hasMore && records.length > 0 && (
        <View className="no-more">
          <Text>没有更多了</Text>
        </View>
      )}
    </ScrollView>
  );
}
