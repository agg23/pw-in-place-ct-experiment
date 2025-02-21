import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import { Counter } from './Counter.tsx';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
});

// const jsx = (type, props, ...children) => {
//   console.log('importing react');
//   const reactModule = import('react/jsx-runtime');
//   console.log(reactModule);
//   debugger;
//   return jsx(type, props, ...children);
// };

const specialFunction = async () => {
  debugger;
  const counterImport = import('/src/components/Counter');
  console.log('counterImport', counterImport);
  counterImport.then(console.log).catch(console.error);
  try {
    const { Counter } = await counterImport;
    console.log('imported counter', Counter);
    debugger;
    window.__PW_CT_MOUNT__(<Counter />)  
  } catch (e) {
    console.error(e);
    debugger;
  }
};

test('render', async ({ page }) => {
  const reactJSXHeader = `
    import { jsx as _jsx } from 'react/jsx-runtime';
  `;
  const transformedFunction = `${reactJSXHeader}\nexport default ${specialFunction.toString()}`;
  fs.writeFileSync('.tmp.tsx', transformedFunction);
  // TODO: Figure out how to prevent Vite file watcher from triggering late and reloading the page while we're testing
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.evaluate(async () => {
    const componentMount = await import('/.tmp.tsx');
    await componentMount.default();
  });

  await expect(page.locator('[data-testid="count"]')).toHaveText('0', { timeout: 100000 });
});

test('initial value', async ({ page }) => {
  /** @jsxImportSource react */
  const test = <Counter />;
  console.log(test);
  await page.evaluate(async () => {
    const { Counter } = await import('./src/components/Counter.tsx');
    window.__PW_CT_MOUNT__(<Counter />)
  });

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page }) => {
  await page.evaluate(async () => {
    const { Counter } = await import('./src/components/Counter.tsx');
    window.__PW_CT_MOUNT__(<Counter />)
  });

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('decrement', async ({ page }) => {
  await page.evaluate(async () => {
    const { Counter } = await import('./src/components/Counter.tsx');
    window.__PW_CT_MOUNT__(<Counter />)
  });

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});