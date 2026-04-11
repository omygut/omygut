import automator from "miniprogram-automator";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setMiniProgram, getConsoleErrors, clearConsoleErrors, addConsoleError } from "./setup";

describe("Stool Records E2E", () => {
  let miniProgram: Awaited<ReturnType<typeof automator.launch>>;
  let page: Awaited<ReturnType<typeof miniProgram.reLaunch>>;

  beforeAll(async () => {
    miniProgram = await automator.launch({
      projectPath: path.resolve(__dirname, "../dist"),
    });
    setMiniProgram(miniProgram);

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
    const errors = getConsoleErrors();
    clearConsoleErrors();
    if (errors.length > 0) {
      throw new Error(`Console errors during test:\n${errors.join("\n")}`);
    }
  });

  describe("Home Page - Stool Menu", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/index/index");
      await page.waitFor(500);
    });

    it("should have stool record menu item enabled", async () => {
      const menuItems = await page.$$(".menu-item:not(.disabled)");
      const titles = await Promise.all(
        menuItems.map(async (item) => {
          const titleEl = await item.$(".menu-title");
          return titleEl ? titleEl.text() : "";
        })
      );
      expect(titles).toContain("排便记录");
    });
  });

  describe("Navigation to Stool Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/index/index");
      await page.waitFor(500);
    });

    it("should navigate to stool page when tapping menu item", async () => {
      const menuItems = await page.$$(".menu-item:not(.disabled)");
      let stoolMenuItem = null;
      for (const item of menuItems) {
        const titleEl = await item.$(".menu-title");
        const text = await titleEl?.text();
        if (text === "排便记录") {
          stoolMenuItem = item;
          break;
        }
      }
      expect(stoolMenuItem).not.toBeNull();

      await stoolMenuItem!.tap();
      await page.waitFor(1000);

      page = await miniProgram.currentPage();
      expect(page.path).toBe("pages/stool/index/index");
    });

    it("should display stool page title", async () => {
      const title = await page.$(".title");
      expect(title).not.toBeNull();
      const text = await title!.text();
      expect(text).toBe("排便记录");
    });

    it("should display add button", async () => {
      const addBtn = await page.$(".add-btn");
      expect(addBtn).not.toBeNull();
    });
  });

  describe("Add Stool Record Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/stool/add/index");
      await page.waitFor(500);
    });

    it("should load add page correctly", async () => {
      expect(page.path).toBe("pages/stool/add/index");
    });

    it("should display time section", async () => {
      const sectionTitle = await page.$(".section-title");
      expect(sectionTitle).not.toBeNull();
      const text = await sectionTitle!.text();
      expect(text).toBe("时间");
    });

    it("should display Bristol type options", async () => {
      const bristolItems = await page.$$(".bristol-item");
      expect(bristolItems.length).toBe(7);
    });

    it("should allow selecting Bristol type", async () => {
      const bristolItems = await page.$$(".bristol-item");
      await bristolItems[3].tap(); // Type 4 - ideal
      await page.waitFor(300);

      const activeItem = await page.$(".bristol-item.active");
      expect(activeItem).not.toBeNull();
    });

    it("should display color options", async () => {
      const colorItems = await page.$$(".color-item");
      expect(colorItems.length).toBe(5);
    });

    it("should display checkbox options", async () => {
      const checkboxItems = await page.$$(".checkbox-item");
      expect(checkboxItems.length).toBe(2);
    });

    it("should display submit button", async () => {
      const submitBtn = await page.$(".submit-btn");
      expect(submitBtn).not.toBeNull();
      const text = await submitBtn!.text();
      expect(text).toBe("保存记录");
    });
  });
});
