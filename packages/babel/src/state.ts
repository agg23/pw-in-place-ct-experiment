import * as t from "@babel/types";
import type { Binding, NodePath } from "@babel/traverse";
import { Dependency } from "./util";

type Foo = Map<Binding, NodePath<t.ImportDeclaration>>;

export const state: {
  importBindings: Map<Binding, NodePath<t.ImportDeclaration>>,
  requireBindings: Map<Binding, NodePath<t.CallExpression>>,
  mountDependencies: Map<
    NodePath<t.ArrowFunctionExpression>,
    {
      dependencies: Record<string, Dependency>,
      framework: string,
    }
  >,
  // Binding is to the assigned variable name
  browserBindings: Map<
    Binding,
    {
      declaration: t.Identifier,
      callSite: NodePath<t.CallExpression>,
    }
  >,
  browserSpyBindings: Map<
    Binding,
    {
      declaration: t.Identifier,
      callSite: NodePath<t.CallExpression>,
    }
  >
} = {
  importBindings: new Map(),
  requireBindings: new Map(),
  mountDependencies: new Map(),
  browserBindings: new Map(),
  browserSpyBindings: new Map(),
};
