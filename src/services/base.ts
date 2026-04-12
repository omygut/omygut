import { getDatabase, getOpenId } from "../utils/cloud";

interface BaseRecord {
  _id?: string;
  userId: string;
  date: string;
  createdAt: Date;
  deletedAt?: Date;
}

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
      const res = await db
        .collection(collection)
        .where({
          userId,
          deletedAt: _.exists(false),
        })
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      return res.data as T[];
    },

    async delete(id: string): Promise<void> {
      const db = getDatabase();
      await db
        .collection(collection)
        .doc(id)
        .update({
          data: { deletedAt: new Date() },
        });
    },

    async getByDate(date: string): Promise<T[]> {
      const db = getDatabase();
      const userId = await getOpenId();
      const _ = db.command;
      const res = await db
        .collection(collection)
        .where({
          userId,
          date,
          deletedAt: _.exists(false),
        })
        .orderBy("time", "asc")
        .get();
      return res.data as T[];
    },
  };
}
