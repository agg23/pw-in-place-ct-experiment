import { test, expect } from "pw-ct";
import * as React from "react";
import { stripVTControlCharacters } from "util";
import importCheck from "./importCheck.ts";

test('should record basic call on spy', async ({ page, mount, $browserSpy, $browser }) => {
  const didImport = await $browser(false);
  
  const aFunctionSpy = await $browserSpy(() => {
    didImport = !!importCheck;
    console.log(importCheck ? "Wrapped imports" : "Not wrapped imports");
    console.log("hello world. This is in browser");
  });

  await mount.react(() => {
    return <button onClick={aFunctionSpy}>Hi</button>;
  });

  await page.locator('button').click();

  expect(await aFunctionSpy.calls()).toEqual([[ expect.objectContaining({}) ]]);

  await expect(aFunctionSpy).toHaveBeenCalled();
  await expect(aFunctionSpy).toHaveBeenCalledTimes(1);

  // TODO: Check for spy dependencies
  expect(await didImport.get()).toBe(true);
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

test('should allow bidirectional communication', async ({ page, mount, $browserSpy, $browser }) => {
  let exposedCalled = false;
  await page.exposeBinding('getUUID', (_, name: string) => {
    console.log(name);
    exposedCalled = true;
    return crypto.randomUUID() + name;
  });

  const receivedBrowserUUID = await $browser<string | undefined>(undefined);

  await mount.react(() => {
    const getUUID = async () => {
      const startUUID = receivedBrowserUUID;
      const uuid = await window['getUUID']("hello") + startUUID;
      console.log(uuid);
      receivedBrowserUUID = uuid;
    };

    return <button onClick={getUUID}>Get UUID</button>;
  });

  await page.locator('button').click();

  expect(exposedCalled).toBeTruthy();
  expect(await receivedBrowserUUID.get()).toContain("hello");

  await receivedBrowserUUID.set("new value");

  await page.locator('button').click();

  expect(await receivedBrowserUUID.get()).toContain("hello");
  expect(await receivedBrowserUUID.get()).toContain("new value");

  // TODO: Add sending an event to the page
});
