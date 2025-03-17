import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { getObjectPropertyValues } from "./util";
import { state } from "./state";

export const detectRequire = (path: NodePath<t.CallExpression>) => {
  if (!t.isIdentifier(path.node.callee, { name: "require" })) {
    return;
  }

  const parentPath = path.parentPath;

  const specifierNames: string[] = [];

  if (t.isVariableDeclarator(parentPath.node)) {
    if (t.isIdentifier(parentPath.node.id)) {
      // const foo = require('bar')
      specifierNames.push(parentPath.node.id.name);
    } else if (t.isObjectPattern(parentPath.node.id)) {
      // const { foo } = require('bar')
      specifierNames.push(...getObjectPropertyValues(parentPath.node.id));
    }
  } else if (t.isAssignmentExpression(parentPath.node)) {
    if (t.isIdentifier(parentPath.node.left)) {
      // foo = require('bar')
      specifierNames.push(parentPath.node.left.name);
    } else if (t.isObjectPattern(parentPath.node.left)) {
      // { foo } = require('bar')
      specifierNames.push(...getObjectPropertyValues(parentPath.node.left));
    }
  } else {
    // require('bar')
    // Side effect. I don't think we care
    return;
  }

  for (const specifier of specifierNames) {
    const binding = path.scope.getBinding(specifier);

    if (!binding) {
      throw new Error(`No binding for import "${specifier}"`);
    }
  
    state.requireBindings.set(binding, path);  
  }
}
