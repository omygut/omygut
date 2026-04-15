import Taro from "@tarojs/taro";

/**
 * 从错误对象中提取详细信息
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    // 微信云开发错误通常有 errMsg 字段
    const wxError = error as { errMsg?: string; message?: string; errCode?: number };
    if (wxError.errMsg) {
      return wxError.errMsg;
    }
    if (wxError.message) {
      return wxError.message;
    }
    if (wxError.errCode) {
      return `错误码: ${wxError.errCode}`;
    }
    return JSON.stringify(error);
  }
  return String(error);
}

/**
 * 显示错误弹窗，包含详细错误信息
 */
export function showError(title: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`${title}:`, error);

  Taro.showModal({
    title,
    content: message,
    showCancel: false,
    confirmText: "确定",
  });
}
