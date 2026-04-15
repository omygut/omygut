export default defineAppConfig({
  lazyCodeLoading: "requiredComponents",
  pages: [
    "pages/index/index",
    "pages/records/index",
    "pages/history/index",
    "pages/settings/index",
    "pages/symptom/add/index",
    "pages/meal/add/index",
    "pages/stool/add/index",
    "pages/medication/add/index",
    "pages/labtest/add/index",
    "pages/common/mosaic/index",
    "pages/exam/add/index",
    "pages/privacy/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "MyGut",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#999",
    selectedColor: "#07c160",
    backgroundColor: "#fff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "🏠 首页",
      },
      {
        pagePath: "pages/records/index",
        text: "📅 日期",
      },
      {
        pagePath: "pages/history/index",
        text: "📋 历史",
      },
      {
        pagePath: "pages/settings/index",
        text: "⚙️ 设置",
      },
    ],
  },
  // @ts-expect-error WeChat cloud development - not typed in Taro's AppConfig
  cloud: true,
});
