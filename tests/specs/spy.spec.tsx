import { test } from "pw-ct";
import { expect } from '@playwright/test';

test('should record basic call on spy', async ({ page, mount, $browserSpy }) => {
  const aFunctionSpy = await $browserSpy(() => console.log("hello world. This is in browser"));

  await mount.react(() => {
    return <button onClick={aFunctionSpy}>Hi</button>;
  });

  await page.locator('button').click();

  expect(await aFunctionSpy.calls()).toEqual([[ expect.objectContaining({}) ]]);

  // await page.waitForTimeout(5000);

  // expect(await aFunctionSpy.get()).toHaveBeenCalled();
});