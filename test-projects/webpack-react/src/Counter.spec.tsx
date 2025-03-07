import * as React from 'react';
import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter, AdditionalCounter } from './Counter.jsx';
const { App } = require('./App.jsx');

test('render', async ({ page, mount }) => {
  await mount.react(() => <Counter />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});

test('initial value', async ({ page, mount }) => {
  await mount.react(() => <Counter initial={314} />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page, mount }) => {
  await mount.react(() => <Counter />);

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('decrement', async ({ page, mount }) => {
  await mount.react(() => <Counter />);

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});

test('require', async ({ page, mount }) => {
  await mount.react(() => <App />);

  await expect(page.locator('body')).toHaveText('Hi');
});

test('multiple import from same file', async ({ page, mount }) => {
  await mount.react(() => <AdditionalCounter />);

  await expect(page.locator('body')).toHaveText('AdditionalCounter');
});
