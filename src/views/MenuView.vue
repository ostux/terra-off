<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '@/stores/game';
import { useNotification } from '@/composables/useNotification';

const router = useRouter();
const { t } = useI18n();
const gameStore = useGameStore();
const { error, success, confirm, NotificationType } = useNotification();

const showNewGameDialog = ref(false);
const showLoadGameDialog = ref(false);
const newGameName = ref('');

const saves = computed(() => gameStore.allSaves);
const hasSaves = computed(() => saves.value.length > 0);

async function startNewGame() {
  showNewGameDialog.value = true;
  newGameName.value = `Game ${saves.value.length + 1}`;
}

async function confirmNewGame() {
  if (!newGameName.value.trim()) {
    error('Please enter a game name');
    return;
  }

  try {
    console.log('🎮 Creating new game:', newGameName.value.trim());
    const gameId = await gameStore.createNewGame(newGameName.value.trim());
    console.log('✅ Game created with ID:', gameId);
    console.log('📦 Current game ID:', gameStore.currentGameId);
    console.log('📦 All saves:', gameStore.allSaves);
    success(`Game "${newGameName.value}" created!`);
    showNewGameDialog.value = false;
    router.push('/game');
  } catch (err) {
    error('Failed to create new game');
    console.error('❌ Error creating game:', err);
  }
}

function cancelNewGame() {
  showNewGameDialog.value = false;
  newGameName.value = '';
}

function openLoadGameDialog() {
  if (!hasSaves.value) {
    error('No saved games found');
    return;
  }
  showLoadGameDialog.value = true;
}

async function loadSelectedGame(gameId: string) {
  try {
    await gameStore.loadGame(gameId);
    const metadata = gameStore.getSaveMetadata(gameId);
    success(`Loaded "${metadata?.name}"`);
    showLoadGameDialog.value = false;
    router.push('/game');
  } catch (err) {
    error('Failed to load game');
    console.error(err);
  }
}

function closeLoadGameDialog() {
  showLoadGameDialog.value = false;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatPlaytime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function handleDeleteGame(gameId: string, gameName: string, event: Event) {
  // Stop propagation to prevent triggering the load action
  event.stopPropagation();

  confirm(
    `Are you sure you want to delete "${gameName}"?\n\nThis action cannot be undone.`,
    () => {
      // User confirmed - delete the game
      const deleted = gameStore.deleteGame(gameId);
      if (deleted) {
        success(`Game "${gameName}" deleted`);
        // Close dialog if no saves left
        if (!hasSaves.value) {
          showLoadGameDialog.value = false;
        }
      } else {
        error('Failed to delete game');
      }
    },
    undefined,
    {
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: NotificationType.ERROR,
    }
  );
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-900">
    <div class="w-full max-w-md space-y-8 px-4">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white">
          {{ t('game.title') }}
        </h1>
        <p class="mt-2 text-lg text-gray-400">
          {{ t('game.subtitle') }}
        </p>
      </div>

      <div class="space-y-4">
        <button
          @click="startNewGame"
          class="w-full rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
        >
          {{ t('menu.newGame') }}
        </button>

        <button
          @click="openLoadGameDialog"
          :disabled="!hasSaves"
          :class="[
            'w-full rounded-lg px-6 py-4 text-lg font-semibold text-white',
            hasSaves
              ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500'
              : 'cursor-not-allowed bg-gray-800 opacity-50',
          ]"
        >
          {{ t('menu.loadGame') }}
          <span v-if="hasSaves" class="ml-2 text-sm">({{ saves.length }})</span>
        </button>

        <button
          class="w-full rounded-lg bg-gray-800 px-6 py-4 text-lg font-semibold text-white hover:bg-gray-700 active:bg-gray-600"
        >
          {{ t('menu.settings') }}
        </button>
      </div>

      <div class="text-center text-sm text-gray-500">
        <p>{{ t('game.version', { version: '0.1.0' }) }}</p>
      </div>
    </div>

    <!-- New Game Dialog -->
    <div
      v-if="showNewGameDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click="cancelNewGame"
    >
      <div
        class="w-full max-w-md rounded-xl border border-blue-500/30 bg-gray-800 p-6 shadow-2xl"
        @click.stop
      >
        <h2 class="mb-4 text-2xl font-bold text-white">New Game</h2>
        <div class="mb-6">
          <label class="mb-2 block text-sm font-medium text-gray-300">Game Name</label>
          <input
            v-model="newGameName"
            type="text"
            class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="Enter game name"
            @keyup.enter="confirmNewGame"
            autofocus
          />
        </div>
        <div class="flex gap-3">
          <button
            @click="cancelNewGame"
            class="flex-1 rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            @click="confirmNewGame"
            class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Load Game Dialog -->
    <div
      v-if="showLoadGameDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click="closeLoadGameDialog"
    >
      <div
        class="w-full max-w-2xl rounded-xl border border-blue-500/30 bg-gray-800 p-6 shadow-2xl"
        @click.stop
      >
        <h2 class="mb-4 text-2xl font-bold text-white">Load Game</h2>
        <div class="mb-6 max-h-96 space-y-2 overflow-y-auto">
          <div
            v-for="save in saves"
            :key="save.gameId"
            class="relative w-full rounded-lg border border-gray-700 bg-gray-700 hover:border-blue-500 hover:bg-gray-600"
          >
            <button
              @click="loadSelectedGame(save.gameId)"
              class="w-full p-4 text-left"
            >
              <div class="flex items-start justify-between pr-10">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-white">{{ save.name }}</h3>
                  <div class="mt-1 space-y-1 text-sm text-gray-400">
                    <p>Turn {{ save.turnNumber }}</p>
                    <p>Last played: {{ formatDate(save.savedAt) }}</p>
                    <p>Playtime: {{ formatPlaytime(save.playtime) }}</p>
                  </div>
                </div>
                <div class="text-right text-sm text-gray-500">
                  <p>Created:</p>
                  <p>{{ formatDate(save.createdAt) }}</p>
                </div>
              </div>
            </button>

            <!-- Delete button -->
            <button
              @click="handleDeleteGame(save.gameId, save.name, $event)"
              class="absolute right-2 top-2 rounded-lg bg-red-600/80 p-2 text-white hover:bg-red-700 active:bg-red-800"
              title="Delete game"
            >
              <span class="text-lg leading-none">🗑️</span>
            </button>
          </div>
        </div>
        <button
          @click="closeLoadGameDialog"
          class="w-full rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
