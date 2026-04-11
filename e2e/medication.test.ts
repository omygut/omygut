import automator from "miniprogram-automator";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setMiniProgram, getConsoleErrors, clearConsoleErrors, addConsoleError } from "./setup";

describe("Medication Records E2E", () => {
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

  describe("Medication List Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/medication/index/index");
      await page.waitFor(500);
      // Clear any errors from initial load (collection may not exist yet)
      clearConsoleErrors();
    });

    it("should load medication list page correctly", async () => {
      expect(page.path).toBe("pages/medication/index/index");
    });

    it("should display page title", async () => {
      const title = await page.$(".title");
      expect(title).not.toBeNull();
      const text = await title!.text();
      expect(text).toBe("用药记录");
    });

    it("should display add button", async () => {
      const addBtn = await page.$(".add-btn");
      expect(addBtn).not.toBeNull();
    });

    it("should display empty state or records list", async () => {
      const emptyState = await page.$(".empty");
      const recordList = await page.$(".record-list");
      expect(emptyState !== null || recordList !== null).toBe(true);
    });

    it("should navigate to add page when tapping add button", async () => {
      const addBtn = await page.$(".add-btn");
      expect(addBtn).not.toBeNull();

      await addBtn!.tap();
      await page.waitFor(1000);

      page = await miniProgram.currentPage();
      expect(page.path).toBe("pages/medication/add/index");
    });
  });

  describe("Medication Add Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/medication/add/index");
      await page.waitFor(500);
    });

    it("should load add page correctly", async () => {
      expect(page.path).toBe("pages/medication/add/index");
    });

    it("should display time section", async () => {
      const sectionTitles = await page.$$(".section-title");
      expect(sectionTitles.length).toBeGreaterThan(0);
      const text = await sectionTitles[0].text();
      expect(text).toBe("时间");
    });

    it("should display medication category tabs", async () => {
      const categoryTabs = await page.$$(".category-tab");
      expect(categoryTabs.length).toBe(5); // 氨基水杨酸类、胃药、止泻药、益生菌、生物制剂
    });

    it("should display medication items in grid", async () => {
      const medicationItems = await page.$$(".medication-item");
      expect(medicationItems.length).toBeGreaterThan(0);
    });

    it("should allow selecting medication items", async () => {
      const medicationItems = await page.$$(".medication-item");
      await medicationItems[0].tap();
      await page.waitFor(300);

      const selectedMedication = await page.$(".selected-medication");
      expect(selectedMedication).not.toBeNull();
    });

    it("should display dosage input", async () => {
      const dosageInput = await page.$(".dosage-input");
      expect(dosageInput).not.toBeNull();
    });

    it("should display submit button", async () => {
      const submitBtn = await page.$(".submit-btn");
      expect(submitBtn).not.toBeNull();
      const text = await submitBtn!.text();
      expect(text).toBe("保存记录");
    });
  });
});
