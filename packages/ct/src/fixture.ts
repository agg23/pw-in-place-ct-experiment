import { test as base } from '@playwright/test';
import * as path from 'path';
import { buildUserContentScript, evaluateTransformedScript } from './script';
import { Dependency } from './types';

const TEMP_TRANSPILED_FILE = '.tmp.tsx';

export const test = base.extend<{ mount: (componentBuilder: () => object) => Promise<void>, ctRootDir: string | undefined }>({
  ctRootDir: [undefined, { option: true }],
  mount: async ({ page, ctRootDir }, use) => {
    if (!ctRootDir) {
      throw new Error('ctRootDir is not defined');
    }

    const mountFixture = async () => {
      throw new Error('Attempted to call `mount` directly. This should be transformed by the Babel plugin');
    };

    const rootProjectDir = ctRootDir;

    mountFixture._mountInternal = async (componentBuilder: () => object, imports: Record<string, Dependency>, workingDir: string) => {
      const scriptWorkingRelativeDir = path.relative(rootProjectDir, workingDir);
      const tempFilePath = path.resolve(workingDir, TEMP_TRANSPILED_FILE);
      await buildUserContentScript(componentBuilder, imports, scriptWorkingRelativeDir, tempFilePath);

      let tempEvalPath = path.join(scriptWorkingRelativeDir, TEMP_TRANSPILED_FILE);
      console.log('scriptWorkingRelativeDir', scriptWorkingRelativeDir);
      console.log('tempFilePath', tempFilePath);
      console.log('tempEvalPath', tempEvalPath);
      if (!tempEvalPath.startsWith(path.sep)) {
        tempEvalPath = `${path.sep}${tempEvalPath}`;
      }

      await evaluateTransformedScript(page, tempEvalPath);
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return use(mountFixture);
  }
});
