import { NodePath } from "@babel/core";
import type { Binding, Scope } from "@babel/traverse";
import * as t from "@babel/types";

export interface Dependency {
  url: string;
  type: "default" | "named" | "namespace";
}

export const getLambdaDependencies = (
  lambda: NodePath,
  lambdaScope: Scope,
  importBindings: Map<Binding, NodePath<t.ImportDeclaration>>,
): Record<string, Dependency> => {
  const dependencies: Record<string, Dependency> = {};

  const investigatePath = (path: NodePath, identifier: string) => {
    if (lambdaScope.hasOwnBinding(identifier)) {
      // This is a local binding to this mount lambda. Ignore
      return;
    }

    const binding = path.scope.getBinding(identifier);

    if (!binding) {
      return;
    }

    const importDeclaration = importBindings.get(binding);
    if (!importDeclaration) {
      return;
    }

    let type: "default" | "named" | "namespace" = "default";

    const matchingSpecifier = importDeclaration.node.specifiers.find(
      (specifier) => specifier.local.name === identifier,
    );
    if (t.isImportSpecifier(matchingSpecifier)) {
      type = "named";
    } else if (t.isImportNamespaceSpecifier(matchingSpecifier)) {
      type = "namespace";
    }

    dependencies[identifier] = {
      url: importDeclaration.node.source.value,
      type,
    };
  };

  lambda.traverse({
    Identifier(path) {
      investigatePath(path, path.node.name);
    },
    JSXOpeningElement(path) {
      // JSX can be top level return type of the arrow
      if (!t.isJSXIdentifier(path.node.name)) {
        console.log(`TODO: Unknown JSX ${path}`);
        return;
      }

      investigatePath(path, path.node.name.name);
    },
  });

  return dependencies;
};
