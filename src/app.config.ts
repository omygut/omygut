export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/symptom/index/index",
    "pages/symptom/add/index",
    "pages/meal/index/index",
    "pages/meal/add/index",
    "pages/stool/index/index",
    "pages/stool/add/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "MyGut",
    navigationBarTextStyle: "black",
  },
  cloud: true,
});
