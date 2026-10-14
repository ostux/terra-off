/**
 * Turn Management Store
 * Manages turn-based gameplay flow, action economy, and turn resolution
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  PlayerId,
  TurnPhase,
  PlayerAction,
  PlayerActionState,
  ActionBonus,
  ActionType,
  TurnHistoryEntry,
} from '@/data/types';
import { TurnPhase as TurnPhaseEnum, TurnOrderType } from '@/data/types';
import { ACTION_CONFIG, getActionCost, calculateMaxActions } from '@/data/config';

export const useTurnStore = defineStore('turn', () => {
  // Turn state
  const turnNumber = ref(1);
  const currentPlayerId = ref<PlayerId | null>(null);
  const phase = ref<TurnPhase>(TurnPhaseEnum.ACTION);
  const turnOrder = ref<PlayerId[]>([]);
  const _turnOrderType = ref(TurnOrderType.SEQUENTIAL);
  const turnStartedAt = ref(new Date());

  // Action states per player
  const playerActionStates = ref(new Map<PlayerId, PlayerActionState>());

  // Queued actions for current turn
  const queuedActions = ref<PlayerAction[]>([]);

  // Turn history
  const turnHistory = ref<TurnHistoryEntry[]>([]);

  /**
   * Initialize turn system
   */
  function initializeTurnSystem(players: PlayerId[], startingPlayer?: PlayerId): void {
    turnNumber.value = 1;
    turnOrder.value = [...players];
    currentPlayerId.value = startingPlayer || players[0] || null;
    phase.value = TurnPhaseEnum.ACTION;
    turnStartedAt.value = new Date();
    queuedActions.value = [];

    // Initialize action states for all players
    for (const playerId of players) {
      playerActionStates.value.set(playerId, {
        playerId,
        baseActionsPerTurn: ACTION_CONFIG.BASE_ACTIONS_PER_TURN,
        bonuses: [],
        maxActionsPerTurn: ACTION_CONFIG.BASE_ACTIONS_PER_TURN,
        actionsRemaining: ACTION_CONFIG.BASE_ACTIONS_PER_TURN,
        actionsTaken: [],
      });
    }
  }

  /**
   * Get action state for a player
   */
  function getPlayerActionState(playerId: PlayerId): PlayerActionState | null {
    return playerActionStates.value.get(playerId) || null;
  }

  /**
   * Get current player's action state
   */
  const currentPlayerActionState = computed(() => {
    if (!currentPlayerId.value) return null;
    return playerActionStates.value.get(currentPlayerId.value) || null;
  });

  /**
   * Get actions remaining for current player
   */
  const actionsRemaining = computed(() => {
    return currentPlayerActionState.value?.actionsRemaining || 0;
  });

  /**
   * Get max actions for current player
   */
  const maxActions = computed(() => {
    return currentPlayerActionState.value?.maxActionsPerTurn || 0;
  });

  /**
   * Check if player can take action
   */
  function canTakeAction(playerId: PlayerId, actionType: ActionType): boolean {
    const actionState = playerActionStates.value.get(playerId);
    if (!actionState) return false;

    const cost = getActionCost(actionType);
    return actionState.actionsRemaining >= cost;
  }

  /**
   * Spend actions for a player
   */
  function spendActions(playerId: PlayerId, actionType: ActionType, count = 1): boolean {
    const actionState = playerActionStates.value.get(playerId);
    if (!actionState) return false;

    const totalCost = getActionCost(actionType) * count;

    if (actionState.actionsRemaining < totalCost) {
      return false;
    }

    actionState.actionsRemaining -= totalCost;
    return true;
  }

  /**
   * Add action bonus to player (from research/building)
   */
  function addActionBonus(playerId: PlayerId, bonus: ActionBonus): void {
    const actionState = playerActionStates.value.get(playerId);
    if (!actionState) return;

    // Check if bonus already exists
    const existingBonus = actionState.bonuses.find((b) => b.sourceId === bonus.sourceId);
    if (existingBonus) return;

    actionState.bonuses.push(bonus);

    // Recalculate max actions
    const totalBonuses = actionState.bonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
    actionState.maxActionsPerTurn = calculateMaxActions(totalBonuses);

    // Grant additional actions immediately if mid-turn
    if (phase.value === TurnPhaseEnum.ACTION && currentPlayerId.value === playerId) {
      actionState.actionsRemaining += bonus.bonusAmount;
    }
  }

  /**
   * Remove action bonus from player
   */
  function removeActionBonus(playerId: PlayerId, sourceId: string): void {
    const actionState = playerActionStates.value.get(playerId);
    if (!actionState) return;

    const bonusIndex = actionState.bonuses.findIndex((b) => b.sourceId === sourceId);
    if (bonusIndex === -1) return;

    actionState.bonuses.splice(bonusIndex, 1);

    // Recalculate max actions
    const totalBonuses = actionState.bonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
    actionState.maxActionsPerTurn = calculateMaxActions(totalBonuses);
  }

  /**
   * Queue an action for current turn
   */
  function queueAction(action: PlayerAction): void {
    queuedActions.value.push(action);

    // Add to player's actions taken
    const actionState = playerActionStates.value.get(action.playerId);
    if (actionState) {
      actionState.actionsTaken.push(action);
    }
  }

  /**
   * Get queued actions for current turn
   */
  function getQueuedActions(): PlayerAction[] {
    return [...queuedActions.value];
  }

  /**
   * Clear queued actions
   */
  function clearQueuedActions(): void {
    queuedActions.value = [];
  }

  /**
   * Start new turn
   */
  function startTurn(playerId: PlayerId): void {
    currentPlayerId.value = playerId;
    phase.value = TurnPhaseEnum.ACTION;
    turnStartedAt.value = new Date();

    // Reset actions for current player
    const actionState = playerActionStates.value.get(playerId);
    if (actionState) {
      actionState.actionsRemaining = actionState.maxActionsPerTurn;
      actionState.actionsTaken = [];
    }
  }

  /**
   * End current turn and move to next player
   */
  async function endTurn(): Promise<void> {
    if (!currentPlayerId.value) return;

    // Set phase to resolution
    phase.value = TurnPhaseEnum.RESOLUTION;

    // Import stores dynamically to avoid circular dependencies
    const { useResourcesStore } = await import('@/stores/game/resources');
    const { useBuildingsStore } = await import('@/stores/game/buildings');
    const { usePeasantsStore } = await import('@/stores/game/peasants');
    const { calculatePlayerProduction } = await import('@/game/engine/production-integrator');
    const { getBuildingById } = await import('@/data/buildings');

    const resourceStore = useResourcesStore();
    const buildingsStore = useBuildingsStore();
    const peasantsStore = usePeasantsStore();

    // Process turn resolution
    // 1. Calculate and update production from buildings
    const productionBuildings = buildingsStore.getProductionBuildings(currentPlayerId.value);
    const buildingsWithAllocations = productionBuildings.map(({ building, definition }) => {
      const allocation = peasantsStore.getAllocation(currentPlayerId.value!, building.entityId);
      return {
        building,
        definition,
        peasantAllocation: allocation?.peasantCount || 0,
      };
    });

    // Calculate actual production from buildings
    const actualProduction = calculatePlayerProduction(buildingsWithAllocations);

    // Import ResourceType for proper enum usage
    const { ResourceType } = await import('@/data/types');

    // Update resource production rates
    resourceStore.setProduction(currentPlayerId.value, ResourceType.FOOD, actualProduction.FOOD);
    resourceStore.setProduction(currentPlayerId.value, ResourceType.WOOD, actualProduction.WOOD);
    resourceStore.setProduction(currentPlayerId.value, ResourceType.STONE, actualProduction.STONE);
    resourceStore.setProduction(currentPlayerId.value, ResourceType.IRON, actualProduction.IRON);

    // 2. Apply resource production for current player
    resourceStore.applyTurnProduction(currentPlayerId.value, turnNumber.value);

    // 3. Progress construction queue
    const completedBuildings = buildingsStore.progressConstruction(turnNumber.value);

    // 4. Add peasant sources for newly completed infrastructure buildings
    for (const building of completedBuildings) {
      const buildingDef = getBuildingById(building.buildingId);

      if (buildingDef?.peasantGeneration) {
        peasantsStore.addPeasantSource(
          building.playerId,
          building.entityId,
          building.buildingId,
          building.coordinates,
          buildingDef.peasantGeneration
        );
      }
    }

    // After a brief delay (for UI feedback), advance to next player
    setTimeout(() => {
      completeTurnResolution();
    }, 500);
  }

  /**
   * Advance to next player in turn order
   */
  function advanceToNextPlayer(): void {
    if (!currentPlayerId.value || turnOrder.value.length === 0) return;

    const currentIndex = turnOrder.value.indexOf(currentPlayerId.value);
    const nextIndex = (currentIndex + 1) % turnOrder.value.length;

    // If we wrapped around, increment turn number
    if (nextIndex === 0) {
      turnNumber.value++;
    }

    startTurn(turnOrder.value[nextIndex]!);
  }

  /**
   * Complete turn resolution and start next turn
   */
  async function completeTurnResolution(): Promise<void> {
    // Clear queued actions
    clearQueuedActions();

    // Advance to next player
    advanceToNextPlayer();

    // Auto-save after turn resolution
    try {
      const { useGameStore } = await import('@/stores/game');
      const gameStore = useGameStore();
      await gameStore.saveGame();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Add player to turn order
   */
  function addPlayer(playerId: PlayerId): void {
    if (turnOrder.value.includes(playerId)) return;

    turnOrder.value.push(playerId);

    // Initialize action state
    playerActionStates.value.set(playerId, {
      playerId,
      baseActionsPerTurn: ACTION_CONFIG.BASE_ACTIONS_PER_TURN,
      bonuses: [],
      maxActionsPerTurn: ACTION_CONFIG.BASE_ACTIONS_PER_TURN,
      actionsRemaining: ACTION_CONFIG.BASE_ACTIONS_PER_TURN,
      actionsTaken: [],
    });
  }

  /**
   * Remove player from turn order
   */
  function removePlayer(playerId: PlayerId): void {
    const index = turnOrder.value.indexOf(playerId);
    if (index === -1) return;

    turnOrder.value.splice(index, 1);
    playerActionStates.value.delete(playerId);

    // If removed player was current, advance to next
    if (currentPlayerId.value === playerId) {
      advanceToNextPlayer();
    }
  }

  /**
   * Get turn statistics
   */
  const turnStats = computed(() => {
    return {
      currentTurn: turnNumber.value,
      currentPlayer: currentPlayerId.value,
      phase: phase.value,
      playersInGame: turnOrder.value.length,
      actionsQueuedThisTurn: queuedActions.value.length,
    };
  });

  /**
   * Reset turn store (new game)
   */
  function reset(): void {
    turnNumber.value = 1;
    currentPlayerId.value = null;
    phase.value = TurnPhaseEnum.ACTION;
    turnOrder.value = [];
    turnStartedAt.value = new Date();
    playerActionStates.value.clear();
    queuedActions.value = [];
    turnHistory.value = [];
  }

  /**
   * Serialize turn store state for saving
   * Using the pattern of storing only values since playerId is embedded in PlayerActionState
   */
  function serialize() {
    return {
      turnNumber: turnNumber.value,
      currentPlayerId: currentPlayerId.value,
      phase: phase.value,
      turnOrder: [...turnOrder.value],
      turnStartedAt: turnStartedAt.value.toISOString(),
      playerActionStates: Array.from(playerActionStates.value.values()),
      queuedActions: [...queuedActions.value],
      turnHistory: [...turnHistory.value],
    };
  }

  /**
   * Deserialize turn store state from save data
   * Reconstruct Map keys from embedded playerId property
   */
  function deserialize(data: ReturnType<typeof serialize>): void {
    turnNumber.value = data.turnNumber;
    currentPlayerId.value = data.currentPlayerId;
    phase.value = data.phase;
    turnOrder.value = [...data.turnOrder];
    turnStartedAt.value = new Date(data.turnStartedAt);
    playerActionStates.value = new Map(
      data.playerActionStates.map((state) => [state.playerId, state])
    );
    queuedActions.value = [...data.queuedActions];
    turnHistory.value = [...data.turnHistory];
  }

  return {
    // State
    turnNumber: computed(() => turnNumber.value),
    currentPlayerId: computed(() => currentPlayerId.value),
    phase: computed(() => phase.value),
    turnOrder: computed(() => turnOrder.value),
    turnStartedAt: computed(() => turnStartedAt.value),
    currentPlayerActionState,
    actionsRemaining,
    maxActions,
    turnStats,

    // Initialization
    initializeTurnSystem,

    // Turn management
    startTurn,
    endTurn,
    advanceToNextPlayer,
    completeTurnResolution,

    // Action management
    canTakeAction,
    spendActions,
    addActionBonus,
    removeActionBonus,
    getPlayerActionState,

    // Action queue
    queueAction,
    getQueuedActions,
    clearQueuedActions,

    // Player management
    addPlayer,
    removePlayer,

    // Utilities
    reset,
    serialize,
    deserialize,
  };
});
