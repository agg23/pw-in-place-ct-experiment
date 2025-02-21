import { Counter } from './components/Counter';

export default async () => {
  debugger;
  const counterImport = import('/src/components/Counter');
  console.log('counterImport', counterImport);
  counterImport.then(console.log).catch(console.error);
  try {
    const {
      Counter
    } = await counterImport;
    console.log('imported counter', Counter);
  } catch (e) {
    console.error(e);
    debugger;
  }
  debugger;
  window.__PW_CT_MOUNT__(<Counter />);
}