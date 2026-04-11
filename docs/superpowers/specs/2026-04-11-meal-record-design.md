# 饮食记录功能设计

## 概述

实现饮食记录功能，帮助用户追踪每日饮食。用户可从预设食物中快速选择，也可手动输入。

## 数据模型

```typescript
interface MealRecord {
  _id?: string;
  userId: string;
  date: string;      // 2026-04-10
  time: string;      // 08:30
  foods: string[];   // ['米饭', '青菜', '鸡肉']
  amount: 1 | 2 | 3; // 1-少量 2-适中 3-大量
  note?: string;
  createdAt: Date;
}
```

与原 Issue 定义的区别：
- 移除 `mealType` 字段（早餐/午餐等分类不需要）
- 新增 `amount` 字段（进食量评估）

## 预设食物分类

```typescript
const FOOD_CATEGORIES = [
  {
    name: '主食',
    items: ['米饭', '面条', '馒头', '面包', '饺子', '包子', '安素']
  },
  {
    name: '肉类',
    items: ['猪肉', '牛肉', '鸡肉', '鱼', '虾']
  },
  {
    name: '蔬菜',
    items: ['青菜', '白菜', '西红柿', '黄瓜', '胡萝卜']
  },
  {
    name: '水果',
    items: ['苹果', '香蕉', '橙子', '葡萄']
  },
  {
    name: '饮品',
    items: ['牛奶', '咖啡', '茶', '果汁', '酒']
  },
  {
    name: '零食',
    items: ['饼干', '薯片', '坚果', '巧克力']
  }
];
```

## 进食量选项

| 值 | 标签 | 显示 |
|----|------|------|
| 1  | 少量 | 🍚 |
| 2  | 适中 | 🍚🍚 |
| 3  | 大量 | 🍚🍚🍚 |

## 页面设计

### 添加页面 `/pages/meal/add`

**布局结构：**

1. **时间选择**
   - 日期选择器
   - 时间选择器

2. **食物选择**
   - 分类标签栏（横向滚动）
   - 当前分类的食物网格（点击添加到已选）
   - 手动输入框 + 添加按钮

3. **已选食物**
   - 显示已选食物标签
   - 每个标签可点击删除

4. **进食量**
   - 三个选项：少量/适中/大量
   - 样式类似 health 页面的"整体感受"

5. **备注**
   - 文本输入框（可选）

6. **保存按钮**
   - 固定在底部

### 列表页面 `/pages/meal/index`

沿用 health 页面模式：
- 顶部标题 + 添加按钮
- 记录列表，每条显示：
  - 日期时间
  - 食物列表
  - 进食量
  - 备注（如有）
- 长按删除
- 空状态引导

## 文件结构

```
src/
├── constants/
│   └── meal.ts              # 食物分类、进食量选项
├── pages/
│   └── meal/
│       ├── index/
│       │   ├── index.tsx    # 列表页
│       │   ├── index.css
│       │   └── index.config.ts
│       └── add/
│           ├── index.tsx    # 添加页
│           ├── index.css
│           └── index.config.ts
└── services/
    ├── meal.ts              # 服务层
    └── meal.test.ts         # 集成测试
```

## 服务层接口

```typescript
// 添加饮食记录
async function addMealRecord(
  data: Omit<MealRecord, '_id' | 'userId' | 'createdAt'>
): Promise<string>

// 获取最近的饮食记录
async function getRecentMealRecords(limit?: number): Promise<MealRecord[]>

// 删除饮食记录
async function deleteMealRecord(id: string): Promise<void>
```

## 云开发

- 数据库集合：`meal_records`

## 类型更新

需要更新 `src/types/index.ts` 中的 `MealRecord` 定义：
- 移除 `mealType` 字段
- 新增 `amount: 1 | 2 | 3` 字段
