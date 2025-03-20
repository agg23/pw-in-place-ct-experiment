import { expect as baseExpect } from '@playwright/test';
import { BrowserSpy } from './variable';

const JEST_MATCHERS_OBJECT = Symbol.for('$$jest-matchers-object');

const spyIntoJestSpy = <T extends () => {}>(spy: BrowserSpy<T>) => {
  return spy.mock();
}

const jestMatcher = (name: string) => (globalThis as any)[JEST_MATCHERS_OBJECT].matchers[name];

// export const expect = baseExpect.extend({
//   toHaveBeenCalled: async (spy: BrowserSpy<any>) => {
//     console.log('hi');
//     const matcher = jestMatcher('toHaveBeenCalled');
//     return matcher.call(baseExpect, await spyIntoJestSpy(spy));
//   },
// });

// Jest and Playwright both muck with mutation and global state. Just proxy the object to get something working
export const expect = new Proxy(baseExpect, {
  apply(target, thisArg, argumentsList) {
    const result = target.apply(thisArg, argumentsList as any);

    return new Proxy(result, {
      get(target, prop, receiver) {
        if (prop === 'toHaveBeenCalled') {
          const [spy] = argumentsList;

          return async () => {
            // const matcher = jestMatcher('toHaveBeenCalled');
            // return matcher.call(baseExpect, await spyIntoJestSpy(spy));
            return (baseExpect(await spyIntoJestSpy(spy)) as any).toHaveBeenCalled();
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
}) as typeof baseExpect & {
  toHaveBeenCalled: (spy: BrowserSpy<any>) => Promise<void>;
};
