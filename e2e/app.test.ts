import automator from "miniprogram-automator";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setMiniProgram, getConsoleErrors, clearConsoleErrors, addConsoleError } from "./setup";

describe("App E2E", () => {
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

  describe("Home Page", () => {
    beforeAll(async () => {
      page = await miniProgram.reLaunch("/pages/index/index");
      await page.waitFor(500);
    });

    it("should display app title and 6 quick action buttons", async () => {
      const title = await page.$(".app-title");
      expect(await title!.text()).toBe("MyGut");

      const actionItems = await page.$$(".action-item");
      expect(actionItems.length).toBe(6);
    });

    it("should navigate to symptom add page from quick action", async () => {
      const actionItems = await page.$$(".action-item");
      await actionItems[0].tap();
      await page.waitFor(500);

      page = await miniProgram.currentPage();
      expect(page.path).toBe("pages/symptom/add/index");

    });
  });

});
