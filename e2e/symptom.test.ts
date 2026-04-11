import automator from "miniprogram-automator";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setMiniProgram, getConsoleErrors, clearConsoleErrors, addConsoleError } from "./setup";

describe("Symptom Records E2E", () => {
  let miniProgram: Awaited<ReturnType<typeof automator.launch>>;
  let page: Awaited<ReturnType<typeof miniProgram.reLaunch>>;

  beforeAll(async () => {
    miniProgram = await automator.launch({
      projectPath: path.resolve(__dirname, "../dist"),
    });
    setMiniProgram(miniProgram);

    // Listen for console errors
    miniProgram.on("console", (msg: { type: string; args: unknown[] }) => {
      if (msg.type === "error" || msg.type === "warn") {
        const errorText = msg.args.map((arg) => String(arg)).join(" ");
        addConsoleError(`[${msg.type}] ${errorText}`);
      }
    });
  });

  afterAll(async () => {
    if (miniProgram) {
      await miniProgram.close();
      setMiniProgram(null);
    }
  });

  afterEach(() => {
    // Fail test if there are console errors
    const errors = getConsoleErrors();
    clearConsoleErrors();
    if (errors.length > 0) {
      throw new Error(`Console errors during test:\n${errors.join("\n")}`);
    }
  });

  describe("Home Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/index/index");
      await page.waitFor(500);
    });

    it("should load home page correctly", async () => {
      expect(page.path).toBe("pages/index/index");
    });

    it("should display app title", async () => {
      const title = await page.$(".title");
      expect(title).not.toBeNull();
      const text = await title!.text();
      expect(text).toBe("MyGut");
    });

    it("should display menu items", async () => {
      const menuItems = await page.$$(".menu-item");
      expect(menuItems.length).toBeGreaterThanOrEqual(5);
    });

    it("should have health status menu item enabled", async () => {
      const menuItem = await page.$(".menu-item:not(.disabled)");
      expect(menuItem).not.toBeNull();
      const menuTitle = await menuItem!.$(".menu-title");
      const text = await menuTitle!.text();
      expect(text).toBe("身体状态");
    });
  });

  describe("Navigation to Symptom Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/index/index");
      await page.waitFor(500);
    });

    it("should navigate to symptom page when tapping menu item", async () => {
      const menuItem = await page.$(".menu-item:not(.disabled)");
      expect(menuItem).not.toBeNull();

      await menuItem!.tap();
      await page.waitFor(1000);

      page = await miniProgram.currentPage();
      expect(page.path).toBe("pages/symptom/index/index");
    });

    it("should display symptom page title", async () => {
      const title = await page.$(".title");
      expect(title).not.toBeNull();
      const text = await title!.text();
      expect(text).toBe("身体状态记录");
    });

    it("should display add button", async () => {
      const addBtn = await page.$(".add-btn");
      expect(addBtn).not.toBeNull();
    });
  });

  describe("Add Symptom Record", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/symptom/add/index");
      await page.waitFor(500);
    });

    it("should load add page correctly", async () => {
      expect(page.path).toBe("pages/symptom/add/index");
    });

    it("should display time section", async () => {
      const sectionTitle = await page.$(".section-title");
      expect(sectionTitle).not.toBeNull();
      const text = await sectionTitle!.text();
      expect(text).toBe("时间");
    });

    it("should display feeling options", async () => {
      const feelingItems = await page.$$(".feeling-item");
      expect(feelingItems.length).toBe(5);
    });

    it("should allow selecting overall feeling", async () => {
      const feelingItems = await page.$$(".feeling-item");
      // Tap the "good" feeling (index 3, value 4)
      await feelingItems[3].tap();
      await page.waitFor(300);

      // Verify the item is now active
      const activeItem = await page.$(".feeling-item.active");
      expect(activeItem).not.toBeNull();
    });

    it("should display symptom section with add button", async () => {
      const addSymptomBtn = await page.$(".add-symptom-btn");
      expect(addSymptomBtn).not.toBeNull();
      const text = await addSymptomBtn!.text();
      expect(text).toBe("+ 添加症状");
    });

    it("should display submit button", async () => {
      const submitBtn = await page.$(".submit-btn");
      expect(submitBtn).not.toBeNull();
      const text = await submitBtn!.text();
      expect(text).toBe("保存记录");
    });
  });

  describe("Symptom Records List", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/symptom/index/index");
      await page.waitFor(1000);
    });

    it("should navigate to add page when tapping add button", async () => {
      const addBtn = await page.$(".add-btn");
      expect(addBtn).not.toBeNull();

      await addBtn!.tap();
      await page.waitFor(1000);

      page = await miniProgram.currentPage();
      expect(page.path).toBe("pages/symptom/add/index");
    });

    it("should display empty state or records list", async () => {
      page = await miniProgram.reLaunch("/pages/symptom/index/index");
      await page.waitFor(1000);

      // Either empty state or record list should be visible
      const emptyState = await page.$(".empty");
      const recordList = await page.$(".record-list");

      expect(emptyState !== null || recordList !== null).toBe(true);
    });
  });
});
