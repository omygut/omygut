import { describe, it, expect } from "vitest";
import { validateNickname, validateFood } from "./validation";

describe("validateNickname", () => {
  it("returns null for valid nickname", () => {
    expect(validateNickname("用户123")).toBeNull();
    expect(validateNickname("test_user")).toBeNull();
    expect(validateNickname("张三")).toBeNull();
  });

  it("returns error for empty nickname", () => {
    expect(validateNickname("")).toBe("昵称不能为空");
    expect(validateNickname("   ")).toBe("昵称不能为空");
  });

  it("returns error for nickname exceeding 20 characters", () => {
    expect(validateNickname("a".repeat(21))).toBe("昵称长度不能超过20字符");
  });

  it("returns error for invalid characters", () => {
    expect(validateNickname("user@name")).toBe("昵称只能包含中英文、数字、下划线");
    expect(validateNickname("user name")).toBe("昵称只能包含中英文、数字、下划线");
    expect(validateNickname("用户😀")).toBe("昵称只能包含中英文、数字、下划线");
  });
});

describe("validateFood", () => {
  it("returns null for valid food name", () => {
    expect(validateFood("红烧肉")).toBeNull();
    expect(validateFood("Pasta")).toBeNull();
    expect(validateFood("牛奶(低脂)")).toBeNull();
    expect(validateFood("全麦面包-无糖")).toBeNull();
  });

  it("returns error for empty food name", () => {
    expect(validateFood("")).toBe("食物名称不能为空");
    expect(validateFood("   ")).toBe("食物名称不能为空");
  });

  it("returns error for food name exceeding 30 characters", () => {
    expect(validateFood("a".repeat(31))).toBe("食物名称不能超过30字符");
  });

  it("returns error for invalid characters", () => {
    expect(validateFood("食物@名")).toBe("食物名称包含无效字符");
    expect(validateFood("food#1")).toBe("食物名称包含无效字符");
  });
});
