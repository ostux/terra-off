/**
 * Resource Store
 * Manages player resources, production, and consumption
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  PlayerId,
  ResourceType,
  ResourceAmount,
  ResourceDelta,
  PlayerResources,
  ResourceTransaction,
  ResourceCost,
  ResourceCheck,
} from '@/data/types';
import { ResourceType as ResourceTypeEnum } from '@/data/types';
import { RESOURCE_CONFIG } from '@/data/config';

export const useResourcesStore = defineStore('resources', () => {
  // Per-player resource states
  const playerResources = ref(new Map<PlayerId, PlayerResources>());

  // Resource transaction history (for debugging/display)
  const transactionHistory = ref<ResourceTransaction[]>([]);

  /**
   * Initialize resources for a player
   */
  function initializePlayerResources(playerId: PlayerId): void {
    const initialResources: PlayerResources = {
      playerId,
      current: { ...RESOURCE_CONFIG.STARTING_RESOURCES },
      capacity: { ...RESOURCE_CONFIG.DEFAULT_STORAGE_CAPACITY },
      production: {
        [ResourceTypeEnum.FOOD]: 0,
        [ResourceTypeEnum.WOOD]: 0,
        [ResourceTypeEnum.STONE]: 0,
        [ResourceTypeEnum.IRON]: 0,
      },
      consumption: {
        [ResourceTypeEnum.FOOD]: 0,
        [ResourceTypeEnum.WOOD]: 0,
        [ResourceTypeEnum.STONE]: 0,
        [ResourceTypeEnum.IRON]: 0,
      },
      netProduction: {
        [ResourceTypeEnum.FOOD]: 0,
        [ResourceTypeEnum.WOOD]: 0,
        [ResourceTypeEnum.STONE]: 0,
        [ResourceTypeEnum.IRON]: 0,
      },
    };

    playerResources.value.set(playerId, initialResources);
  }

  /**
   * Get resources for a player
   */
  function getPlayerResources(playerId: PlayerId): PlayerResources | null {
    return playerResources.value.get(playerId) || null;
  }

  /**
   * Get current resource amount
   */
  function getResourceAmount(playerId: PlayerId, resourceType: ResourceType): number {
    const resources = playerResources.value.get(playerId);
    return resources?.current[resourceType] || 0;
  }

  /**
   * Get all current resources
   */
  function getCurrentResources(playerId: PlayerId): ResourceAmount | null {
    const resources = playerResources.value.get(playerId);
    return resources ? { ...resources.current } : null;
  }

  /**
   * Add resources to player
   */
  function addResources(
    playerId: PlayerId,
    delta: ResourceDelta,
    reason: string,
    turnNumber: number,
  ): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    for (const [resourceType, amount] of Object.entries(delta)) {
      if (amount && amount > 0) {
        const type = resourceType as ResourceType;
        const newAmount = Math.min(
          resources.current[type] + amount,
          resources.capacity[type],
        );
        const actualAdded = newAmount - resources.current[type];

        resources.current[type] = newAmount;

        // Log transaction
        transactionHistory.value.push({
          playerId,
          resourceType: type,
          amount: actualAdded,
          reason,
          turnNumber,
          timestamp: new Date(),
        });

        // Check for overflow
        if (actualAdded < amount) {
          console.warn(
            `Resource overflow: ${playerId} lost ${amount - actualAdded} ${type} (capacity reached)`,
          );
        }
      }
    }
  }

  /**
   * Spend resources from player
   */
  function spendResources(
    playerId: PlayerId,
    cost: ResourceCost,
    reason: string,
    turnNumber: number,
  ): boolean {
    const resources = playerResources.value.get(playerId);
    if (!resources) return false;

    // Check if player can afford
    const canAfford = checkCanAfford(playerId, cost);
    if (!canAfford.canAfford) {
      return false;
    }

    // Deduct resources
    for (const [resourceType, amount] of Object.entries(cost)) {
      if (amount && amount > 0) {
        const type = resourceType as ResourceType;
        resources.current[type] -= amount;

        // Log transaction
        transactionHistory.value.push({
          playerId,
          resourceType: type,
          amount: -amount,
          reason,
          turnNumber,
          timestamp: new Date(),
        });
      }
    }

    return true;
  }

  /**
   * Check if player can afford cost
   */
  function checkCanAfford(playerId: PlayerId, cost: ResourceCost): ResourceCheck {
    const resources = playerResources.value.get(playerId);

    if (!resources) {
      return {
        canAfford: false,
        cost,
      };
    }

    const missing: ResourceDelta = {};
    let canAfford = true;

    for (const [resourceType, amount] of Object.entries(cost)) {
      if (amount && amount > 0) {
        const type = resourceType as ResourceType;
        const current = resources.current[type];

        if (current < amount) {
          canAfford = false;
          missing[type] = amount - current;
        }
      }
    }

    return {
      canAfford,
      missing: canAfford ? undefined : missing,
      cost,
    };
  }

  /**
   * Set resource production rate
   */
  function setProduction(playerId: PlayerId, resourceType: ResourceType, amount: number): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    resources.production[resourceType] = Math.max(0, amount);
    recalculateNetProduction(playerId);
  }

  /**
   * Add to resource production rate
   */
  function addProduction(playerId: PlayerId, resourceType: ResourceType, amount: number): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    resources.production[resourceType] += amount;
    recalculateNetProduction(playerId);
  }

  /**
   * Set resource consumption rate
   */
  function setConsumption(playerId: PlayerId, resourceType: ResourceType, amount: number): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    resources.consumption[resourceType] = Math.max(0, amount);
    recalculateNetProduction(playerId);
  }

  /**
   * Add to resource consumption rate
   */
  function addConsumption(playerId: PlayerId, resourceType: ResourceType, amount: number): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    resources.consumption[resourceType] += amount;
    recalculateNetProduction(playerId);
  }

  /**
   * Recalculate net production (production - consumption)
   */
  function recalculateNetProduction(playerId: PlayerId): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    for (const type of Object.values(ResourceTypeEnum)) {
      resources.netProduction[type] =
        resources.production[type] - resources.consumption[type];
    }
  }

  /**
   * Apply turn production (called at turn end)
   */
  function applyTurnProduction(playerId: PlayerId, turnNumber: number): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    for (const type of Object.values(ResourceTypeEnum)) {
      const netProduction = resources.netProduction[type];

      if (netProduction > 0) {
        addResources(playerId, { [type]: netProduction }, 'Turn production', turnNumber);
      } else if (netProduction < 0) {
        // Handle negative production (consumption exceeds production)
        const deficit = Math.abs(netProduction);
        const current = resources.current[type];

        if (current >= deficit) {
          spendResources(playerId, { [type]: deficit }, 'Turn consumption', turnNumber);
        } else {
          // Not enough resources to cover consumption
          resources.current[type] = 0;
          console.warn(
            `${playerId} ran out of ${type}! Deficit: ${deficit - current}`,
          );
        }
      }
    }
  }

  /**
   * Increase storage capacity
   */
  function increaseCapacity(playerId: PlayerId, resourceType: ResourceType, amount: number): void {
    const resources = playerResources.value.get(playerId);
    if (!resources) return;

    resources.capacity[resourceType] += amount;
  }

  /**
   * Get net production for a resource
   */
  function getNetProduction(playerId: PlayerId, resourceType: ResourceType): number {
    const resources = playerResources.value.get(playerId);
    return resources?.netProduction[resourceType] || 0;
  }

  /**
   * Check if resources are at capacity
   */
  function isAtCapacity(playerId: PlayerId, resourceType: ResourceType): boolean {
    const resources = playerResources.value.get(playerId);
    if (!resources) return false;

    return resources.current[resourceType] >= resources.capacity[resourceType];
  }

  /**
   * Get capacity utilization percentage
   */
  function getCapacityUtilization(playerId: PlayerId, resourceType: ResourceType): number {
    const resources = playerResources.value.get(playerId);
    if (!resources) return 0;

    return (resources.current[resourceType] / resources.capacity[resourceType]) * 100;
  }

  /**
   * Clear transaction history
   */
  function clearTransactionHistory(): void {
    transactionHistory.value = [];
  }

  /**
   * Reset resources store (new game)
   */
  function reset(): void {
    playerResources.value.clear();
    transactionHistory.value = [];
  }

  /**
   * Serialize resources store state for saving
   * Using the pattern of storing only values since playerId is embedded in PlayerResources
   */
  function serialize() {
    return {
      playerResources: Array.from(playerResources.value.values()),
      transactionHistory: [...transactionHistory.value],
    };
  }

  /**
   * Deserialize resources store state from save data
   * Reconstruct Map keys from embedded playerId property
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    playerResources.value = new Map(
      data.playerResources.map((resources) => [resources.playerId, resources])
    );
    transactionHistory.value = [...data.transactionHistory];
  }

  return {
    // Initialization
    initializePlayerResources,

    // Resource access
    getPlayerResources,
    getResourceAmount,
    getCurrentResources,

    // Resource modification
    addResources,
    spendResources,
    checkCanAfford,

    // Production/consumption
    setProduction,
    addProduction,
    setConsumption,
    addConsumption,
    recalculateNetProduction,
    applyTurnProduction,
    getNetProduction,

    // Capacity
    increaseCapacity,
    isAtCapacity,
    getCapacityUtilization,

    // History
    transactionHistory: computed(() => transactionHistory.value),
    clearTransactionHistory,

    // Utilities
    reset,
    serialize,
    deserialize,
  };
});
