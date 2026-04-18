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

  // Query both old format (symptoms array) and new format (symptomItems array)
  // Old format: symptoms contains the symptom name, severity is shared
  // New format: symptomItems contains {name, severity} objects
  const oldFormatData = [];
  const newFormatData = [];

  // Query old format records
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
      .skip(oldFormatData.length)
      .limit(MAX_LIMIT)
      .get();

    oldFormatData.push(...data);
    hasMore = data.length === MAX_LIMIT;
  }

  // Query new format records
  hasMore = true;
  while (hasMore) {
    const { data } = await collection
      .where({
        userId: OPENID,
        deletedAt: _.exists(false),
        date: _.gte(startDate).and(_.lte(endDate)),
        "symptomItems.name": symptom,
      })
      .orderBy("date", "asc")
      .skip(newFormatData.length)
      .limit(MAX_LIMIT)
      .get();

    newFormatData.push(...data);
    hasMore = data.length === MAX_LIMIT;
  }

  // 按日期聚合，取平均值
  const dailyData = {};

  // Process old format records
  oldFormatData.forEach((record) => {
    if (!dailyData[record.date]) {
      dailyData[record.date] = { sum: 0, count: 0 };
    }
    dailyData[record.date].sum += record.severity;
    dailyData[record.date].count += 1;
  });

  // Process new format records
  newFormatData.forEach((record) => {
    const item = record.symptomItems.find((s) => s.name === symptom);
    if (item) {
      if (!dailyData[record.date]) {
        dailyData[record.date] = { sum: 0, count: 0 };
      }
      dailyData[record.date].sum += item.severity;
      dailyData[record.date].count += 1;
    }
  });

  // 只返回有数据的日期
  const result = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      value: Math.round((data.sum / data.count) * 10) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { data: result };
};
