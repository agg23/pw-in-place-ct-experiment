import { NodePath } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import * as t from "@babel/types";
import type { Binding } from "@babel/traverse";
import * as pathApi from "path";
import { Dependency, getLambdaDependencies, getObjectPropertyValues } from "./util.js";

let importBindings: Map<Binding, NodePath<t.ImportDeclaration>>;
let requireBindings: Map<Binding, NodePath<t.CallExpression>>;
let mountDependencies: Map<
  NodePath<t.ArrowFunctionExpression>,
  {
    dependencies: Record<string, Dependency>,
    framework: string,
  }
>;

export default declare((api) => {
  api.assertVersion(7);

  importBindings = new Map();
  requireBindings = new Map();
  mountDependencies = new Map();

  return {
    name: "playwright-component-mount-transform",
    visitor: {
      Program: {
        exit(path, state) {
          if (!state.filename) {
            throw new Error("No filename provided");
          }
          const workingDirectory = pathApi.dirname(state.filename);

          const finalImports = new Map(
            [...importBindings.entries()].map(([_binding, importPath]) => [
              importPath,
              { nonMountUsage: false },
            ]),
          );

          const finalRequires = new Map(
            [...requireBindings.entries()].map(([_binding, requirePath]) => [
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
                mountDependencies.has(
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

              checkIncludeUsage(binding, identifierPath, importBindings, finalImports);
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

          // Rewrite mount functions
          for (const [
            mountLambda,
            { dependencies, framework },
          ] of mountDependencies.entries()) {
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
          }
        },
      },
      ImportDeclaration(path) {
        const importNode = path.node;
        if (!t.isStringLiteral(importNode.source)) {
          return;
        }

        // Collect all imports
        for (const specifier of importNode.specifiers) {
          // if (t.isImportNamespaceSpecifier(specifier)) {
          //   continue;
          // }
          // Specifically ignore `@babel/plugin-transform-react-jsx` usages; these do not apply
          if (specifier.local.name === "_jsx") {
            continue;
          }

          const binding = path.scope.getBinding(specifier.local.name);

          if (!binding) {
            throw new Error(`No binding for import "${specifier.local.name}"`);
          }

          importBindings.set(binding, path);
        }
      },
      CallExpression(path) {
        detectTestMount(path);
        detectRequire(path);
      }
    },
  };
});

const detectTestMount = (path: NodePath<t.CallExpression>) => {
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
        importBindings,
        requireBindings,
      );

      mountDependencies.set(mountLambdaPath, { dependencies, framework });
    },
  });
}

const detectRequire = (path: NodePath<t.CallExpression>) => {
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
  
    requireBindings.set(binding, path);  
  }
}

export type ImportInfo = {
  id: string;
  filename: string;
  importSource: string;
  remoteName: string | undefined;
};

export function importInfo(
  importNode: t.ImportDeclaration,
  specifier: t.ImportSpecifier | t.ImportDefaultSpecifier,
  filename: string,
): { localName: string; info: ImportInfo } {
  const importSource = importNode.source.value;
  const idPrefix = pathApi
    .join(filename, "..", importSource)
    .replace(/[^\w_\d]/g, "_");

  const result: ImportInfo = {
    id: idPrefix,
    filename,
    importSource,
    remoteName: undefined,
  };

  if (t.isImportDefaultSpecifier(specifier)) {
    //
  } else if (t.isIdentifier(specifier.imported)) {
    result.remoteName = specifier.imported.name;
  } else {
    result.remoteName = specifier.imported.value;
  }

  if (result.remoteName) result.id += "_" + result.remoteName;
  return { localName: specifier.local.name, info: result };
}
