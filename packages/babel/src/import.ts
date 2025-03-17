import * as t from "@babel/types";
import type { Binding, NodePath } from "@babel/traverse";
import { state } from "./state";

export const removeUnusedImportsAndRequires = (path: NodePath<t.Program>) => {
  const finalImports = new Map(
    [...state.importBindings.entries()].map(([_binding, importPath]) => [
      importPath,
      { nonMountUsage: false },
    ]),
  );

  const finalRequires = new Map(
    [...state.requireBindings.entries()].map(([_binding, requirePath]) => [
      requirePath,
      { nonMountUsage: false },
    ]),
  );

  const checkIncludeUsage = <T extends t.ImportDeclaration | t.CallExpression>(
    binding: Binding,
    identifierPath: NodePath<t.Identifier | t.JSXIdentifier>,
    bindings: Map<Binding, NodePath<T>>,
    finalIncludes: Map<NodePath<T>, {
      nonMountUsage: boolean;
    }>) => {
    const includePath = bindings.get(binding);

    if (!includePath) {
      return;
    }

    let parent = identifierPath as NodePath | null;
    while (!!parent) {
      if (
        state.mountDependencies.has(
          parent as NodePath<t.ArrowFunctionExpression>,
        )
      ) {
        // Stop iterating; this is a mount usage
        return;
      }

      parent = parent.parentPath;
    }

    // This wasn't in mount, so it was used elsewhere
    finalIncludes.get(includePath)!.nonMountUsage = true;
  }

  // Find all import references across the program
  path.traverse({
    ReferencedIdentifier(identifierPath) {
      const binding = identifierPath.scope.getBinding(
        identifierPath.node.name,
      );

      if (!binding) {
        return;
      }

      checkIncludeUsage(binding, identifierPath, state.importBindings, finalImports);
    },
  });

  // Remove any includes used in mount exclusively
  for (const [
    includeNode,
    { nonMountUsage },
  ] of [...finalImports.entries(), ...finalRequires.entries()]) {
    if (nonMountUsage) {
      // This includes was used outside of mount, so we need to keep it
      continue;
    }

    let node: NodePath = includeNode;
    if (t.isCallExpression(node.node)) {
      // This is a require
      node = includeNode.parentPath;
    }

    // Remove the include
    if (!node.removed) {
      node.remove();
    }
  }
}