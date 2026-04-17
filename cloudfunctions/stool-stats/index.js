const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { startDate, endDate } = event;

  if (!startDate || !endDate) {
    return { error: "startDate and endDate are required" };
  }

  const collection = db.collection("stool_records");
  const MAX_LIMIT = 1000;
  const allData = [];

  // 云函数端单次最多 1000 条，可能需要分页
  let hasMore = true;
  while (hasMore) {
    const { data } = await collection
      .where({
        userId: OPENID,
        deletedAt: _.exists(false),
        date: _.gte(startDate).and(_.lte(endDate)),
      })
      .orderBy("date", "asc")
      .skip(allData.length)
      .limit(MAX_LIMIT)
      .get();

    allData.push(...data);
    hasMore = data.length === MAX_LIMIT;
  }

  // Bristol type to score: 1→2, 2→4, 3→6, 4→6, 5→4, 6→2, 7→0
  const BRISTOL_SCORES = [0, 2, 4, 6, 6, 4, 2, 0];
  const getBristolScore = (bristol) => BRISTOL_SCORES[bristol] || 0;
  // Count score: 1-2→4, 3→3, 4→2, 5→1, 6+→0
  const COUNT_SCORES = [0, 4, 4, 3, 2, 1, 0];
  const getCountScore = (count) => COUNT_SCORES[Math.min(count, 6)] || 0;

  // 按日期聚合统计
  const dailyData = {};
  allData.forEach((record) => {
    if (!dailyData[record.date]) {
      dailyData[record.date] = { count: 0, bristolSum: 0 };
    }
    dailyData[record.date].count += 1;
    dailyData[record.date].bristolSum += getBristolScore(record.type);
  });

  // 转换为数组格式，计算得分
  const result = Object.entries(dailyData)
    .map(([date, data]) => {
      const avgBristol = data.bristolSum / data.count;
      const score = avgBristol + getCountScore(data.count);
      return { date, count: data.count, score };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return { data: result };
};
