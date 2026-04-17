export default defineAppConfig({
  lazyCodeLoading: "requiredComponents",
  pages: [
    "pages/index/index",
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
    selectedColor: "#5fcf9a",
    backgroundColor: "#fff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "assets/tabbar/home.png",
        selectedIconPath: "assets/tabbar/home-active.png",
      },
      {
        pagePath: "pages/history/index",
        text: "数据",
        iconPath: "assets/tabbar/data.png",
        selectedIconPath: "assets/tabbar/data-active.png",
      },
      {
        pagePath: "pages/settings/index",
        text: "设置",
        iconPath: "assets/tabbar/settings.png",
        selectedIconPath: "assets/tabbar/settings-active.png",
      },
    ],
  },
  // @ts-expect-error WeChat cloud development - not typed in Taro's AppConfig
  cloud: true,
});
