# Playwright Component Testing Rewrite Experiment

Rewrites component testing to use the user's configuration and dev server, rather than us always using internal Vite. This massively decreases our maintenance burden and allows users to more easily onboard to the project. Only a minimal config is currently required, and most likely it could be completely removed.

## Features

* Uses user's dev server and build process entirely
* Components are not loaded into the runner environment or even built unless the user explicitly uses it - Tests are completely isolated from browser code
* Low config - probably can be removed with further development
* Framework code is very simple and shared (no hooks/`update` yet though)
* You can test multiple frameworks at once in a split project: `mount.react()` followed by `mount.vue()`

## Disadvantages

* Babel transforms aren't simple. Maybe too much magic
* Attaching to Webpack is much more complicated than Vite

## Known issues

* Server must be manually started - this is easily fixed
* Sourcemaps don't appear to work - possibly a user config issue though

## Questions

* Do we use lambdas as arguments to mount or do we keep as is in PW? Lambdas were chosen to more clearly represent scope (and technically make the Babel transform easier)

## TODO

* Errors need to be sent back from the browser in a more obvious way
