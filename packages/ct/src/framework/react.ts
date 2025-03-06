export const generateReact = (imports: string, componentInstantiation: string) =>  `
import { createRoot } from 'react-dom/client';
import { jsx as _jsx } from 'react/jsx-runtime';
// import * as _jsxRuntime from 'playwright/jsx-runtime';
const _jsxRuntime = { jsx: _jsx };
${imports}
export default () => {
  const component = ${componentInstantiation};
  createRoot(document.getElementById('ct-root')).render(component);
}
`;
