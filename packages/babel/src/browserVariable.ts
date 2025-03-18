import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { getVariableDeclarator } from "./util";
import { state } from "./state";
import { randomUUID } from "crypto";

export const detectBrowserVariable = (path: NodePath<t.CallExpression>) => {
  if (!t.isIdentifier(path.node.callee, { name: "$browser" })) {
    return;
  }

  const parentPath = path.parentPath;

  const declaration = getVariableDeclarator(parentPath);

  if (!declaration) {
    return;
  }

  // Check for incorrect usage
  if (!t.isIdentifier(declaration)) {
    throw new Error("$browser must be attached to a single variable without destructuring");
  }

  const binding = parentPath.scope.getBinding(
    declaration.name,
  );

  if (!binding) {
    throw new Error(`No binding for browser variable "${declaration.name}"`);
  }

  state.browserBindings.set(binding, { declaration, callSite: path });
}

export const rewriteBrowserVariables = () => {
  for (const [binding, { declaration, callSite }] of state.browserBindings.entries()) {
    let memberObject = callSite.node.callee as t.Expression;
    if (t.isMemberExpression(callSite.node.callee)) {
      memberObject = callSite.node.callee.object;
    }
    callSite.node.callee = t.memberExpression(
      memberObject,
      t.identifier("_internal"),
    );

    // Insert generated reference ID
    callSite.node.arguments.push(t.stringLiteral(randomUUID()));

    // Insert variable name
    callSite.node.arguments.push(t.stringLiteral(declaration.name));
  }
}

export const rewriteBrowserVariableUsageInMount = (mountLambda: NodePath<t.ArrowFunctionExpression>) => {
  const matchedVariableUsage: Array<NodePath<t.Identifier>> = [];

  mountLambda.traverse({
    Identifier: (path) => {
      const binding = path.scope.getBinding(path.node.name);

      if (!binding) {
        return;
      }

      const browserVariableDeclaration = state.browserBindings.get(binding);
      if (!browserVariableDeclaration) {
        return;
      }

      matchedVariableUsage.push(path);
    }
  });

  for (const path of matchedVariableUsage) {
    // This is a usage of a browser variable. Rewrite to be a `variable.value` reference
    path.replaceWith(t.memberExpression(t.identifier(path.node.name), t.identifier('value')));
  }
}
