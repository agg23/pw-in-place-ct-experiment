import { test, expect } from "pw-ct";
import { stripVTControlCharacters } from "util";

test('should record basic call on spy', async ({ page, mount, $browserSpy }) => {
  const aFunctionSpy = await $browserSpy(() => console.log("hello world. This is in browser"));

  await mount.react(() => {
    return <button onClick={aFunctionSpy}>Hi</button>;
  });

  await page.locator('button').click();

  expect(await aFunctionSpy.calls()).toEqual([[ expect.objectContaining({}) ]]);

  await expect(aFunctionSpy).toHaveBeenCalled();
});

test('should properly error when spy not called with toHaveBeenCalled', async ({ page, mount, $browserSpy }) => {
  const aFunctionSpy = await $browserSpy(() => console.log("hello world. This is in browser"));

  await mount.react(() => {
    return <button onClick={aFunctionSpy}>Hi</button>;
  });

  try {
    await expect(aFunctionSpy).toHaveBeenCalled();
  } catch (e) {
    expect(stripVTControlCharacters(e.matcherResult.message)).toContain("Expected number of calls: >= 1")
  }
});