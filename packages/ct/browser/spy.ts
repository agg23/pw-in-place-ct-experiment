// Attempted to style after jest.Mock. We don't have to use the same type though
class __PW_BrowserSpy {
  _calls: Array<Array<any>> = [];
  _results: Array<{ type: 'return' | 'throw', value: any }> = [];

  constructor(public id: string, public name: string, public fn: Function) {}

  call = (...args: any[]) => {
    debugger;
    this._calls.push(args);
    try {
      const result = this.fn(...args);
      this._results.push({ type: 'return', value: result });
      return result;
    } catch (error) {
      this._results.push({ type: 'throw', value: error });
      throw error;
    }
  }
}
// @ts-expect-error
window.__PW_BrowserSpy = __PW_BrowserSpy;
