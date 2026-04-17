import { View, Text } from "@tarojs/components";
import "./index.css";

export default function Privacy() {
  return (
    <View className="privacy-page">
      <View className="section">
        <Text className="section-title">数据收集</Text>
        <Text className="section-content">
          本应用收集您主动填写的健康记录数据，仅用于您个人的健康管理。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">数据存储</Text>
        <Text className="section-content">
          您的数据存储在微信云开发平台，采用加密传输，仅您本人可以访问。开发者无法查看您的微信账号、手机号等身份信息，也无法将您的数据与您的真实身份关联。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">数据使用</Text>
        <Text className="section-content">
          您的数据仅用于在本应用内展示，帮助您记录和回顾个人健康状况。我们不会将您的数据用于任何其他目的。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">数据共享</Text>
        <Text className="section-content">
          在未经您明确允许的情况下，我们不会与任何第三方共享您的健康数据。您的数据完全属于您个人。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">图片识别</Text>
        <Text className="section-content">
          为了识别您上传的检查报告和化验报告，我们会将图片发送至第三方 AI
          服务进行处理。请务必在上传前抹除图片中的姓名、住址、身份证号、手机号、就诊卡号等个人隐私信息。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">数据导出</Text>
        <Text className="section-content">
          您可以在设置页面导出您的全部数据，获取 JSON 格式的数据副本。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">数据删除</Text>
        <Text className="section-content">
          您可以在设置页面一键删除全部数据。一旦执行删除操作，我们将从服务器彻底清除您的所有健康记录和个人资料。此操作不可撤销，程序后台也无法恢复，请务必谨慎操作。
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">开源代码</Text>
        <Text className="section-content">
          本项目完全开源，您可以在 GitHub 查看源代码：github.com/omygut/omygut
        </Text>
      </View>

      <View className="section">
        <Text className="section-title">联系我们</Text>
        <Text className="section-content">
          如有任何隐私相关问题，请通过设置页面的"联系开发者"功能与我们联系。
        </Text>
      </View>
    </View>
  );
}
