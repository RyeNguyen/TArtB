import 'i18next';
import ns1 from '../locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ns1;
    };
  }
}