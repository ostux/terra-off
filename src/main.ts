import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createI18n } from 'vue-i18n';

import App from './App.vue';
import router from './router';

import '@/main.css';
import '@/assets/scss/index.scss';

import enGB from '@/assets/lang/en-GB.json';
// import huHU from '@/assets/lang/hu-HU.json'; // Other languages synced separately

// Type-define 'en-GB' as the master schema for the resource
type MessageSchema = typeof enGB;

const i18n = createI18n<[MessageSchema], 'en-GB'>({
  legacy: false,
  locale: 'en-GB',
  fallbackLocale: 'en-GB',
  messages: {
    'en-GB': enGB,
    // 'hu-HU': huHU, // TODO: Sync other languages when needed
  },
});

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(i18n);
app.use(router);

app.mount('#app');

// Debug utility for development
if (import.meta.env.DEV) {
  (window as Window & { __debugSaveSystem__?: () => void }).__debugSaveSystem__ = () => {
    console.log('🔍 Save System Debug Info:');
    console.log('📦 LocalStorage keys:', Object.keys(localStorage));

    // Check main game store
    const gameData = localStorage.getItem('terra-off-game');
    if (gameData) {
      try {
        const parsed = JSON.parse(gameData);
        console.log('💾 Game store data:', parsed);
        console.log('📊 Number of game metadata:', Object.keys(parsed.gameMetadata || {}).length);
        console.log('🎮 Current game ID:', parsed.currentGameId);
      } catch (e) {
        console.error('❌ Failed to parse game data:', e);
      }
    } else {
      console.warn('⚠️ No game metadata found in localStorage');
    }

    // Check individual save files
    const saveKeys = Object.keys(localStorage).filter(key => key.startsWith('terra-off-save-'));
    console.log('💾 Individual save files:', saveKeys.length);
    saveKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        console.log(`  📁 ${key}:`, data.metadata?.name, '- Turn', data.metadata?.turnNumber);
      } catch (e) {
        console.error(`  ❌ Failed to parse ${key}:`, e);
      }
    });
  };
  console.log('🔧 Debug function available: __debugSaveSystem__()');
}
