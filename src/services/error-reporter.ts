import Taro from "@tarojs/taro";
import { getDatabase, getOpenId } from "../utils/cloud";

interface ErrorReport {
  type: "error" | "unhandledRejection";
  message: string;
  stack?: string;
  page?: string;
  timestamp: Date;
  userId?: string;
  systemInfo?: {
    brand?: string;
    model?: string;
    system?: string;
    platform?: string;
    SDKVersion?: string;
    version?: string;
  };
}

let systemInfo: ErrorReport["systemInfo"] | null = null;

function getSystemInfo(): ErrorReport["systemInfo"] {
  if (systemInfo) return systemInfo;
  try {
    const info = Taro.getSystemInfoSync();
    systemInfo = {
      brand: info.brand,
      model: info.model,
      system: info.system,
      platform: info.platform,
      SDKVersion: info.SDKVersion,
      version: info.version,
    };
  } catch {
    systemInfo = {};
  }
  return systemInfo;
}

function getCurrentPage(): string {
  try {
    const pages = Taro.getCurrentPages();
    const current = pages[pages.length - 1];
    return current?.route || "unknown";
  } catch {
    return "unknown";
  }
}

async function reportError(report: ErrorReport): Promise<void> {
  try {
    const db = getDatabase();
    if (!db) return;

    let userId: string | undefined;
    try {
      userId = await getOpenId();
    } catch {
      // 用户未登录时忽略
    }

    await db.collection("error_logs").add({
      data: {
        ...report,
        userId,
        systemInfo: getSystemInfo(),
        page: getCurrentPage(),
        timestamp: new Date(),
      },
    });
  } catch (e) {
    // 上报失败时静默处理，避免死循环
    console.error("Error reporting failed:", e);
  }
}

export function setupErrorReporter(): void {
  // 捕获 JS 错误
  Taro.onError((error) => {
    const message = typeof error === "string" ? error : String(error);
    reportError({
      type: "error",
      message,
      timestamp: new Date(),
    });
  });

  // 捕获未处理的 Promise rejection
  Taro.onUnhandledRejection((res) => {
    const reason = res.reason;
    const message =
      typeof reason === "object" && reason !== null && "message" in reason
        ? String(reason.message)
        : String(reason);
    const stack =
      typeof reason === "object" && reason !== null && "stack" in reason
        ? String(reason.stack)
        : undefined;
    reportError({
      type: "unhandledRejection",
      message,
      stack,
      timestamp: new Date(),
    });
  });
}
