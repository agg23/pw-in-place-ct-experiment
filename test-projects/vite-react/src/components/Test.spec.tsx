import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter } from './Counter.tsx';

test('render', async ({ page, mount, $browser }) => {
  page.on('console', async (msg) => {
    const msgArgs = msg.args();
    const logValues = await Promise.all(msgArgs.map(async arg => await arg.jsonValue()));
    console.log(...logValues);
  });

  const aVariable = await $browser(123);

  // console.log(aVariable);
  // console.log(await aVariable.handle.jsonValue());

  await mount.react(() => {
    aVariable += 1;
    console.log(aVariable);

    return <Counter />;
  });

  console.log(await (await aVariable.get()).jsonValue());

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});