import { expect as baseExpect, Expect, MatcherReturnType } from '@playwright/test';
import { BrowserSpy } from './variable';

const spyIntoJestSpy = <T extends () => {}>(spy: BrowserSpy<T>) => {
  return spy.mock();
}

interface JestSpyMatchers {
  toBeCalled(spy: BrowserSpy<() => {}>): Promise<MatcherReturnType>;
  toHaveBeenCalled(spy: BrowserSpy<() => {}>): Promise<MatcherReturnType>;
  toHaveBeenCalledTimes(spy: BrowserSpy<() => {}>, count: number): Promise<MatcherReturnType>;
  toHaveBeenCalledWith(spy: BrowserSpy<() => {}>, ...args: any[]): Promise<MatcherReturnType>;
  toHaveBeenLastCalledWith(spy: BrowserSpy<() => {}>, ...args: any[]): Promise<MatcherReturnType>;
}

// Jest and Playwright both muck with mutation and global state. Just proxy the object to get something working
export const expect = new Proxy(baseExpect, {
  apply(target, thisArg, argumentsList) {
    const result = target.apply(thisArg, argumentsList as any);

    return new Proxy(result, {
      get(target, prop, receiver) {
        const [spy] = argumentsList;

        switch (prop) {
          case 'toBeCalled':
          case 'toHaveBeenCalled':
          case 'toHaveBeenCalledTimes':
          case 'toHaveBeenCalledWith':
          case 'toHaveBeenLastCalledWith': {
            return async () => (baseExpect(await spyIntoJestSpy(spy)) as any)[prop];
          }
          default: {
            return Reflect.get(target, prop, receiver);
          }
        }
      },
    });
  }
}) as Expect<JestSpyMatchers>;
