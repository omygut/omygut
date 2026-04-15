import { getDatabase, getOpenId } from "../utils/cloud";
import type { BaseRecord } from "../types";

export type { BaseRecord };

export function createRecordService<T extends BaseRecord>(collection: string) {
  return {
    async add(data: Omit<T, "_id" | "userId" | "createdAt">): Promise<string> {
      const db = getDatabase();
      const userId = await getOpenId();
      const res = await db.collection(collection).add({
        data: { ...data, userId, createdAt: new Date() },
      });
      return res._id as string;
    },

    async getRecent(limit = 20): Promise<T[]> {
      const db = getDatabase();
      const userId = await getOpenId();
      const _ = db.command;

      // 云数据库单次最多返回20条（小程序端限制），需要分页
      const PAGE_SIZE = 20;
      const allData: T[] = [];

      while (allData.length < limit) {
        const batchLimit = Math.min(PAGE_SIZE, limit - allData.length);
        const res = await db
          .collection(collection)
          .where({
            userId,
            deletedAt: _.exists(false),
          })
          .orderBy("date", "desc")
          .orderBy("time", "desc")
          .skip(allData.length)
          .limit(batchLimit)
          .get();

        allData.push(...(res.data as T[]));

        // 如果返回的数据少于请求的，说明没有更多了
        if (res.data.length < batchLimit) break;
      }

      return allData;
    },

    async delete(id: string): Promise<void> {
      const db = getDatabase();
      const userId = await getOpenId();
      await db
        .collection(collection)
        .where({ _id: id, userId })
        .update({
          data: { deletedAt: new Date() },
        });
    },

    async getByDate(date: string): Promise<T[]> {
      const db = getDatabase();
      const userId = await getOpenId();
      const _ = db.command;

      const PAGE_SIZE = 20;
      const allData: T[] = [];

      while (true) {
        const res = await db
          .collection(collection)
          .where({
            userId,
            date,
            deletedAt: _.exists(false),
          })
          .orderBy("time", "asc")
          .skip(allData.length)
          .limit(PAGE_SIZE)
          .get();

        allData.push(...(res.data as T[]));

        if (res.data.length < PAGE_SIZE) break;
      }

      return allData;
    },

    async getById(id: string): Promise<T | null> {
      const db = getDatabase();
      const userId = await getOpenId();
      const res = await db.collection(collection).where({ _id: id, userId }).get();
      return (res.data[0] as T) || null;
    },

    async update(
      id: string,
      data: Partial<Omit<T, "_id" | "userId" | "createdAt">>,
    ): Promise<void> {
      const db = getDatabase();
      const userId = await getOpenId();
      await db.collection(collection).where({ _id: id, userId }).update({ data });
    },
  };
}
