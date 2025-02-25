import { expect } from '@playwright/test';
import { test } from './pwInternals.ts';
// import type { Counter } from './Counter.tsx';
import { Counter } from './Counter.tsx';
// import * as path from 'path';

console.log(import.meta.dirname);

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
});

// test('render', async ({ page, mount }) => {
//   await mount<{ Counter: typeof Counter} >('/Users/agastineau/code/temp/pw-in-place-ct-experiment/src/components/Counter', ({ Counter }) => <Counter />);

//   await expect(page.locator('[data-testid="count"]')).toHaveText('0');
// });

test('initial value', async ({ page, mount }) => {
  await mount(() => {
    // console.log(path);
    // console.log(path.basename);
    return <Counter initial={314} />;
  });

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

// test('increment', async ({ page, mount }) => {
//   await mount('/src/components/Counter', ({ Counter }) => <Counter />);

//   await page.getByText('Increment').click();
//   await expect(page.locator('[data-testid="count"]')).toHaveText('1');
// });

// test('decrement', async ({ page, mount }) => {
//   await mount('/src/components/Counter', ({ Counter }) => <Counter />);

//   await page.getByText('Decrement').click();
//   await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
// });