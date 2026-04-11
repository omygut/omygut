import Taro from "@tarojs/taro";

// 获取数据库实例
export function getDatabase() {
  return Taro.cloud.database();
}

// 获取当前用户的 openid
let cachedOpenId: string | null = null;

export async function getOpenId(): Promise<string> {
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
