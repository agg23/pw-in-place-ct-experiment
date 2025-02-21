import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';

const buildUserContentScript = async <T>(importPath: string, componentBuilder: (module: T) => object) => {
  // This could also be configured per platform, removing the need for `__PW_CT_MOUNT__` to be global
  const userContentScript = `
  import { jsx as _jsx } from 'react/jsx-runtime';
  import * as userModule from '${importPath}';
  export default () => {
    const component = (${componentBuilder.toString()})(userModule);
    window.__PW_CT_MOUNT__(component);
  }
  `;
  fs.writeFileSync('.tmp.tsx', userContentScript);
  // TODO: Figure out how to prevent Vite file watcher from triggering late and reloading the page while we're testing
  await new Promise(resolve => setTimeout(resolve, 500));
}

const evaluateTransformedScript = (page: Page) => page.evaluate(async () => {
  const userContentScript = await import('/.tmp.tsx');
  await userContentScript.default();
});

export const test = base.extend<{ mount: <T>(importPath: string, componentBuilder: (module: T) => object) => Promise<void> }>({
  mount: async ({ page }, use) => use(async (importPath, componentBuilder) => {
    await buildUserContentScript(importPath, componentBuilder);
    await evaluateTransformedScript(page);
  }),
});
