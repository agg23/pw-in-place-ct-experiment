import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import App from './App';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test('render', async ({ page, mount }) => {
  await mount(() => <App />);

  await expect(page.locator('body')).toContainText('Learn React');
});
// test('foo', async ({ page }) => {
//   await expect(page.locator('body')).toHaveText('Learn React');
// });