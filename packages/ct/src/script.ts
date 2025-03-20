import * as path from 'path';
import type { CTFramework, DedupedImport, DedupedRequire, Dependency, MountFixture } from './types';
import { generateReact } from './framework/react';
import { generateVue } from './framework/vue';
import { generateSvelte } from './framework/svelte';

const buildIncludes = (imports: Record<string, Dependency>, workingDir: string) => {
  const dedupedImports = new Map<string, DedupedImport>();
  const dedupedRequires = new Map<string, DedupedRequire>();

  for (const [variableName, dependency] of Object.entries(imports)) {
    if (dependency.form === 'import') {
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
    } else {
      let sharedRequire = dedupedImports.get(dependency.url);

      if (!sharedRequire) {
        sharedRequire = { named: [] };
        dedupedRequires.set(dependency.url, sharedRequire);
      }

      if (dependency.type === 'named') {
        sharedRequire.named.push(variableName);
      } else if (dependency.type === 'default') {
        if (sharedRequire.default) {
          throw new Error(`Multiple default imports for ${dependency.url}`);
        }
        sharedRequire.default = variableName;
      }
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
  });

  // TODO: This might only work in ESM
  // Let the bundler transpile this rather than our package build
  importExpressions.push(`import '${path.resolve(__dirname, '../browser/spy.js')}';`);
  
  const requireExpressions = [...dedupedRequires.entries()].flatMap(([url, requireData]) => {
    let requirePath = url;
    if (requirePath.startsWith('.')) {
      requirePath = path.resolve(workingDir, requirePath);
    }

    const requireExpressions: string[] = [];

    let sharedRequireExpression = '';

    if (requireData.named.length > 0) {
      const namedImports = requireData.named.join(', ');
      sharedRequireExpression = `{${namedImports}}`;
    }
    
    if (requireData.default) {
      if (sharedRequireExpression) {
        sharedRequireExpression += `, ${requireData.default}`;
      } else {
        sharedRequireExpression = requireData.default;
      }
    }

    if (sharedRequireExpression) {
      requireExpressions.push(`const ${sharedRequireExpression} = require('${requirePath}');`);
    }

    return requireExpressions;
  });
  
  const componentArguments = Object.keys(imports);

  return { importExpressions, requireExpressions, componentArguments };
}

export const buildUserContentScript = async <T extends CTFramework>(componentBuilder: MountFixture[T], imports: Record<string, Dependency>, variablesInContext: Array<{id: string, name: string}>, workingDir: string, framework: T) => {
  const { importExpressions, requireExpressions, componentArguments } = buildIncludes(imports, workingDir);

  const allImports = importExpressions.join('\n');
  const allRequires = requireExpressions.join('\n');
  const allIncludes = `${allImports}\n${allRequires}`;
  const componentInstantiation = `(${componentBuilder.toString()})({${componentArguments.join(', ')}})`;

  const allVariables = buildVariableExpressions(variablesInContext);

  switch (framework) {
    case 'react':
      return generateReact(allIncludes, allVariables, componentInstantiation);
    case 'vue':
      return generateVue(allIncludes, allVariables, componentInstantiation);
    case 'svelte':
      return generateSvelte(allIncludes, allVariables, componentInstantiation);
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
}

const buildVariableExpressions = (variablesInContext: Array<{id: string, name: string}>) => variablesInContext.map(({ id, name }) =>
  `const ${name} = window.__PW_BROWSER_VARIABLE_REGISTRY.get('${id}');`).join('\n');
