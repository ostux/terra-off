/**
 * Unit Definitions - Complete Starting Set
 * All combat units with stats, costs, and special properties
 */

import type { BuildingCost } from './buildings';

export enum UnitCategory {
  LIGHT_INFANTRY = 'LIGHT_INFANTRY',
  HEAVY_INFANTRY = 'HEAVY_INFANTRY',
  RANGED = 'RANGED',
  CAVALRY = 'CAVALRY',
  SCOUT = 'SCOUT',
}

export interface UnitDefinition {
  id: string;
  nameKey: string; // i18n key for display name
  descriptionKey: string; // i18n key for description
  category: UnitCategory;

  // Training
  trainingCost: BuildingCost;
  trainingTurns: number;
  trainedAt: string[]; // Building IDs where this unit can be trained

  // Combat stats
  attack: number;
  defense: number;

  // Movement
  movementPointsPerTurn: number;
  isMounted: boolean; // TRUE for cavalry (cannot stand on walls!)

  // Upkeep
  upkeepPerTurn: BuildingCost; // Resources consumed each turn

  // Vision
  visionRadius: number;

  // Special abilities
  bonusVsUnitCategory?: UnitCategory; // Deals extra damage to this unit type
  bonusOnWalls?: boolean; // Gets bonus when stationed on walls (archers)
  bonusDefense?: number; // Extra defense points (for defensive units)
  bonusAttack?: number; // Extra attack points (for offensive units)
}

// =============================================================================
// INFANTRY UNITS (Basic Combat)
// =============================================================================

export const WARRIOR: UnitDefinition = {
  id: 'warrior',
  nameKey: 'unit.warrior.name',
  descriptionKey: 'unit.warrior.description',
  category: UnitCategory.LIGHT_INFANTRY,
  trainingCost: {
    FOOD: 10,
    WOOD: 5,
  },
  trainingTurns: 2,
  trainedAt: ['barracks'],
  attack: 10,
  defense: 8,
  movementPointsPerTurn: 3,
  isMounted: false,
  upkeepPerTurn: {
    FOOD: 2,
  },
  visionRadius: 3,
};

export const SPEARMAN: UnitDefinition = {
  id: 'spearman',
  nameKey: 'unit.spearman.name',
  descriptionKey: 'unit.spearman.description',
  category: UnitCategory.LIGHT_INFANTRY,
  trainingCost: {
    FOOD: 10,
    WOOD: 5,
  },
  trainingTurns: 2,
  trainedAt: ['barracks'],
  attack: 8,
  defense: 10,
  movementPointsPerTurn: 3,
  isMounted: false,
  upkeepPerTurn: {
    FOOD: 2,
  },
  visionRadius: 3,
  bonusVsUnitCategory: UnitCategory.CAVALRY, // Anti-cavalry specialist
  bonusDefense: 2, // Extra defensive bonus
};

export const SWORDSMAN: UnitDefinition = {
  id: 'swordsman',
  nameKey: 'unit.swordsman.name',
  descriptionKey: 'unit.swordsman.description',
  category: UnitCategory.HEAVY_INFANTRY,
  trainingCost: {
    FOOD: 15,
    WOOD: 8,
    IRON: 4,
  },
  trainingTurns: 3,
  trainedAt: ['barracks'],
  attack: 12,
  defense: 9,
  movementPointsPerTurn: 2,
  isMounted: false,
  upkeepPerTurn: {
    FOOD: 3,
  },
  visionRadius: 3,
  bonusAttack: 2, // Offensive powerhouse
};

// =============================================================================
// RANGED UNITS (Archers)
// =============================================================================

export const ARCHER: UnitDefinition = {
  id: 'archer',
  nameKey: 'unit.archer.name',
  descriptionKey: 'unit.archer.description',
  category: UnitCategory.RANGED,
  trainingCost: {
    FOOD: 10,
    WOOD: 8,
  },
  trainingTurns: 2,
  trainedAt: ['archery_range'],
  attack: 9,
  defense: 5,
  movementPointsPerTurn: 3,
  isMounted: false,
  upkeepPerTurn: {
    FOOD: 2,
  },
  visionRadius: 4,
  bonusOnWalls: true, // Gets attack bonus when on walls
};

