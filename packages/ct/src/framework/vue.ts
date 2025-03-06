export const generateVue = (imports: string, componentInstantiation: string) =>  `
import { createApp } from 'vue'
${imports}
export default () => {
  const { component, props } = ${componentInstantiation};
  createApp(component, props).mount('#ct-root');
}
`;
