import { PropsWithChildren } from "react";
import Taro, { useLaunch } from "@tarojs/taro";

import "./app.css";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.");

    // 初始化云开发
    if (process.env.TARO_ENV === "weapp") {
      Taro.cloud.init({
        env: "mygut-0gxnkkl73742f6f9",
        traceUser: true,
      });
    }
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
