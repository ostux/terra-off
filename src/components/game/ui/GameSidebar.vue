<script setup lang="ts">
import { ref } from 'vue';
import PeasantPool from '@/components/game/peasants/PeasantPool.vue';
import TurnHistory from '@/components/game/turn/TurnHistory.vue';
import TurnTimer from '@/components/game/turn/TurnTimer.vue';
import BuildingMenu from '@/components/game/buildings/BuildingMenu.vue';
import BuildingList from '@/components/game/buildings/BuildingList.vue';
import type { BuildingDefinition } from '@/data/buildings';
import type { Coordinates } from '@/data/types';

interface Props {
  selectedBuilding?: BuildingDefinition | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedBuilding: null,
});

type TabType = 'buildings' | 'my-buildings' | 'peasants' | 'history' | 'research';

const emit = defineEmits<{
  (e: 'buildingSelected', building: BuildingDefinition | null): void;
  (e: 'buildingClick', coordinates: Coordinates): void;
  (e: 'panTo', coordinates: Coordinates): void;
}>();

const activeTab = ref<TabType>('buildings');

const tabs = [
  { id: 'buildings' as TabType, label: 'Build', icon: '🏗️' },
  { id: 'my-buildings' as TabType, label: 'My Buildings', icon: '🏘️' },
  { id: 'peasants' as TabType, label: 'Peasants', icon: '👥' },
  { id: 'history' as TabType, label: 'History', icon: '📜' },
  { id: 'research' as TabType, label: 'Research', icon: '🔬' },
];

function selectTab(tab: TabType) {
  activeTab.value = tab;
}

function handleBuildingSelected(building: BuildingDefinition | null) {
  emit('buildingSelected', building);
}
</script>

<template>
  <aside class="flex w-80 flex-col border-l border-gray-700 bg-gray-800">
    <!-- Tab Navigation -->
    <div class="flex border-b border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        class="flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activeTab === tab.id
            ? 'border-blue-500 bg-gray-700/50 text-blue-400'
            : 'border-transparent text-gray-400 hover:bg-gray-700/30 hover:text-gray-300'
        "
      >
        <span class="text-base">{{ tab.icon }}</span>
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Buildings Tab -->
      <div v-if="activeTab === 'buildings'" class="flex flex-col gap-4">
        <BuildingMenu
          :selected-building="selectedBuilding"
          @update:selected-building="handleBuildingSelected"
        />

        <div class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-300">
          <p class="font-semibold">💡 How to build:</p>
          <ul class="mt-2 space-y-1 text-xs">
            <li>• Select a building from the list above</li>
            <li>• Click on the map to place it</li>
            <li>• Costs 1 action + resources</li>
            <li>• Wait N turns for construction to complete</li>
            <li>• Allocate peasants when done!</li>
          </ul>
        </div>
      </div>

      <!-- My Buildings Tab -->
      <div v-if="activeTab === 'my-buildings'" class="flex h-full flex-col">
        <BuildingList
          @building-click="(coords) => emit('buildingClick', coords)"
          @pan-to="(coords) => emit('panTo', coords)"
        />
      </div>

      <!-- Peasants Tab -->
      <div v-if="activeTab === 'peasants'" class="flex flex-col gap-4">
        <PeasantPool />

        <div class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
          <p class="font-semibold">💡 Peasant System:</p>
          <ul class="mt-2 space-y-1 text-xs">
            <li>• Build houses to generate peasants</li>
            <li>• Allocate to buildings for production</li>
            <li>• 6 peasants = 100% efficiency (optimal)</li>
            <li>• 30 peasants = 500% efficiency (max)</li>
            <li>• Reallocating is FREE (0 actions)</li>
          </ul>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="flex flex-col gap-4">
        <TurnHistory :max-actions="15" :show-costs="true" />

        <div class="rounded-lg bg-gray-700/50 p-4">
          <h3 class="mb-2 text-sm font-semibold text-gray-300">Turn Timer</h3>
          <TurnTimer :time-limit="0" />
          <p class="mt-2 text-xs text-gray-500">
            Timer disabled (set timeLimit > 0 to enable)
          </p>
        </div>
      </div>

      <!-- Research Tab -->
      <div v-if="activeTab === 'research'" class="flex flex-col gap-4">
        <h2 class="text-lg font-bold text-white">Research</h2>
        <div class="rounded-lg bg-gray-700/50 p-4 text-center text-gray-400">
          <p class="mb-2">🔬 Research system coming in Phase 7</p>
          <p class="text-sm">
            Unlock new buildings, units, and bonuses through technology!
          </p>
        </div>

        <div class="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-300">
          <p class="font-semibold">💡 Research Examples:</p>
          <ul class="mt-2 space-y-1 text-xs">
            <li>• Administration I: +1 action per turn</li>
            <li>• Advanced Farming: +20% food production</li>
            <li>• Stone Working: Unlock stone walls</li>
            <li>• Military Training: Unlock better units</li>
          </ul>
        </div>
      </div>
    </div>
  </aside>
</template>
