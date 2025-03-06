import * as path from 'path';
import type { CTFramework, DedupedImport, Dependency, MountFixture } from './types';
import { generateReact } from './framework/react';
import { generateVue } from './framework/vue';
import { generateSvelte } from './framework/svelte';

const buildImports = (imports: Record<string, Dependency>, workingDir: string): { importExpressions: string[], componentArguments: string[] } => {
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
  });
  
  const componentArguments = Object.keys(imports);

  return { importExpressions, componentArguments };
}

export const buildUserContentScript = async <T extends CTFramework>(componentBuilder: MountFixture[T], imports: Record<string, Dependency>, workingDir: string, framework: T) => {
  const { importExpressions, componentArguments } = buildImports(imports, workingDir);

  const allImports = importExpressions.join('\n');
  const componentInstantiation = `(${componentBuilder.toString()})({${componentArguments.join(', ')}})`;

  switch (framework) {
    case 'react':
      return generateReact(allImports, componentInstantiation);
    case 'vue':
      return generateVue(allImports, componentInstantiation);
    case 'svelte':
      return generateSvelte(allImports, componentInstantiation);
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
}
