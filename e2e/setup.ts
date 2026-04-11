import automator from 'miniprogram-automator';

// Extend Jest timeout for E2E tests
jest.setTimeout(60000);

// Global teardown - close miniprogram if tests fail unexpectedly
let miniProgram: Awaited<ReturnType<typeof automator.launch>> | null = null;

export function setMiniProgram(mp: typeof miniProgram) {
  miniProgram = mp;
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
