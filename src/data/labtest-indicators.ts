// 此文件由 scripts/generate-labtest-indicators.ts 自动生成
// 请勿手动编辑，修改请编辑 src/data/labtest-indicators.csv

import type { StandardIndicator } from "../services/labtest-standards";

export const STANDARD_INDICATORS: StandardIndicator[] = [
  {
    "category": "血常规",
    "nameZh": "白细胞计数",
    "abbr": "WBC",
    "unit": "×10⁹/L",
    "refMin": 4,
    "refMax": 10,
    "aliases": [
      "白细胞",
      "白血球"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "红细胞计数",
    "abbr": "RBC",
    "unit": "×10¹²/L",
    "refMin": 3.8,
    "refMax": 5.9,
    "aliases": [
      "红细胞",
      "红血球"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "血红蛋白",
    "abbr": "HGB",
    "unit": "g/L",
    "refMin": 115,
    "refMax": 175,
    "aliases": [
      "血红蛋白测定",
      "Hb"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "红细胞压积",
    "abbr": "HCT",
    "unit": "%",
    "refMin": 35,
    "refMax": 50,
    "aliases": [
      "压积"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "平均红细胞体积",
    "abbr": "MCV",
    "unit": "fL",
    "refMin": 80,
    "refMax": 100
  },
  {
    "category": "血常规",
    "nameZh": "平均血红蛋白量",
    "abbr": "MCH",
    "unit": "pg",
    "refMin": 27,
    "refMax": 34,
    "aliases": [
      "平均红细胞血红蛋白含量"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "平均血红蛋白浓度",
    "abbr": "MCHC",
    "unit": "g/L",
    "refMin": 320,
    "refMax": 360,
    "aliases": [
      "平均红细胞血红蛋白浓度"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "血小板计数",
    "abbr": "PLT",
    "unit": "×10⁹/L",
    "refMin": 100,
    "refMax": 300,
    "aliases": [
      "血小板"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "中性粒细胞百分比",
    "abbr": "NEUT%",
    "unit": "%",
    "refMin": 40,
    "refMax": 75,
    "aliases": [
      "中性粒细胞比率"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "中性粒细胞绝对值",
    "abbr": "NEUT#",
    "unit": "×10⁹/L",
    "refMin": 2,
    "refMax": 7
  },
  {
    "category": "血常规",
    "nameZh": "淋巴细胞百分比",
    "abbr": "LYMPH%",
    "unit": "%",
    "refMin": 20,
    "refMax": 50,
    "aliases": [
      "淋巴细胞比率"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "淋巴细胞绝对值",
    "abbr": "LYMPH#",
    "unit": "×10⁹/L",
    "refMin": 0.8,
    "refMax": 4,
    "aliases": [
      "淋巴细胞计数"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "单核细胞百分比",
    "abbr": "MONO%",
    "unit": "%",
    "refMin": 3,
    "refMax": 10,
    "aliases": [
      "单核细胞比率"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "单核细胞绝对值",
    "abbr": "MONO#",
    "unit": "×10⁹/L",
    "refMin": 0.12,
    "refMax": 0.8
  },
  {
    "category": "血常规",
    "nameZh": "嗜酸性粒细胞百分比",
    "abbr": "EO%",
    "unit": "%",
    "refMin": 0.5,
    "refMax": 5,
    "aliases": [
      "嗜酸性粒细胞比率"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "嗜酸性粒细胞绝对值",
    "abbr": "EO#",
    "unit": "×10⁹/L",
    "refMin": 0.02,
    "refMax": 0.5
  },
  {
    "category": "血常规",
    "nameZh": "嗜碱性粒细胞百分比",
    "abbr": "BASO%",
    "unit": "%",
    "refMin": 0,
    "refMax": 1,
    "aliases": [
      "嗜碱性粒细胞比率"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "嗜碱性粒细胞绝对值",
    "abbr": "BASO#",
    "unit": "×10⁹/L",
    "refMin": 0,
    "refMax": 0.1
  },
  {
    "category": "血常规",
    "nameZh": "红细胞分布宽度",
    "abbr": "RDW",
    "unit": "%",
    "refMin": 11,
    "refMax": 15,
    "aliases": [
      "红细胞分布宽度变异系数",
      "RDW-CV"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "红细胞分布宽度SD",
    "abbr": "RDW-SD",
    "unit": "fL",
    "refMin": 37,
    "refMax": 51
  },
  {
    "category": "血常规",
    "nameZh": "血小板分布宽度",
    "abbr": "PDW",
    "unit": "fL",
    "refMin": 9,
    "refMax": 17
  },
  {
    "category": "血常规",
    "nameZh": "血小板平均体积",
    "abbr": "MPV",
    "unit": "fL",
    "refMin": 7,
    "refMax": 11,
    "aliases": [
      "平均血小板体积"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "大型血小板比率",
    "abbr": "P-LCR",
    "unit": "%",
    "refMin": 13,
    "refMax": 43,
    "aliases": [
      "大血小板比率"
    ]
  },
  {
    "category": "血常规",
    "nameZh": "血小板压积",
    "abbr": "PCT",
    "unit": "%",
    "refMin": 0.1,
    "refMax": 0.3
  },
  {
    "category": "血沉",
    "nameZh": "红细胞沉降率",
    "abbr": "ESR",
    "unit": "mm/h",
    "refMin": 0,
    "refMax": 20,
    "aliases": [
      "血沉"
    ]
  },
  {
    "category": "C反应蛋白",
    "nameZh": "C反应蛋白",
    "abbr": "CRP",
    "unit": "mg/L",
    "refMin": 0,
    "refMax": 10,
    "aliases": [
      "C-反应蛋白"
    ]
  },
  {
    "category": "C反应蛋白",
    "nameZh": "超敏C反应蛋白",
    "abbr": "hs-CRP",
    "unit": "mg/L",
    "refMin": 0,
    "refMax": 3
  },
  {
    "category": "肝功能",
    "nameZh": "丙氨酸氨基转移酶",
    "abbr": "ALT",
    "unit": "U/L",
    "refMin": 7,
    "refMax": 40,
    "aliases": [
      "谷丙转氨酶"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "天门冬氨酸氨基转移酶",
    "abbr": "AST",
    "unit": "U/L",
    "refMin": 13,
    "refMax": 35,
    "aliases": [
      "谷草转氨酶",
      "天冬氨酸氨基转移酶"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "碱性磷酸酶",
    "abbr": "ALP",
    "unit": "U/L",
    "refMin": 40,
    "refMax": 150
  },
  {
    "category": "肝功能",
    "nameZh": "γ-谷氨酰转移酶",
    "abbr": "GGT",
    "unit": "U/L",
    "refMin": 10,
    "refMax": 60,
    "aliases": [
      "γ-谷氨酰转肽酶",
      "谷氨酰转肽酶"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "总胆红素",
    "abbr": "TBIL",
    "unit": "μmol/L",
    "refMin": 5,
    "refMax": 21,
    "aliases": [
      "总胆红素(重氮法)"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "直接胆红素",
    "abbr": "DBIL",
    "unit": "μmol/L",
    "refMin": 0,
    "refMax": 7
  },
  {
    "category": "肝功能",
    "nameZh": "间接胆红素",
    "abbr": "IBIL",
    "unit": "μmol/L",
    "refMin": 3,
    "refMax": 14
  },
  {
    "category": "肝功能",
    "nameZh": "总蛋白",
    "abbr": "TP",
    "unit": "g/L",
    "refMin": 60,
    "refMax": 80,
    "aliases": [
      "总蛋白定量"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "白蛋白",
    "abbr": "ALB",
    "unit": "g/L",
    "refMin": 35,
    "refMax": 55,
    "aliases": [
      "白蛋白定量",
      "白蛋白定量(溴甲酚绿)"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "球蛋白",
    "abbr": "GLB",
    "unit": "g/L",
    "refMin": 20,
    "refMax": 35
  },
  {
    "category": "肝功能",
    "nameZh": "白球比",
    "abbr": "A/G",
    "refMin": 1.2,
    "refMax": 2.5,
    "aliases": [
      "白球比值"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "血清总胆汁酸",
    "abbr": "TBA",
    "unit": "μmol/L",
    "refMin": 0,
    "refMax": 10,
    "aliases": [
      "总胆汁酸"
    ]
  },
  {
    "category": "肝功能",
    "nameZh": "前白蛋白",
    "abbr": "PA",
    "unit": "mg/L",
    "refMin": 200,
    "refMax": 400
  },
  {
    "category": "肾功能",
    "nameZh": "血尿素氮",
    "abbr": "BUN",
    "unit": "mmol/L",
    "refMin": 2.8,
    "refMax": 7.1,
    "aliases": [
      "尿素氮",
      "尿素氮(酶法)",
      "尿素"
    ]
  },
  {
    "category": "肾功能",
    "nameZh": "肌酐",
    "abbr": "CREA",
    "unit": "μmol/L",
    "refMin": 44,
    "refMax": 97,
    "aliases": [
      "肌酐(酶法)",
      "肌酸酐",
      "Cr"
    ]
  },
  {
    "category": "肾功能",
    "nameZh": "尿酸",
    "abbr": "UA",
    "unit": "μmol/L",
    "refMin": 155,
    "refMax": 428
  },
  {
    "category": "肾功能",
    "nameZh": "估算肾小球滤过率",
    "abbr": "eGFR",
    "unit": "mL/min/1.73m²",
    "refMin": 90
  },
  {
    "category": "肾功能",
    "nameZh": "β2微球蛋白",
    "abbr": "β2-MG",
    "unit": "mg/L",
    "refMin": 1,
    "refMax": 3
  },
  {
    "category": "肾功能",
    "nameZh": "胱抑素C",
    "abbr": "CysC",
    "unit": "mg/L",
    "refMin": 0.6,
    "refMax": 1.3,
    "aliases": [
      "胱抑素"
    ]
  },
  {
    "category": "肾功能",
    "nameZh": "C1q测定",
    "abbr": "C1q",
    "unit": "mg/L",
    "refMin": 159,
    "refMax": 233
  },
  {
    "category": "尿常规",
    "nameZh": "比重",
    "abbr": "SG",
    "refMin": 1.004,
    "refMax": 1.03,
    "aliases": [
      "尿比重"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "pH值",
    "abbr": "pH",
    "refMin": 4.5,
    "refMax": 8,
    "aliases": [
      "酸碱度"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "白细胞",
    "abbr": "LEU",
    "refValue": "negative",
    "aliases": [
      "尿白细胞"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "隐血",
    "abbr": "ERY",
    "refValue": "negative",
    "aliases": [
      "尿隐血",
      "尿潜血"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "亚硝酸盐",
    "abbr": "NIT",
    "refValue": "negative"
  },
  {
    "category": "尿常规",
    "nameZh": "酮体",
    "abbr": "KET",
    "refValue": "negative",
    "aliases": [
      "尿酮体"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "胆红素",
    "abbr": "BIL",
    "refValue": "negative",
    "aliases": [
      "尿胆红素"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "尿胆原",
    "abbr": "UBG",
    "refValue": "negative"
  },
  {
    "category": "尿常规",
    "nameZh": "蛋白质",
    "abbr": "PRO",
    "refValue": "negative",
    "aliases": [
      "尿蛋白"
    ]
  },
  {
    "category": "尿常规",
    "nameZh": "葡萄糖",
    "abbr": "GLU",
    "refValue": "negative",
    "aliases": [
      "尿糖",
      "尿葡萄糖"
    ]
  },
  {
    "category": "电解质",
    "nameZh": "钾",
    "abbr": "K",
    "unit": "mmol/L",
    "refMin": 3.5,
    "refMax": 5.5,
    "aliases": [
      "血钾"
    ]
  },
  {
    "category": "电解质",
    "nameZh": "钠",
    "abbr": "Na",
    "unit": "mmol/L",
    "refMin": 135,
    "refMax": 145,
    "aliases": [
      "血钠"
    ]
  },
  {
    "category": "电解质",
    "nameZh": "氯",
    "abbr": "Cl",
    "unit": "mmol/L",
    "refMin": 96,
    "refMax": 111,
    "aliases": [
      "血氯"
    ]
  },
  {
    "category": "电解质",
    "nameZh": "钙",
    "abbr": "Ca",
    "unit": "mmol/L",
    "refMin": 2.11,
    "refMax": 2.52,
    "aliases": [
      "血钙"
    ]
  },
  {
    "category": "电解质",
    "nameZh": "校正钙",
    "abbr": "cCa",
    "unit": "mmol/L",
    "refMin": 2.11,
    "refMax": 2.52
  },
  {
    "category": "电解质",
    "nameZh": "镁",
    "abbr": "Mg",
    "unit": "mmol/L",
    "refMin": 0.7,
    "refMax": 1.1,
    "aliases": [
      "血镁"
    ]
  },
  {
    "category": "电解质",
    "nameZh": "总二氧化碳",
    "abbr": "TCO2",
    "unit": "mmol/L",
    "refMin": 20,
    "refMax": 34,
    "aliases": [
      "二氧化碳结合力",
      "CO2CP"
    ]
  },
  {
    "category": "血糖",
    "nameZh": "空腹血糖",
    "abbr": "Glu-F",
    "unit": "mmol/L",
    "refMin": 3.9,
    "refMax": 6.1,
    "aliases": [
      "葡萄糖",
      "血糖"
    ]
  },
  {
    "category": "血糖",
    "nameZh": "餐后血糖",
    "abbr": "Glu-P",
    "unit": "mmol/L",
    "refMin": 3.9,
    "refMax": 7.8,
    "aliases": [
      "餐后2小时血糖",
      "GLU(p)"
    ]
  },
  {
    "category": "心肌标志物",
    "nameZh": "肌酸激酶",
    "abbr": "CK",
    "unit": "U/L",
    "refMin": 24,
    "refMax": 195,
    "aliases": [
      "肌酸激酶"
    ]
  },
  {
    "category": "心肌标志物",
    "nameZh": "肌酸激酶MB质量",
    "abbr": "CK-MB",
    "unit": "μg/L",
    "refMax": 5,
    "aliases": [
      "肌酸激酶MB",
      "CK-MB质量"
    ]
  },
  {
    "category": "心肌标志物",
    "nameZh": "高敏心肌肌钙蛋白I",
    "abbr": "hs-cTnI",
    "unit": "ng/L",
    "refMax": 54,
    "aliases": [
      "心肌肌钙蛋白I",
      "肌钙蛋白I",
      "cTnI"
    ]
  },
  {
    "category": "心肌标志物",
    "nameZh": "肌红蛋白",
    "abbr": "MYO",
    "unit": "μg/L",
    "refMax": 110
  }
];
