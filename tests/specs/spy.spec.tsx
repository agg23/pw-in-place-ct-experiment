import { test, expect } from "pw-ct";
import * as React from "react";
import { stripVTControlCharacters } from "util";

test('should record basic call on spy', async ({ page, mount, $browserSpy }) => {
  const aFunctionSpy = await $browserSpy(() => console.log("hello world. This is in browser"));

  await mount.react(() => {
    return <button onClick={aFunctionSpy}>Hi</button>;
  });

  await page.locator('button').click();

  expect(await aFunctionSpy.calls()).toEqual([[ expect.objectContaining({}) ]]);

  await expect(aFunctionSpy).toHaveBeenCalled();
  await expect(aFunctionSpy).toHaveBeenCalledTimes(1);
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

test(`should record each call's arguments`, async ({ page, mount, $browserSpy }) => {
  const aFunctionSpy = await $browserSpy((a: string, b: number) => console.log(a, b));

  await mount.react(() => {
    const [count, setCount] = React.useState(0);

    return <button onClick={() => {
      aFunctionSpy("hello", count);
      setCount(count + 1);
    }}>Hi</button>;
  });

  await page.locator('button').click();
  await page.locator('button').click();
  await page.locator('button').click();

  expect(await aFunctionSpy.calls()).toEqual([[ "hello", 0 ], [ "hello", 1 ], [ "hello", 2 ]]);
  await expect(aFunctionSpy).toHaveBeenCalledWith("hello", 0);
  await expect(aFunctionSpy).toHaveBeenCalledWith("hello", 1);
  await expect(aFunctionSpy).toHaveBeenCalledWith("hello", 2);
});