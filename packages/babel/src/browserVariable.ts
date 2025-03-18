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

  state.browserCalls.set(path, declaration);
}

export const rewriteBrowserVariables = () => {
  for (const [browserVariable, declaration] of state.browserCalls.entries()) {
    let memberObject = browserVariable.node.callee as t.Expression;
    if (t.isMemberExpression(browserVariable.node.callee)) {
      memberObject = browserVariable.node.callee.object;
    }
    browserVariable.node.callee = t.memberExpression(
      memberObject,
      t.identifier("_internal"),
    );

    // Insert generated reference ID
    browserVariable.node.arguments.push(t.stringLiteral(randomUUID()));

    // Check for incorrect usage
    if (!t.isIdentifier(declaration)) {
      throw new Error("$browser must be attached to a single variable without destructuring");
    }

    // Insert variable name
    browserVariable.node.arguments.push(t.stringLiteral(declaration.name));
  }
}
