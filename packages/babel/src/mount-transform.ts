import { NodePath } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import * as t from "@babel/types";
import type { Binding } from "@babel/traverse";
import * as pathApi from "path";
import { Dependency, getLambdaDependencies } from "./util.js";

// interface ImportRegistryItem {
//   importNode: t.ImportDeclaration;
// }

// let importInfos: Map<string, ImportInfo>;
// let importDeclarations: Map<string, t.ImportDeclaration>;
let importBindings: Map<Binding, NodePath<t.ImportDeclaration>>;
let mountDependencies: Map<
  NodePath<t.ArrowFunctionExpression>,
  Record<string, Dependency>
>;

export default declare((api) => {
  api.assertVersion(7);

  importBindings = new Map();
  mountDependencies = new Map();

  return {
    name: "playwright-component-mount-transform",
    visitor: {
      // enter(path, state) {
      // enter() {
      //   // importInfos = new Map();
      //   importDeclarations = new Map();
      // },
      Program: {
        // Program(path) {
        // for (const node of path.node.body) {
        //   if (t.isImportDeclaration(node)) {
        //     for (const specifier )
        //   }
        // }
        exit(path, state) {
          if (!state.filename) {
            throw new Error("No filename provided");
          }
          const workingDirectory = pathApi.dirname(state.filename);

          console.log(
            pathApi.resolve(pathApi.dirname(state.filename), "./Counter.tsx"),
          );
          console.log("filename", state.file.opts.filenameRelative);
          const finalImports = new Map(
            [...importBindings.entries()].map(([_binding, importPath]) => [
              importPath,
              { nonMountUsage: false },
            ]),
          );

          // Find all import references across the program
          path.traverse({
            ReferencedIdentifier(identifierPath) {
              const binding = identifierPath.scope.getBinding(
                identifierPath.node.name,
              );

              if (!binding) {
                return;
              }

              const importPath = importBindings.get(binding);

              if (!importPath) {
                return;
              }

              // const specifier = importPath.node.specifiers.find(
              //   (specifier) =>
              //     t.isImportSpecifier(specifier) &&
              //     specifier.local.name === identifierPath.node.name,
              // );

              // if (!specifier) {
              //   throw new Error(
              //     `Could not find specifier for ${identifierPath.node.name}`,
              //   );
              // }

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
              finalImports.get(importPath)!.nonMountUsage = true;
            },
          });

          // Remove any imports used in mount exclusively
          for (const [
            importNode,
            { nonMountUsage },
          ] of finalImports.entries()) {
            if (nonMountUsage) {
              // This import was used outside of mount, so we need to keep it
              continue;
            }

            // Remove the import
            if (!importNode.removed) {
              importNode.remove();
            }
          }

          // Rewrite mount functions
          // TODO: Must destructure args and write imports map
          for (const [
            mountLambda,
            dependencies,
          ] of mountDependencies.entries()) {
            // Rewrite mount call
            const mount = mountLambda.parent as t.CallExpression;
            if (t.isV8IntrinsicIdentifier(mount.callee)) {
              continue;
            }
            mount.callee = t.memberExpression(
              mount.callee,
              t.identifier("_mountInternal"),
            );

            const imports = t.objectExpression(
              Object.entries(dependencies).map(([identifier, dependency]) => {
                let importURL = dependency.url;
                if (importURL.startsWith(".")) {
                  // Relative path
                  importURL = pathApi.resolve(workingDirectory, importURL);
                }
                // TODO: This won't handle other magic imports like `@prefix/suburl`

                return t.objectProperty(
                  t.identifier(identifier),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("url"),
                      t.stringLiteral(importURL),
                    ),
                    t.objectProperty(
                      t.identifier("type"),
                      t.stringLiteral(dependency.type),
                    ),
                  ]),
                );
              }),
            );
            mount.arguments.push(imports);
            mount.arguments.push(
              t.memberExpression(
                t.metaProperty(t.identifier("import"), t.identifier("meta")),
                t.identifier("dirname"),
              ),
            );

            // Rewrite mount lambda arguments (destructure all of them)
            const properties = Object.entries(dependencies).map(
              ([identifier, _dependency]) =>
                t.objectProperty(
                  t.identifier(identifier),
                  t.identifier(identifier),
                ),
            );

            mountLambda.node.params = [t.objectPattern(properties)];

            // const importsMap = t.objectExpression(
            //   Object.entries(dependencies).map(([identifier, dependency]) => {
            //     const importType = t.stringLiteral(dependency.importType);
            //     const importPath = t.stringLiteral(
            //       dependency.path.node.source.value,
            //     );

            //     return t.objectProperty(
            //       t.identifier(identifier),
            //       t.objectExpression([
            //         t.objectProperty(t.identifier("importType"), importType),
            //         t.objectProperty(t.identifier("importPath"), importPath),
            //       ]),
            //     );
            //   }),
            // );

            // mountLambdaParams.push(t.identifier("imports"));

            // const importsArg = t.objectExpression([
            //   t.objectProperty(t.identifier("imports"), importsMap),
            // ]);

            // mountLambdaNode.body = t.blockStatement([
            //   t.returnStatement(
            //     t.callExpression(mountLambdaNode.body, [importsArg]),
            //   ),
            // ]);
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
        if (
          !t.isIdentifier(path.node.callee) ||
          path.node.callee.name !== "test"
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
            if (
              !t.isIdentifier(mountCallPath.node.callee) ||
              mountCallPath.node.callee.name !== "mount"
            ) {
              return;
            }

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
            );
            console.log(dependencies);

            // mountLambda.params.push(
            //   ...Object.keys(dependencies).map(t.identifier),
            // );
            mountDependencies.set(mountLambdaPath, dependencies);
            // TODO now: Remove imports and record imports to inject into browser context
          },
        });
      },
    },
  };
});

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
