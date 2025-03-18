import { declare } from "@babel/helper-plugin-utils";
import * as t from "@babel/types";
import * as pathApi from "path";
import { state } from "./state.js";
import { detectRequire } from "./require.js";
import { removeUnusedImportsAndRequires } from "./import.js";
import { detectTestMount, rewriteMounts } from "./mount.js";
import { detectBrowserVariable, rewriteBrowserVariables } from "./browserVariable.js";

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

          rewriteMounts(workingDirectory);
          rewriteBrowserVariables();
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
        // Get Playwright $browser calls
        detectBrowserVariable(path);
        // Get require calls
        detectRequire(path);
      }
    },
  };
});
