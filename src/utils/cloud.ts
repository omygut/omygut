import Taro from "@tarojs/taro";

declare const IS_TEST_ENV: boolean;
declare const IS_E2E_ENV: boolean;

const E2E_TEST_USER_ID = "e2e_test_user";

// 内存数据库存储
const memoryStore: Map<string, Record<string, unknown>[]> = new Map();

// 查询命令标记
const EXISTS_FALSE = Symbol("exists_false");

// 内存数据库命令
const memoryCommand = {
  exists(value: boolean) {
    if (value === false) {
      return EXISTS_FALSE;
    }
    return { __exists: value };
  },
};

// 内存数据库实现
function createMemoryDatabase() {
  return {
    command: memoryCommand,
    collection(name: string) {
      if (!memoryStore.has(name)) {
        memoryStore.set(name, []);
      }
      const data = memoryStore.get(name)!;
      return createMemoryCollection(data);
    },
  };
}

function createMemoryCollection(data: Record<string, unknown>[]) {
  let filters: Record<string, unknown> = {};
  let sortField: string | null = null;
  let sortOrder: "asc" | "desc" = "asc";
  let limitCount: number | null = null;

  const query = {
    where(condition: Record<string, unknown>) {
      filters = { ...filters, ...condition };
      return query;
    },
    orderBy(field: string, order: "asc" | "desc") {
      sortField = field;
      sortOrder = order;
      return query;
    },
    limit(count: number) {
      limitCount = count;
      return query;
    },
    async get() {
      let result = data.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === EXISTS_FALSE) {
            return !(key in item) || item[key] === undefined || item[key] === null;
          }
          return item[key] === value;
        });
      });

      if (sortField) {
        const field = sortField;
        result = result.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      }

      if (limitCount !== null) {
        result = result.slice(0, limitCount);
      }

      return { data: result };
    },
    async add({ data: doc }: { data: Record<string, unknown> }) {
      const _id = `fake_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      data.push({ _id, ...doc });
      return { _id };
    },
    async update({ data: updates }: { data: Record<string, unknown> }) {
      const items = data.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === EXISTS_FALSE) {
            return !(key in item) || item[key] === undefined || item[key] === null;
          }
          return item[key] === value;
        });
      });
      items.forEach((item) => Object.assign(item, updates));
      return { stats: { updated: items.length } };
    },
    doc(id: string) {
      return {
        async get() {
          const item = data.find((d) => d._id === id);
          return { data: item || null };
        },
        async remove() {
          const index = data.findIndex((d) => d._id === id);
          if (index !== -1) {
            data.splice(index, 1);
          }
        },
        async update({ data: updates }: { data: Record<string, unknown> }) {
          const item = data.find((d) => d._id === id);
          if (item) {
            Object.assign(item, updates);
          }
        },
      };
    },
  };

  return query;
}

// 内存数据库单例
let memoryDb: ReturnType<typeof createMemoryDatabase> | null = null;

function getMemoryDatabase() {
  if (!memoryDb) {
    memoryDb = createMemoryDatabase();
  }
  return memoryDb;
}

// 获取数据库实例
export function getDatabase() {
  if (IS_TEST_ENV) {
    return getMemoryDatabase();
  }
  return Taro.cloud.database();
}

// 获取当前用户的 openid
let cachedOpenId: string | null = null;

export async function getOpenId(): Promise<string> {
  // E2E 测试使用固定的测试用户 ID
  if (IS_E2E_ENV) {
    return E2E_TEST_USER_ID;
  }

  if (cachedOpenId) {
    return cachedOpenId;
  }

  // 先尝试从本地存储获取
  const stored = Taro.getStorageSync("openid");
  if (stored) {
    cachedOpenId = stored;
    return stored;
  }

  // 调用云函数获取
  try {
    const res = await Taro.cloud.callFunction({
      name: "login",
    });
    const openid = (res.result as { openid: string }).openid;
    cachedOpenId = openid;
    Taro.setStorageSync("openid", openid);
    return openid;
  } catch (error) {
    console.error("获取 openid 失败:", error);
    throw error;
  }
}
