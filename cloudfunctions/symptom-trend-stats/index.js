const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { startDate, endDate, symptom } = event;

  if (!startDate || !endDate || !symptom) {
    return { error: "startDate, endDate and symptom are required" };
  }

  const collection = db.collection("symptom_records");
  const MAX_LIMIT = 1000;
  const allData = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await collection
      .where({
        userId: OPENID,
        deletedAt: _.exists(false),
        date: _.gte(startDate).and(_.lte(endDate)),
        symptoms: symptom,
        severity: _.exists(true),
      })
      .orderBy("date", "asc")
      .skip(allData.length)
      .limit(MAX_LIMIT)
      .get();

    allData.push(...data);
    hasMore = data.length === MAX_LIMIT;
  }

  // 按日期聚合，取平均值
  const dailyData = {};
  allData.forEach((record) => {
    if (!dailyData[record.date]) {
      dailyData[record.date] = { sum: 0, count: 0 };
    }
    dailyData[record.date].sum += record.severity;
    dailyData[record.date].count += 1;
  });

  // 生成日期范围内所有日期，没有症状的天数填0
  const result = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    if (dailyData[dateStr]) {
      const data = dailyData[dateStr];
      result.push({
        date: dateStr,
        value: Math.round((data.sum / data.count) * 10) / 10,
      });
    } else {
      result.push({ date: dateStr, value: 0 });
    }
  }

  return { data: result };
};
