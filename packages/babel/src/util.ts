import { NodePath } from "@babel/core";
import type { Binding, Scope } from "@babel/traverse";
import * as t from "@babel/types";

export type Dependency = {
  url: string;
  type: "default" | "named" | "namespace";
  form: "import";
} | {
  url: string;
  type: "default" | "named";
  form: "require";
};

export const getLambdaDependencies = (
  lambda: NodePath,
  lambdaScope: Scope,
  importBindings: Map<Binding, NodePath<t.ImportDeclaration>>,
  requireBindings: Map<Binding, NodePath<t.CallExpression>>,
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
    if (importDeclaration) {
      // import foo from 'bar'
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
        form: "import",
      };
      return;
    }

    const requireDeclaration = requireBindings.get(binding);
    if (!requireDeclaration) {
      return;
    }

    if (!t.isStringLiteral(requireDeclaration.node.arguments[0])) {
      // TODO
      throw new Error("Dynamic requires are not supported");
    }

    dependencies[identifier] = {
      url: requireDeclaration.node.arguments[0].value,
      type: getRequireDependencyInfo(requireDeclaration),
      form: "require",
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

const getRequireDependencyInfo = (path: NodePath<t.CallExpression>) => {
  const parentPath = path.parentPath;

  if (t.isVariableDeclarator(parentPath.node)) {
    if (t.isIdentifier(parentPath.node.id)) {
      // const foo = require('bar')
      return "default";
    } else if (t.isObjectPattern(parentPath.node.id)) {
      // const { foo } = require('bar')
      return "named";
    }
  } else if (t.isAssignmentExpression(parentPath.node)) {
    if (t.isIdentifier(parentPath.node.left)) {
      // foo = require('bar')
      return "default";
    } else if (t.isObjectPattern(parentPath.node.left)) {
      // { foo } = require('bar')
      return "named";
    }
  }

  throw new Error('Unknown require usage');
}

// TODO: This doesn't handle rest parameters. Both import and require needs to handle rest
export const getObjectPropertyValues = (objectPattern: t.ObjectPattern) => objectPattern.properties
  .filter((property) => t.isObjectProperty(property) && t.isIdentifier(property.value))
  .map((property) => ((property as t.ObjectProperty).value as t.Identifier).name);
