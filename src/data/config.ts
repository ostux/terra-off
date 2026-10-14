/**
 * Game Configuration
 * All game constants and configurable values
 *
 * IMPORTANT: NO VALUES SHOULD BE HARD-CODED IN GAME LOGIC
 * All game constants must be defined here for easy balancing
 */

import { ActionType } from './types/action.types';

/**
 * ====================================
 * ACTION SYSTEM CONFIGURATION
 * ====================================
 */
export const ACTION_CONFIG = {
  /** Base number of actions per turn for each player */
  BASE_ACTIONS_PER_TURN: 5,

  /** Maximum actions per turn (cap to prevent infinite scaling) */
  MAX_ACTIONS_PER_TURN: 20,

  /** Action costs by type */
  ACTION_COSTS: {
    [ActionType.BUILD]: 1,
    [ActionType.DEMOLISH]: 1,
    [ActionType.TRAIN]: 1,
    [ActionType.MOVE]: 1,
    [ActionType.ATTACK]: 1,
    [ActionType.RESEARCH]: 1,
    [ActionType.UPGRADE]: 1,
    [ActionType.ALLOCATE_PEASANTS]: 0, // FREE - no action cost
  } as const,
} as const;

/**
 * ====================================
 * VISION & FOG OF WAR CONFIGURATION
 * ====================================
 */
export const VISION_CONFIG = {
  /** Default vision radius for buildings and units */
  DEFAULT_VISION_RADIUS: 3,

  /** Buffer zone for tile generation beyond visible area */
  TILE_GENERATION_BUFFER: 2,

  /** Fog of war transition animation duration (ms) */
  FOG_TRANSITION_DURATION_MS: 300,
} as const;

/**
 * ====================================
 * MAP GENERATION CONFIGURATION
 * ====================================
 */
export const MAP_CONFIG = {
  /** Maximum number of tiles to keep loaded in memory */
  MAX_LOADED_TILES: 10000,

  /** Distance from vision to unload tiles */
  TILE_UNLOAD_DISTANCE: 20,

  /** Terrain type probabilities (must sum to 1.0) */
  TERRAIN_PROBABILITIES: {
    GRASSLAND: 0.4,
    FOREST: 0.25,
    MOUNTAIN: 0.15,
    WATER: 0.1,
    WASTELAND: 0.05,
    DESERT: 0.05,
  } as const,

  /** Resource deposit probabilities by terrain */
  RESOURCE_DEPOSIT_PROBABILITY: {
    GRASSLAND: 0.15,
    FOREST: 0.3,
    MOUNTAIN: 0.4,
    WATER: 0.0,
    WASTELAND: 0.05,
    DESERT: 0.1,
  } as const,
} as const;

/**
 * ====================================
 * PEASANT SYSTEM CONFIGURATION
 * ====================================
 */
export const PEASANT_CONFIG = {
  /** Minimum peasants needed for any production (below this = 0% production) */
  MINIMUM_PEASANTS_FOR_PRODUCTION: 3,

  /** Production multiplier cap (max efficiency) */
  MAX_PRODUCTION_MULTIPLIER: 5.0, // 500%

  /** Minimum efficiency threshold (below 50% of required = 0% production) */
  MINIMUM_EFFICIENCY_THRESHOLD: 0.5,
} as const;

/**
 * ====================================
 * RESOURCE SYSTEM CONFIGURATION
 * ====================================
 */
export const RESOURCE_CONFIG = {
  /** Starting resources for new players */
  STARTING_RESOURCES: {
    FOOD: 100,
    WOOD: 100,
    STONE: 50,
    IRON: 0,
  } as const,

  /** Default storage capacity for resources */
  DEFAULT_STORAGE_CAPACITY: {
    FOOD: 1000,
    WOOD: 1000,
    STONE: 1000,
    IRON: 500,
  } as const,

  /** Storage capacity increase per warehouse level */
  STORAGE_CAPACITY_PER_WAREHOUSE_LEVEL: 500,
} as const;

