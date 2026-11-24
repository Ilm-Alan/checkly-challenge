import { CheckGroupV2 } from 'checkly/constructs';

// Group 1: every Playwright test in src/playwright/.
// Drop a new *.spec.ts file in that folder and the next `npx checkly deploy`
// adds it to this group as a Browser check.
export const playwrightGroup = new CheckGroupV2('playwright-checks', {
  name: 'Playwright checks',
  browserChecks: {
    testMatch: 'playwright/**/*.spec.ts',
  },
});
