export const generateVue = (imports: string, componentInstantiation: string) =>  `
import { createApp } from 'vue';
${imports}
export default () => {
  const { component, props, plugins } = ${componentInstantiation};
  const app = createApp(component, props);
  for (const plugin of plugins) {
    app.use(plugin);
  }
  app.mount('#ct-root');
}
`;
