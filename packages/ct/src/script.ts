import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import type { DedupedImport, Dependency } from './types';

export const buildUserContentScript = async (componentBuilder: () => object, imports: Record<string, Dependency>, workingDir: string, tempFilePath: string) => {
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

    const importExpressions: string[] = [];
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
  import { createRoot } from 'react-dom/client';
  import { jsx as _jsx } from 'react/jsx-runtime';
  import * as _jsxRuntime from 'playwright/jsx-runtime';
  ${importExpressions}
  export default () => {
    const component = (${componentBuilder.toString()})({${importArguments}});
    createRoot(document.getElementById('ct-root')).render(component);
  }
  `;
  fs.writeFileSync(tempFilePath, userContentScript);
  // TODO: Figure out how to prevent Vite file watcher from triggering late and reloading the page while we're testing
  await new Promise(resolve => setTimeout(resolve, 500));
}

export const evaluateTransformedScript = (page: Page, tempFilePath: string) => page.evaluate(
  // When not declared as a template string this can be transpiled
  ({ scriptPath }) => eval(`debugger; import('${scriptPath}').then(module => module.default())`),
  { scriptPath: tempFilePath }
);
