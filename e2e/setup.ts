import automator from "miniprogram-automator";
import { afterAll } from "vitest";

// Global teardown - close miniprogram if tests fail unexpectedly
let miniProgram: Awaited<ReturnType<typeof automator.launch>> | null = null;

// Collect console errors during tests
const consoleErrors: string[] = [];

export function setMiniProgram(mp: typeof miniProgram) {
  miniProgram = mp;
}

export function getConsoleErrors(): string[] {
  return [...consoleErrors];
}

export function clearConsoleErrors(): void {
  consoleErrors.length = 0;
}

export function addConsoleError(error: string): void {
  consoleErrors.push(error);
}

afterAll(async () => {
  if (miniProgram) {
    try {
      await miniProgram.close();
    } catch {
      // Ignore close errors
    }
  }
});
