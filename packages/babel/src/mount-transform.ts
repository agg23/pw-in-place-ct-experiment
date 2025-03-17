import { declare } from "@babel/helper-plugin-utils";
import * as t from "@babel/types";
import * as pathApi from "path";
import { state } from "./state.js";
import { detectRequire } from "./require.js";
import { removeUnusedImportsAndRequires } from "./import.js";
import { detectTestMount } from "./mount.js";

export default declare((api) => {
  api.assertVersion(7);

  state.importBindings = new Map();
  state.requireBindings = new Map();
  state.mountDependencies = new Map();

  return {
    name: "playwright-component-mount-transform",
    visitor: {
      Program: {
        exit(path, plugin) {
          if (!plugin.filename) {
            throw new Error("No filename provided");
          }
          const workingDirectory = pathApi.dirname(plugin.filename);

          removeUnusedImportsAndRequires(path);

          // Rewrite mount functions
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

          state.importBindings.set(binding, path);
        }
      },
      CallExpression(path) {
        // Get Playwright mount calls
        detectTestMount(path);
        // Get require calls
        detectRequire(path);
      }
    },
  };
});
