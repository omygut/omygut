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

  // Bristol type to score: 1→3, 2→4, 3→5, 4→5, 5→4, 6→3, 7→1
  const BRISTOL_SCORES = [0, 3, 4, 5, 5, 4, 3, 1];
  const getBristolScore = (bristol) => BRISTOL_SCORES[bristol] || 0;
  const getCountScore = (count) => Math.max(0, 6 - count);

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
