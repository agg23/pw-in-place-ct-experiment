export const generateSvelte = (imports: string, localVariables: string, componentInstantiation: string) =>  `
import { mount } from 'svelte';
${imports}
export default () => {
  ${localVariables}
  const { component, props } = ${componentInstantiation};
  mount(component, { ...props, target: document.getElementById('ct-root') });
}
`;
