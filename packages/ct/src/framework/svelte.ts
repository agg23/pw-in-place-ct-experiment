export const generateSvelte = (imports: string, componentInstantiation: string) =>  `
import { mount } from 'svelte';
${imports}
export default () => {
  const { component, props } = ${componentInstantiation};
  mount(component, { ...props, target: document.getElementById('ct-root') });
}
`;