/**
 * ====================================
 * TURN SYSTEM CONFIGURATION
 * ====================================
 */
export const TURN_CONFIG = {
  /** Turn timer enabled by default */
  TURN_TIMER_ENABLED: false,

  /** Default turn duration in seconds */
  TURN_DURATION_SECONDS: 300, // 5 minutes

  /** Show warning when X seconds remain */
  TURN_WARNING_SECONDS: 60, // 1 minute

  /** Turn order type */
  TURN_ORDER_TYPE: 'SEQUENTIAL' as const,
} as const;

/**
 * ====================================
 * SAVE/LOAD CONFIGURATION
 * ====================================
 */
export const SAVE_CONFIG = {
  /** Save to localStorage after each action */
  AUTO_SAVE_AFTER_ACTION: true,

  /** Save to localStorage at turn end */
  AUTO_SAVE_AT_TURN_END: true,

  /** localStorage key prefix for saves */
  SAVE_KEY_PREFIX: 'terra-off',

  /** Current save format version (for migrations) */
  SAVE_VERSION: 1,

  /** Number of save slots available */
  MAX_SAVE_SLOTS: 5,

  /** Auto-save slot (separate from manual saves) */
  AUTO_SAVE_SLOT: 'auto',

  /** Enable save compression (requires lz-string library) */
  ENABLE_COMPRESSION: false,

  /** Backup previous save before overwriting */
  KEEP_SAVE_BACKUP: true,
} as const;

/**
 * ====================================
 * COMBAT CONFIGURATION
 * ====================================
 */
export const COMBAT_CONFIG = {
  /** Base combat calculation randomness factor */
  COMBAT_RANDOMNESS: 0.1, // ±10%

  /** Wall defense bonus multiplier */
  WALL_DEFENSE_BONUS: 1.5, // +50% defense

  /** Archer wall defense bonus (additional) */
  ARCHER_WALL_DEFENSE_BONUS: 3, // +3 defense on walls

  /** Spearman anti-cavalry bonus */
  SPEARMAN_VS_CAVALRY_BONUS: 1.5, // +50% damage vs cavalry

  /** Veterancy gain per combat victory */
  VETERANCY_GAIN_PER_WIN: 1,

  /** Max veterancy level */
  MAX_VETERANCY_LEVEL: 5,

  /** Attack bonus per veterancy level */
  ATTACK_BONUS_PER_VETERANCY: 1,

  /** Defense bonus per veterancy level */
  DEFENSE_BONUS_PER_VETERANCY: 1,
} as const;

/**
 * ====================================
 * SETTLEMENT CONFIGURATION
 * ====================================
 */
export const SETTLEMENT_CONFIG = {
  /** Minimum wall loop perimeter for valid settlement */
  MIN_SETTLEMENT_PERIMETER: 8,

  /** Maximum wall loop perimeter (prevent performance issues) */
  MAX_SETTLEMENT_PERIMETER: 200,

  /** Village bonuses (wood walls) */
  VILLAGE_BONUSES: {
    RESOURCE_PRODUCTION_MULTIPLIER: 1.1, // +10% production
    PEASANT_CAPACITY_BONUS: 5,
    VISION_BONUS: 1,
  } as const,

  /** City bonuses (stone walls) */
  CITY_BONUSES: {
    RESOURCE_PRODUCTION_MULTIPLIER: 1.25, // +25% production
    PEASANT_CAPACITY_BONUS: 15,
    VISION_BONUS: 2,
    SOLDIER_CAPACITY_BONUS: 10,
  } as const,
} as const;

/**
 * ====================================
 * UI CONFIGURATION
 * ====================================
 */
export const UI_CONFIG = {
  /** Minimum touch target size (pixels) */
  MIN_TOUCH_TARGET_SIZE: 44,

  /** Show "Game Saved" indicator duration (ms) */
  SAVE_INDICATOR_DURATION_MS: 2000,

  /** Animation durations */
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  } as const,

  /** Grid zoom levels */
  ZOOM_LEVELS: {
    MIN: 0.5,
    MAX: 3.0,
    DEFAULT: 1.0,
    STEP: 0.1,
  } as const,
} as const;

