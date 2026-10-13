import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';

import App from './App.vue';
import router from './router';

import '@/main.css';
import '@/assets/scss/index.scss';

import enGB from '@/assets/lang/en-GB.json';
import huHU from '@/assets/lang/hu-HU.json';

// Type-define 'en-US' as the master schema for the resource
type MessageSchema = typeof enGB;

const i18n = createI18n<[MessageSchema], 'en-GB' | 'hu-HU'>({
  legacy: true,
  locale: 'en-GB',
  fallbackLocale: 'en-GB',
  messages: {
    'en-GB': enGB,
    'hu-HU': huHU,
  },
});

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.use(router);

app.mount('#app');
