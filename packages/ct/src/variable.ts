import { JSHandle } from "@playwright/test";

type Handle<T> = JSHandle<{ value: T }>;

// TODO: Find a better name
export class BrowserVariable<T> {
  handle: Handle<T> | undefined = undefined;

  constructor(public id: string) { }

  registerHandle(handle: Handle<T>) {
    this.handle = handle;
  }

  async get(): Promise<T> {
    if (!this.handle) {
      throw new Error('Cannot get a browser variable that has not been initialized');
    }

    const wrapper = await this.handle.jsonValue();
    return wrapper.value;
  }

  async set(value: T): Promise<void> {
    if (!this.handle) {
      throw new Error('Cannot set a browser variable that has not been initialized');
    }

    await this.handle.evaluate((variable, value) => {
      variable.value = value as T;
    }, value);
  }
}

interface MockLike {
  calls: { all: () => Array<Parameters<any>>, count: () => number };
  results: Array<{ type: 'return' | 'throw', value: any }>;
}

export class BrowserSpy<T extends () => {}> {
  handle: Handle<T> | undefined = undefined;

  constructor(public id: string) { }

  registerHandle(handle: Handle<T>) {
    this.handle = handle;
  }

  async mock(): Promise<MockLike> {
    if (!this.handle) {
      throw new Error('Cannot get a browser spy that has not been initialized');
    }

    const spy = await this.handle.evaluate((spy: any) => ({
      calls: spy._calls,
      results: spy._results,
    }));

    return {
      calls: {
        all: () => spy.calls,
        count: () => spy.calls.length,
      },
      results: spy.results,
    }
  }

  async calls(): Promise<Array<Parameters<T>>> {
    if (!this.handle) {
      throw new Error('Cannot get a browser spy that has not been initialized');
    }

    return this.handle.evaluate((spy: any) => spy._calls) as unknown as Array<Parameters<T>>;
  }
}
