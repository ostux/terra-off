/// <reference types="vite/client" />

import type enGB from '@/assets/lang/en-GB.json';

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    message: (typeof enGB)['message'];
  }
}
