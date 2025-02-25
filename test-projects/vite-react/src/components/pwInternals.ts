import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface Dependency {
  url: string;
  type: 'named' | 'default' | 'namespace';
}

interface DedupedImport {
  // TODO: Support renaming
  named: string[];
  default?: string;
  namespace?: string;
}

const buildUserContentScript = async (componentBuilder: () => object, imports: Record<string, Dependency>, workingDir: string, tempFilePath: string) => {
  const dedupedImports = new Map<string, DedupedImport>();

  for (const [variableName, dependency] of Object.entries(imports)) {
    let sharedImport = dedupedImports.get(dependency.url);

    if (!sharedImport) {
      sharedImport = { named: [] };
      dedupedImports.set(dependency.url, sharedImport);
    }

    if (dependency.type === 'named') {
      sharedImport.named.push(variableName);
    } else if (dependency.type === 'default') {
      if (sharedImport.default) {
        throw new Error(`Multiple default imports for ${dependency.url}`);
      }
      sharedImport.default = variableName;
    } else if (dependency.type === 'namespace') {
      sharedImport.namespace = variableName;
    }
  }

  const importExpressions = [...dedupedImports.entries()].flatMap(([url, importData]) => {
    let importPath = url;
    if (importPath.startsWith('.')) {
      importPath = path.resolve(workingDir, importPath);
    }

    const importExpressions = [];
    if (importData.namespace) {
      importExpressions.push(`import * as ${importData.namespace} from '${importPath}';`);
    }

    let sharedImportExpression = '';

    if (importData.named.length > 0) {
      const namedImports = importData.named.join(', ');
      sharedImportExpression = `{${namedImports}}`;
    }
    
    if (importData.default) {
      if (sharedImportExpression) {
        sharedImportExpression += `, ${importData.default}`;
      } else {
        sharedImportExpression = importData.default;
      }
    }

    if (sharedImportExpression) {
      importExpressions.push(`import ${sharedImportExpression} from '${importPath}';`);
    }

    return importExpressions;
  }).join('\n');
  
  const importArguments = Object.keys(imports).join(', ');

  // This could also be configured per platform, removing the need for `__PW_CT_MOUNT__` to be global
  const userContentScript = `
  import { jsx as _jsx } from 'react/jsx-runtime';
  ${importExpressions};
  export default () => {
    const component = (${componentBuilder.toString()})({${importArguments}});
    window.__PW_CT_MOUNT__(component);
  }
  `;
  fs.writeFileSync(tempFilePath, userContentScript);
  // TODO: Figure out how to prevent Vite file watcher from triggering late and reloading the page while we're testing
  await new Promise(resolve => setTimeout(resolve, 500));
}

const evaluateTransformedScript = (page: Page, tempFilePath: string) => page.evaluate(async ({ scriptPath }) => {
  const userContentScript = await import(scriptPath);
  await userContentScript.default();
}, { scriptPath: tempFilePath });

export const test = base.extend<{ mount: (componentBuilder: () => object) => Promise<void> }>({
  mount: async ({ page }, use) => {
    const mountFixture = async () => {
      throw new Error('Attempted to call `mount` directly. This should be transformed by the Babel plugin');
    };

    // TODO: Build this based on Playwright config directory
    const rootProjectDir = path.resolve(import.meta.dirname, '../..');
    console.log('rootProjectDir', rootProjectDir);

    mountFixture._mountInternal = async (componentBuilder: () => object, imports: Record<string, Dependency>, workingDir: string) => {
      const scriptWorkingRelativeDir = path.relative(rootProjectDir, workingDir);
      const tempFilePath = path.resolve(workingDir, '.tmp.tsx');
      console.log('scriptWorkingRelativeDir', scriptWorkingRelativeDir, tempFilePath);
      await buildUserContentScript(componentBuilder, imports, scriptWorkingRelativeDir, tempFilePath);

      let tempEvalPath = path.join(scriptWorkingRelativeDir, '.tmp.tsx');
      if (!tempEvalPath.startsWith(path.sep)) {
        tempEvalPath = `${path.sep}${tempEvalPath}`;
      }

      await evaluateTransformedScript(page, tempEvalPath);
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return use(mountFixture);
  }
});
