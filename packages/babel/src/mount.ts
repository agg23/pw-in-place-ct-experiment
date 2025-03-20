import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { getLambdaDependencies } from "./util";
import { state } from "./state";
import { rewriteBrowserVariableUsageInMount } from "./browserVariable";

export const detectTestMount = (path: NodePath<t.CallExpression>) => {
  // TODO: Detect this more accurately
  let rootNode = path.node.callee;

  if (t.isMemberExpression(rootNode)) {
    rootNode = rootNode.object;
  }

  // Detect test() and test.*()
  if (
    !t.isIdentifier(rootNode) ||
    rootNode.name !== "test"
  ) {
    return;
  }

  const testBodyLambdaIndex = path.node.arguments.findIndex((arg) =>
    t.isArrowFunctionExpression(arg),
  );

  if (testBodyLambdaIndex === -1) {
    return;
  }

  const testBodyLambdaPath = path.get(
    `arguments.${testBodyLambdaIndex}`,
  ) as NodePath<t.ArrowFunctionExpression>;

  // const testBodyLambda = path.node.arguments[
  //   testBodyLambdaIndex
  // ] as t.ArrowFunctionExpression;
  const testBodyLambda = testBodyLambdaPath.node;

  if (
    testBodyLambda.params.length < 1 ||
    !t.isObjectPattern(testBodyLambda.params[0])
  ) {
    // First argument to test isn't an object?
    return;
  }

  const mountProperty = testBodyLambda.params[0].properties.find(
    (property) =>
      t.isObjectProperty(property) &&
      t.isIdentifier(property.key) &&
      property.key.name === "mount",
  );

  if (!mountProperty) {
    // We don't use mount in this test
    return;
  }

  // Find mount usage
  // TODO: Traverse deep references (passed to functions)
  testBodyLambdaPath.traverse({
    CallExpression(mountCallPath) {
      if (!t.isMemberExpression(mountCallPath.node.callee) || !t.isIdentifier(mountCallPath.node.callee.object) || mountCallPath.node.callee.object.name !== "mount" || !t.isIdentifier(mountCallPath.node.callee.property)) {
        return;
      }
      const framework = mountCallPath.node.callee.property.name;

      const mountLambdaIndex = mountCallPath.node.arguments.findIndex(
        (arg) => t.isArrowFunctionExpression(arg),
      );

      if (mountLambdaIndex === -1) {
        // Broken mount
        return;
      }

      const mountLambdaPath = mountCallPath.get(
        `arguments.${mountLambdaIndex}`,
      ) as NodePath<t.ArrowFunctionExpression>;

      const dependencies = getLambdaDependencies(
        mountLambdaPath,
        testBodyLambdaPath.scope,
        state.importBindings,
        state.requireBindings,
      );

      state.mountDependencies.set(mountLambdaPath, { dependencies, framework });
    },
  });
}

export const rewriteMounts = (workingDirectory: string) => {
  for (const [
    mountLambda,
    { dependencies, framework },
  ] of state.mountDependencies.entries()) {
    // Rewrite mount call
    const mount = mountLambda.parent as t.CallExpression;
    if (t.isV8IntrinsicIdentifier(mount.callee)) {
      continue;
    }

    let memberObject = mount.callee;
    if (t.isMemberExpression(mount.callee)) {
      memberObject = mount.callee.object;
    }
    mount.callee = t.memberExpression(
      memberObject,
      t.identifier("_mountInternal"),
    );

    const imports = t.objectExpression(
      Object.entries(dependencies).map(([identifier, dependency]) => {
        return t.objectProperty(
          t.identifier(identifier),
          t.objectExpression([
            t.objectProperty(
              t.identifier("url"),
              t.stringLiteral(dependency.url),
            ),
            t.objectProperty(
              t.identifier("type"),
              t.stringLiteral(dependency.type),
            ),
            t.objectProperty(
              t.identifier("form"),
              t.stringLiteral(dependency.form),
            ),
          ]),
        );
      }),
    );
    mount.arguments.push(imports);
    mount.arguments.push(
      t.stringLiteral(workingDirectory),
      // t.memberExpression(
      //   t.metaProperty(t.identifier("import"), t.identifier("meta")),
      //   t.identifier("dirname"),
      // ),
    );
    mount.arguments.push(t.stringLiteral(framework));

    // Rewrite mount lambda arguments (destructure all of them)
    const properties = Object.entries(dependencies).map(
      ([identifier, _dependency]) =>
        t.objectProperty(
          t.identifier(identifier),
          t.identifier(identifier),
        ),
    );

    mountLambda.node.params = [t.objectPattern(properties)];

    rewriteBrowserVariableUsageInMount(mountLambda, 'value', state.browserBindings);
    rewriteBrowserVariableUsageInMount(mountLambda, 'call', state.browserSpyBindings);
  }
}