// =============================================================================
// CAVALRY UNITS (Mounted, Fast, Cannot Stand on Walls!)
// =============================================================================

export const HORSEMAN: UnitDefinition = {
  id: 'horseman',
  nameKey: 'unit.horseman.name',
  descriptionKey: 'unit.horseman.description',
  category: UnitCategory.CAVALRY,
  trainingCost: {
    FOOD: 20,
    WOOD: 15,
  },
  trainingTurns: 4,
  trainedAt: ['stable'],
  attack: 11,
  defense: 7,
  movementPointsPerTurn: 5,
  isMounted: true, // CRITICAL: Cannot be placed on walls!
  upkeepPerTurn: {
    FOOD: 4,
  },
  visionRadius: 4,
  bonusVsUnitCategory: UnitCategory.RANGED, // Good against archers
};

// =============================================================================
// SCOUT UNITS (Exploration, High Vision)
// =============================================================================

export const SCOUT: UnitDefinition = {
  id: 'scout',
  nameKey: 'unit.scout.name',
  descriptionKey: 'unit.scout.description',
  category: UnitCategory.SCOUT,
  trainingCost: {
    FOOD: 8,
  },
  trainingTurns: 1,
  trainedAt: ['training_ground'],
  attack: 4,
  defense: 4,
  movementPointsPerTurn: 6,
  isMounted: false,
  upkeepPerTurn: {
    FOOD: 1,
  },
  visionRadius: 6, // Best vision for exploration!
};

// =============================================================================
// UNIT REGISTRY
// =============================================================================

export const ALL_UNITS: UnitDefinition[] = [
  // Infantry (3)
  WARRIOR,
  SPEARMAN,
  SWORDSMAN,

  // Ranged (1)
  ARCHER,

  // Cavalry (1)
  HORSEMAN,

  // Scout (1)
  SCOUT,
];

export const UNITS_BY_ID: Record<string, UnitDefinition> = ALL_UNITS.reduce(
  (acc, unit) => {
    acc[unit.id] = unit;
    return acc;
  },
  {} as Record<string, UnitDefinition>,
);

export const UNITS_BY_CATEGORY: Record<UnitCategory, UnitDefinition[]> = ALL_UNITS.reduce(
  (acc, unit) => {
    if (!acc[unit.category]) {
      acc[unit.category] = [];
    }
    acc[unit.category].push(unit);
    return acc;
  },
  {} as Record<UnitCategory, UnitDefinition[]>,
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getUnitById(id: string): UnitDefinition | undefined {
  return UNITS_BY_ID[id];
}

export function getUnitsByCategory(category: UnitCategory): UnitDefinition[] {
  return UNITS_BY_CATEGORY[category] || [];
}

export function getUnitsTrainedAt(buildingId: string): UnitDefinition[] {
  return ALL_UNITS.filter((unit) => unit.trainedAt.includes(buildingId));
}

export function canUnitBeStationedOnBuilding(unitId: string, _buildingId: string): boolean {
  const unit = getUnitById(unitId);
  if (!unit) {
    return false;
  }

  // Import building check (avoids circular dependency by using function from buildings.ts)
  // This will be called from building-placer.ts or soldier-manager.ts
  return !unit.isMounted; // Simplified check - mounted units can't go on walls
}

// =============================================================================
// COMBAT CALCULATIONS (Basic)
// =============================================================================

export function calculateCombatPower(
  unitId: string,
  isAttacking: boolean,
  isOnWall: boolean = false,
): number {
  const unit = getUnitById(unitId);
  if (!unit) {
    return 0;
  }

  let power = isAttacking ? unit.attack : unit.defense;

  // Apply bonuses
  if (unit.bonusOnWalls && isOnWall && !isAttacking) {
    power += 3; // Archers get +3 defense on walls
  }

  if (isAttacking && unit.bonusAttack) {
    power += unit.bonusAttack;
  }

  if (!isAttacking && unit.bonusDefense) {
    power += unit.bonusDefense;
  }

  return power;
}
