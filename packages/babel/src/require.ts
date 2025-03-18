import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { collapseVariableIdentifiers, getObjectPropertyValues, getVariableDeclarator } from "./util";
import { state } from "./state";

export const detectRequire = (path: NodePath<t.CallExpression>) => {
  if (!t.isIdentifier(path.node.callee, { name: "require" })) {
    return;
  }

  const parentPath = path.parentPath;

  const declaration = getVariableDeclarator(parentPath);

  if (!declaration) {
    return;
  }

  let specifierNames = collapseVariableIdentifiers(declaration);

  for (const specifier of specifierNames) {
    const binding = path.scope.getBinding(specifier);

    if (!binding) {
      throw new Error(`No binding for import "${specifier}"`);
    }
  
    state.requireBindings.set(binding, path);  
  }
}
