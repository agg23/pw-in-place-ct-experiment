import { expect } from '@playwright/test';
import { test as base } from 'pw-ct';

const test = base.extend<{ consoleWatcher: void }>({
  consoleWatcher: [
    async ({ page }, use) => {
      if (process.env['PW_LOG']) {
        page.on('console', async (msg) => {
          const msgArgs = msg.args();
          const logValues = await Promise.all(msgArgs.map(async arg => await arg.jsonValue()));
          console.log(...logValues);
        });
      }

      use();
    },
    { auto: true }
  ]
});

test('should mutate primitives in browser', async ({ page, mount, $browser }) => {
  const aVariable = await $browser(123);

  await mount.react(() => {
    aVariable += 123;
    return null;
  });

  expect(await aVariable.get()).toBe(246);
});

test('should mutate primitives in node', async ({ page, mount, $browser }) => {
  const aVariable = await $browser(123);

  await mount.react(() => {
    aVariable += 123;
    return null;
  });

  await aVariable.set(444);

  expect(await aVariable.get()).toBe(444);
});
