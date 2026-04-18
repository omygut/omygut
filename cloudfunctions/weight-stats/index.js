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
        weight: _.exists(true),
      })
      .orderBy("date", "asc")
      .orderBy("time", "asc")
      .skip(allData.length)
      .limit(MAX_LIMIT)
      .get();

    allData.push(...data);
    hasMore = data.length === MAX_LIMIT;
  }

  // 按日期聚合，取当天最晚的体重记录
  const dailyData = {};
  allData.forEach((record) => {
    if (!dailyData[record.date] || record.time > dailyData[record.date].time) {
      dailyData[record.date] = { weight: record.weight, time: record.time };
    }
  });

  const result = Object.entries(dailyData)
    .map(([date, data]) => ({ date, value: data.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { data: result };
};
