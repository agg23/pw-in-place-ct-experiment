import { test as base, Page } from '@playwright/test';
import * as path from 'path';
import { buildUserContentScript } from './script';
import { BrowserVariable, CTFramework, Dependency, Fixture, MountFixture } from './types';
import { VIRTUAL_ENTRYPOINT_NAME } from './virtual';

declare global {
  interface Window {
    __PW_BROWSER_VARIABLE_REGISTRY?: Map<string, object>;
  }
}

interface InternalFixture {
  _browserVariableRegistry: Map<string, RegisteredVariable<unknown>>;
  _didMount: { value: boolean };
}

interface RegisteredVariable<T> {
  variable: BrowserVariable<T>;
  name: string;
  value: T;
}

// TODO: Remove from public scope
export const test = base.extend<Fixture & InternalFixture>({
  // These values are validated in `defineConfig`
  ctRootDir: ['./', { option: true }],
  ctPort: [3100, { option: true }],
  _didMount: { value: false },
  _browserVariableRegistry: async ({}, use) => use(new Map()),
  mount: async ({ page, ctRootDir: rootProjectDir, ctPort, _didMount, _browserVariableRegistry }, use) => {
    const sharedReject = async () => {
      throw new Error('Attempted to call `mount` directly. This should be transformed by the Babel plugin');
    };

    const mountFixture: MountFixture = {
      react: sharedReject,
      vue: sharedReject,
      svelte: sharedReject,
    };

    if (rootProjectDir.startsWith("file://")) {
      // ESM adds file:// and it messes up path methods
      rootProjectDir = rootProjectDir.slice("file://".length);
    }

    (mountFixture as any)._mountInternal = async <T extends CTFramework>(componentBuilder: MountFixture[T], imports: Record<string, Dependency>, workingDir: string, framework: CTFramework) => {
      const scriptWorkingRelativeDir = path.relative(rootProjectDir, workingDir);

      let variablesInContext: Array<{id: string, name: string}> = [..._browserVariableRegistry.entries()].map(([id, { name }]) => ({ id, name }));

      const script = await buildUserContentScript(componentBuilder, imports, variablesInContext, scriptWorkingRelativeDir, framework);
      try {
        await fetch(`http://localhost:${ctPort}/${VIRTUAL_ENTRYPOINT_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: script,
          }),
        });
      } catch (e) {
        console.error('Failed to update virtual module', e);
      }

      await page.goto(`http://localhost:${ctPort}`);

      // Now that we've loaded the page, register the variables
      for (const [id, { value, name, variable }] of _browserVariableRegistry.entries()) {
        // TODO: All variables are re-registered on every mount
        if (!variable.handle) {
          // Variable hasn't been registered in browser context
          const handle = await insertBrowserVariable(page, id, name, value);
          variable.registerHandle(handle);  
        }
      }

      // Execute component builder
      // @ts-expect-error
      await page.evaluate(() => window.__PW_ENTRYPOINT());

      _didMount.value = true;
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return use(mountFixture);
  },
  $browser: async ({ page, _didMount, _browserVariableRegistry }, use) => {
    const $browser = async () => {
      throw new Error('Attempted to call `$browser` directly. This should be transformed by the Babel plugin');
    };

    $browser._internal = async <T>(value: T, id: string, name: string): Promise<BrowserVariable<T>> => {
      const variable = new BrowserVariable<T>(id);

      _browserVariableRegistry.set(id, { variable, name, value });

      console.log("Registering variable", name);

      if (!_didMount.value) {
        // This variable is pending (no handle)
        return variable;
      }

      const handle = await insertBrowserVariable(page, id, name, value);
      variable.registerHandle(handle);
      
      return variable;  
    };
    await use($browser);
  }
});

const insertBrowserVariable = async <T>(page: Page, id: string, name: string, value: T) => page.evaluateHandle<{ value: T }, { value: T, id: string, name: string }>(({ id, name, value }) => {
  if (!window.__PW_BROWSER_VARIABLE_REGISTRY) {
    window.__PW_BROWSER_VARIABLE_REGISTRY = new Map<string, object>();
  }

  const variableObject = { name, value };

  window.__PW_BROWSER_VARIABLE_REGISTRY.set(id, variableObject);

  return variableObject as { value: T };
}, { id, name, value });
