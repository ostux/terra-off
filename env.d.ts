/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite/client" />

import type { VueI18n } from 'vue-i18n';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, ...args: any[]) => string;
    $te: (key: string) => boolean;
    $d: (value: number | Date, ...args: any[]) => string;
    $n: (value: number, ...args: any[]) => string;
    $i18n: VueI18n;
  }
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    message: {
      hello: string;
    };
  }
}
