export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/records/index",
    "pages/settings/index",
    "pages/symptom/index/index",
    "pages/symptom/add/index",
    "pages/meal/index/index",
    "pages/meal/add/index",
    "pages/stool/index/index",
    "pages/stool/add/index",
    "pages/medication/index/index",
    "pages/medication/add/index",
    "pages/labtest/add/index",
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
        text: "📋 记录",
      },
      {
        pagePath: "pages/settings/index",
        text: "⚙️ 设置",
      },
    ],
  },
  cloud: true,
});
