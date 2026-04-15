import { PropsWithChildren } from "react";
import Taro, { useLaunch } from "@tarojs/taro";
import { setupErrorReporter } from "./services/error-reporter";

import "./app.css";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.");

    // 初始化云开发
    if (process.env.TARO_ENV === "weapp" && process.env.TARO_APP_CLOUD_ENV) {
      Taro.cloud.init({
        env: process.env.TARO_APP_CLOUD_ENV,
        traceUser: true,
      });

      // 初始化错误上报
      setupErrorReporter();
    }
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
