# Context Prototyping

Passing context between Node and browser contexts.

## Rules

* Any input into the browser context function may not be mutated (possibly hard to detect)

## Option 1 - Automagical References

* Detect context transfers with Babel
  * This probably requires the user to declare the identifier (variable) in the same test file so we can look up the reference

```ts
import { SomeComponent } from './component';

test('some test', async () => {
  const localComplexVariable = { aProperty: new Date() };
  localComplexVariable = { parent: localComplexVariable };

  await mount(() => {
    // SomeComponent and localComplexVariable are automatically injected
    // SomeComponent is a direct import (from a path and import type)
    // localComplexVariable is serialized and passed automatically
    return <SomeComponent input={localComplexVariable} />;
  });
});
```

Would be transformed into something like:

```ts
test('some test', async () => {
  const localComplexVariable = { aProperty: new Date() };
  localComplexVariable = { parent: localComplexVariable };

  await mount._internal(
    `({ SomeComponent }, { localComplexVariable }) => {
      return <SomeComponent input={localComplexVariable} />;
    }`,
    {
      SomeComponent: {
        path: '/absolute/path/component',
        type: 'namedImport',
      }
    },
    { localComplexVariable }
  );
});
```

TODO: Not sure of browser to Node mechanism

## Option 2 - Explicit Reference Declaration

* Require the user to call a magic function that declares the output identifier as client state
* Detect use of other closed over variables in Babel and throw an error

```ts
import { SomeComponent } from './component';

test('some test', async () => {
  const localComplexVariable = { aProperty: new Date() };
  localComplexVariable = { parent: localComplexVariable };

  const localComplexVariableState = $browserState(localComplexVariable);

  const { handle, outputs: { localComplexVariableState: browserLocalComplexVariableState } } = await mount(() => {
    // SomeComponent and localComplexVariableState are automatically injected
    // SomeComponent is a direct import (from a path and import type)
    // localComplexVariableState is serialized and passed based on $browserState call

    // This would cause a compile error
    console.log(localComplexVariable);

    // This is weird as it comes before the component mount
    $registerBrowserOutput(localComplexVariableState);

    // Modifies localComplexVariableState
    return <SomeComponent input={localComplexVariableState} />;
  });

  console.log(browserLocalComplexVariableState);
});
```

Would be transformed into something like:

```ts
test('some test', async () => {
  const localComplexVariable = { aProperty: new Date() };
  localComplexVariable = { parent: localComplexVariable };

  const { handle, outputs: { localComplexVariableState: browserLocalComplexVariableState } } = await mount._internal(
    `async (mount, { SomeComponent }, { localComplexVariableState }) => {
      // Modifies localComplexVariableState
      const handle = await mount(<SomeComponent input={localComplexVariableState} />);

      return { handle, outputs: { localComplexVariableState } };
    }`,
    {
      SomeComponent: {
        path: '/absolute/path/component',
        type: 'namedImport',
      }
    },
    { localComplexVariableState: localComplexVariable }
  );

  console.log(browserLocalComplexVariableState);
});
```

## Option 3 - Explicit Passing

* Require the user to pass exactly what will be used in the mount lambda
  * Least magic
  * Confusing to users
* Detect use of other closed over variables in Babel and throw an error
* Can drop the inner lambda
* Probably auto-export all arguments to mount?
* Still requires Babel transforms for errors and to automatically extract the component import context (strip `SomeComponent` from being in the test build at all)
  * You don't have to strip the import context (we currently don't), but this means the test runner needs to be able to build their project

```ts
import { SomeComponent } from './component';

test('some test', async () => {
  const localComplexVariable = { aProperty: new Date() };
  localComplexVariable = { parent: localComplexVariable };

  const otherValue = 1;

  // Would error if localComplexVariable wasn't present in the dependencies argument
  // Would error since otherValue isn't passed to the dependencies argument
  const { handle, outputs: { localComplexVariableState: browserLocalComplexVariableState } } = await mount(<SomeComponent input={localComplexVariable} otherValue={otherValue} />, { localComplexVariable });

  console.log(browserLocalComplexVariableState.output);
});
```

No special transform takes place here. Playwright already transpiles JSX

## Experiments

### Registered callbacks?

```ts
import { SomeComponent } from './component';

test('some test', async () => {
  const localComplexVariable = { aProperty: new Date(), value: 0 };
  localComplexVariable = { parent: localComplexVariable };

  const $localComplexVariable = $bindBrowser(localComplexVariable);

  // Runs in Node
  const increment = () => {
    // Proxy pushes value to browser?
    $localComplexVariable.value += 1;
  };

  await mount(SomeComponent, { props: { $localComplexVariable }, callbackProps: { increment } }, { localComplexVariable });

  console.log(await $localComplexVariable.value);
});
```

```ts
test('some test', async () => {
  class Foo {
    let 
  }

  await mount(SomeComponent, { props: { $localComplexVariable }, callbackProps: { increment } }, { localComplexVariable });

  console.log(await $localComplexVariable.value);
});
```
