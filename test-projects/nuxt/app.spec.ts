import { expect } from "@playwright/test";
import { test } from "pw-ct";
import App from "./App.vue";

test('render', async ({ page, mount }) => {
  await mount(() => App);

  await expect(page.locator('body')).toContainText('Welcome to Nuxt!');
});