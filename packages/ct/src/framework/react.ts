export const generateReact = (imports: string, localVariables: string, componentInstantiation: string) =>  `
import { createRoot } from 'react-dom/client';
import { jsx as _jsx } from 'react/jsx-runtime';
// import * as _jsxRuntime from 'playwright/jsx-runtime';
const _jsxRuntime = { jsx: _jsx };
${imports}
class _PW_BrowserSpy {
  _calls = [];

  constructor(id, name, fn) {
    this.id = id;
    this.name = name;
    this.fn = fn;
  }

  call = (...args) => {
    debugger;
    this._calls.push(args);
    return this.fn(...args);
  }

  get value() {
    return this._calls;
  }
}
window._PW_BrowserSpy = _PW_BrowserSpy;
export default () => {
  ${localVariables}
  const component = ${componentInstantiation};
  createRoot(document.getElementById('ct-root')).render(component);
}
`;

// TODO: Special wrapper for testing React hooks?