/**
 * ====================================
 * RESEARCH CONFIGURATION
 * ====================================
 */
export const RESEARCH_CONFIG = {
  /** Example research that increases actions per turn */
  ACTION_BONUS_RESEARCH: {
    ADMINISTRATION_I: {
      actionBonus: 1,
      cost: { FOOD: 100, WOOD: 50 },
      turns: 5,
    },
    ADMINISTRATION_II: {
      actionBonus: 1,
      cost: { FOOD: 200, WOOD: 100, STONE: 50 },
      turns: 8,
      prerequisite: 'ADMINISTRATION_I',
    },
    EFFICIENT_MANAGEMENT: {
      actionBonus: 2,
      cost: { FOOD: 500, WOOD: 300, STONE: 200, IRON: 100 },
      turns: 12,
      prerequisite: 'ADMINISTRATION_II',
    },
  } as const,
} as const;

/**
 * ====================================
 * BUILDING CONFIGURATION
 * ====================================
 */
export const BUILDING_CONFIG = {
  /** Building upgrade costs multiply by this factor per level */
  UPGRADE_COST_MULTIPLIER: 1.5,

  /** Building demolition refund percentage */
  DEMOLITION_REFUND_PERCENTAGE: 0.5, // 50% refund

  /** Construction cancel refund percentage */
  CONSTRUCTION_CANCEL_REFUND: 0.75, // 75% refund

  /** Example buildings that grant action bonuses */
  ACTION_BONUS_BUILDINGS: {
    TOWN_HALL: {
      actionBonusPerLevel: 1, // +1 action per upgrade level
      maxLevel: 5,
    },
    COMMAND_CENTER: {
      actionBonus: 2, // Flat +2 actions when built
    },
  } as const,
} as const;

/**
 * ====================================
 * PERFORMANCE CONFIGURATION
 * ====================================
 */
export const PERFORMANCE_CONFIG = {
  /** Enable Web Workers for heavy computation */
  USE_WEB_WORKERS: true,

  /** Viewport culling - only render tiles within this distance from view */
  VIEWPORT_CULLING_DISTANCE: 5,

  /** Batch size for tile generation */
  TILE_GENERATION_BATCH_SIZE: 100,

  /** Debounce delay for expensive operations (ms) */
  DEBOUNCE_DELAY_MS: 250,
} as const;

/**
 * ====================================
 * DEVELOPMENT CONFIGURATION
 * ====================================
 */
export const DEV_CONFIG = {
  /** Enable debug mode */
  DEBUG_MODE: import.meta.env.DEV,

  /** Show debug overlays */
  SHOW_DEBUG_OVERLAY: import.meta.env.DEV,

  /** Log save/load operations */
  LOG_SAVE_OPERATIONS: import.meta.env.DEV,

  /** Enable cheat commands */
  ENABLE_CHEATS: import.meta.env.DEV,
} as const;

/**
 * Get action cost for a specific action type
 */
export function getActionCost(actionType: ActionType): number {
  return ACTION_CONFIG.ACTION_COSTS[actionType];
}

/**
 * Get max actions per turn including bonuses
 */
export function calculateMaxActions(bonuses: number): number {
  const total = ACTION_CONFIG.BASE_ACTIONS_PER_TURN + bonuses;
  return Math.min(total, ACTION_CONFIG.MAX_ACTIONS_PER_TURN);
}

/**
 * Calculate peasant production efficiency
 */
export function calculatePeasantEfficiency(
  allocated: number,
  required: number,
): number {
  if (allocated < required * PEASANT_CONFIG.MINIMUM_EFFICIENCY_THRESHOLD) {
    return 0;
  }
  const multiplier = allocated / required;
  return Math.min(multiplier, PEASANT_CONFIG.MAX_PRODUCTION_MULTIPLIER);
}
