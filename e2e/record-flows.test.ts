import automator from "miniprogram-automator";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setMiniProgram, getConsoleErrors, clearConsoleErrors, addConsoleError } from "./setup";

describe("Record Creation Flows E2E", () => {
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

  /**
   * Verify record was created by checking the home page shows count > 0 for the card
   */
  async function verifyRecordOnHomePage(cardTitle: string) {
    await miniProgram.reLaunch("/pages/index/index");
    await page.waitFor(1500);
    page = await miniProgram.currentPage();

    // Find all card titles and locate the matching one
    const cardTitles = await page.$$(".card-title");
    let cardIndex = -1;
    for (let i = 0; i < cardTitles.length; i++) {
      if ((await cardTitles[i].text()) === cardTitle) {
        cardIndex = i;
        break;
      }
    }
    expect(cardIndex).toBeGreaterThanOrEqual(0);

    // Check that card count shows records exist
    const cardCounts = await page.$$(".card-count");
    const countText = await cardCounts[cardIndex].text();
    const count = parseInt(countText.match(/\d+/)?.[0] || "0");
    expect(count).toBeGreaterThan(0);
  }

  it("should create symptom record", async () => {
    page = await miniProgram.reLaunch("/pages/symptom/add/index");
    await page.waitFor(500);

    // Select a feeling (overall feeling is required)
    const feelingItems = await page.$$(".feeling-item");
    await feelingItems[0].tap();
    await page.waitFor(300);

    // Submit
    const submitBtn = await page.$(".submit-btn");
    await submitBtn!.tap();
    await page.waitFor(2000);

    await verifyRecordOnHomePage("体感");
  });

  it("should create meal record", async () => {
    page = await miniProgram.reLaunch("/pages/meal/add/index");
    await page.waitFor(500);

    // Switch to a category with preset foods
    const categoryTabs = await page.$$(".category-tab");
    await categoryTabs[1].tap();
    await page.waitFor(300);

    // Select a food item
    const foodItems = await page.$$(".food-item");
    await foodItems[0].tap();
    await page.waitFor(300);

    // Submit
    const submitBtn = await page.$(".submit-btn");
    await submitBtn!.tap();
    await page.waitFor(2000);

    await verifyRecordOnHomePage("饮食");
  });

  it("should create stool record", async () => {
    page = await miniProgram.reLaunch("/pages/stool/add/index");
    await page.waitFor(500);

    // Select a Bristol type
    const bristolItems = await page.$$(".bristol-item");
    await bristolItems[3].tap(); // Type 4 (normal)
    await page.waitFor(300);

    // Submit
    const submitBtn = await page.$(".submit-btn");
    await submitBtn!.tap();
    await page.waitFor(2000);

    await verifyRecordOnHomePage("排便");
  });

  it("should create medication record", async () => {
    page = await miniProgram.reLaunch("/pages/medication/add/index");
    await page.waitFor(500);

    // Switch to a category with preset medications
    const categoryTabs = await page.$$(".category-tab");
    await categoryTabs[1].tap();
    await page.waitFor(300);

    // Select a medication item
    const medicationItems = await page.$$(".medication-item");
    await medicationItems[0].tap();
    await page.waitFor(300);

    // Submit
    const submitBtn = await page.$(".submit-btn");
    await submitBtn!.tap();
    await page.waitFor(2000);

    await verifyRecordOnHomePage("用药");
  });
});
