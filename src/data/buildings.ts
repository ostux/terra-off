/**
 * Building Definitions - Complete Starting Set
 * All buildings with stats, costs, requirements, and special properties
 */

import { TerrainType } from './types';

export enum BuildingCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  PRODUCTION = 'PRODUCTION',
  MILITARY = 'MILITARY',
  WALL = 'WALL',
  GATE = 'GATE',
}

export enum ResourceType {
  FOOD = 'FOOD',
  WOOD = 'WOOD',
  STONE = 'STONE',
  IRON = 'IRON',
}

export interface BuildingCost {
  [ResourceType.FOOD]?: number;
  [ResourceType.WOOD]?: number;
  [ResourceType.STONE]?: number;
  [ResourceType.IRON]?: number;
}

export interface BuildingProduction {
  resourceType: ResourceType;
  amountPerTurn: number; // At 100% efficiency (with required peasants)
}

export interface BuildingDefinition {
  id: string;
  nameKey: string; // i18n key for display name
  descriptionKey: string; // i18n key for description
  category: BuildingCategory;
  cost: BuildingCost;
  constructionTurns: number;

  // Peasant system
  peasantRequirement?: number; // Even number for 100% production (0 = no peasants needed)
  peasantGeneration?: number; // For infrastructure buildings

  // Production
  production?: BuildingProduction;

  // Military
  canHoldSoldiers: boolean;
  soldierCapacity?: number;
  canHoldMountedUnits?: boolean; // FALSE for walls (cavalry can't stand on walls)
  trainsUnits?: string[]; // Unit IDs that can be trained here

  // Vision
  visionRadius: number;

  // Terrain system
  allowedTerrains?: TerrainType[]; // If specified, can only build on these terrains
  forbiddenTerrains?: TerrainType[]; // If specified, cannot build on these terrains
  terrainBonus?: Map<TerrainType, number>; // Production multiplier for specific terrains (e.g., 1.2 = +20%)

  // Special properties
  isWall?: boolean;
  isGate?: boolean;
  wallMaterial?: 'WOOD' | 'STONE'; // For settlement detection
}

// =============================================================================
// INFRASTRUCTURE BUILDINGS (Generate Peasants)
// =============================================================================

export const TENT: BuildingDefinition = {
  id: 'tent',
  nameKey: 'building.tent.name',
  descriptionKey: 'building.tent.description',
  category: BuildingCategory.INFRASTRUCTURE,
  cost: {
    [ResourceType.WOOD]: 5,
  },
  constructionTurns: 1,
  peasantGeneration: 3,
  canHoldSoldiers: false,
  visionRadius: 2,
  forbiddenTerrains: [TerrainType.WATER],
};

export const HUT: BuildingDefinition = {
  id: 'hut',
  nameKey: 'building.hut.name',
  descriptionKey: 'building.hut.description',
  category: BuildingCategory.INFRASTRUCTURE,
  cost: {
    [ResourceType.WOOD]: 20,
  },
  constructionTurns: 2,
  peasantGeneration: 8,
  canHoldSoldiers: false,
  visionRadius: 3,
  forbiddenTerrains: [TerrainType.WATER],
};

export const HOUSE: BuildingDefinition = {
  id: 'house',
  nameKey: 'building.house.name',
  descriptionKey: 'building.house.description',
  category: BuildingCategory.INFRASTRUCTURE,
  cost: {
    [ResourceType.WOOD]: 50,
    [ResourceType.STONE]: 20,
  },
  constructionTurns: 4,
  peasantGeneration: 20,
  canHoldSoldiers: false,
  visionRadius: 3,
  forbiddenTerrains: [TerrainType.WATER],
};

// =============================================================================
// PRODUCTION BUILDINGS (Generate Resources)
// =============================================================================

export const FARM: BuildingDefinition = {
  id: 'farm',
  nameKey: 'building.farm.name',
  descriptionKey: 'building.farm.description',
  category: BuildingCategory.PRODUCTION,
  cost: {
    [ResourceType.WOOD]: 30,
  },
  constructionTurns: 3,
  peasantRequirement: 6,
  production: {
    resourceType: ResourceType.FOOD,
    amountPerTurn: 10,
  },
  canHoldSoldiers: false,
  visionRadius: 3,
  forbiddenTerrains: [TerrainType.WATER],
  terrainBonus: new Map([[TerrainType.GRASSLAND, 1.2]]), // +20% on grassland
};

export const LUMBER_MILL: BuildingDefinition = {
  id: 'lumber_mill',
  nameKey: 'building.lumber_mill.name',
  descriptionKey: 'building.lumber_mill.description',
  category: BuildingCategory.PRODUCTION,
  cost: {
    [ResourceType.WOOD]: 20,
    [ResourceType.STONE]: 10,
  },
  constructionTurns: 3,
  peasantRequirement: 6,
  production: {
    resourceType: ResourceType.WOOD,
    amountPerTurn: 8,
  },
  canHoldSoldiers: false,
  visionRadius: 3,
  forbiddenTerrains: [TerrainType.WATER],
  terrainBonus: new Map([[TerrainType.FOREST, 1.2]]), // +20% on forest
};

export const QUARRY: BuildingDefinition = {
  id: 'quarry',
  nameKey: 'building.quarry.name',
  descriptionKey: 'building.quarry.description',
  category: BuildingCategory.PRODUCTION,
  cost: {
    [ResourceType.WOOD]: 40,
  },
  constructionTurns: 4,
  peasantRequirement: 8,
  production: {
    resourceType: ResourceType.STONE,
    amountPerTurn: 6,
  },
  canHoldSoldiers: false,
  visionRadius: 3,
  allowedTerrains: [TerrainType.MOUNTAIN], // Can only build on mountains
};

export const MINE: BuildingDefinition = {
  id: 'mine',
  nameKey: 'building.mine.name',
  descriptionKey: 'building.mine.description',
  category: BuildingCategory.PRODUCTION,
  cost: {
    [ResourceType.WOOD]: 50,
    [ResourceType.STONE]: 20,
  },
  constructionTurns: 5,
  peasantRequirement: 10,
  production: {
    resourceType: ResourceType.IRON,
    amountPerTurn: 4,
  },
  canHoldSoldiers: false,
  visionRadius: 3,
  allowedTerrains: [TerrainType.MOUNTAIN], // Can only build on mountains
};

// =============================================================================
// MILITARY BUILDINGS (Train Units, Hold Soldiers)
// =============================================================================

export const BARRACKS: BuildingDefinition = {
  id: 'barracks',
  nameKey: 'building.barracks.name',
  descriptionKey: 'building.barracks.description',
  category: BuildingCategory.MILITARY,
  cost: {
    [ResourceType.WOOD]: 60,
    [ResourceType.STONE]: 30,
  },
  constructionTurns: 5,
  canHoldSoldiers: true,
  canHoldMountedUnits: true, // Barracks can hold cavalry
  soldierCapacity: 15,
  trainsUnits: ['warrior', 'spearman', 'swordsman'], // Infantry units
  visionRadius: 3,
  forbiddenTerrains: [TerrainType.WATER],
};

export const ARCHERY_RANGE: BuildingDefinition = {
  id: 'archery_range',
  nameKey: 'building.archery_range.name',
  descriptionKey: 'building.archery_range.description',
  category: BuildingCategory.MILITARY,
  cost: {
    [ResourceType.WOOD]: 50,
    [ResourceType.STONE]: 20,
  },
  constructionTurns: 4,
  canHoldSoldiers: true,
  canHoldMountedUnits: false, // Archery range is for foot archers only
  soldierCapacity: 12,
  trainsUnits: ['archer'], // Ranged units
  visionRadius: 4, // Better vision for ranged building
  forbiddenTerrains: [TerrainType.WATER],
};

export const STABLE: BuildingDefinition = {
  id: 'stable',
  nameKey: 'building.stable.name',
  descriptionKey: 'building.stable.description',
  category: BuildingCategory.MILITARY,
  cost: {
    [ResourceType.WOOD]: 80,
    [ResourceType.STONE]: 40,
  },
  constructionTurns: 6,
  canHoldSoldiers: true,
  canHoldMountedUnits: true, // Only building type besides barracks that holds cavalry
  soldierCapacity: 8,
  trainsUnits: ['horseman'], // Cavalry units
  visionRadius: 3,
  forbiddenTerrains: [TerrainType.WATER],
};

export const TRAINING_GROUND: BuildingDefinition = {
  id: 'training_ground',
  nameKey: 'building.training_ground.name',
  descriptionKey: 'building.training_ground.description',
  category: BuildingCategory.MILITARY,
  cost: {
    [ResourceType.WOOD]: 40,
  },
  constructionTurns: 3,
  canHoldSoldiers: true,
  canHoldMountedUnits: false, // Scouts are on foot
  soldierCapacity: 10,
  trainsUnits: ['scout'], // Scout units
  visionRadius: 5, // Better vision for scouting building
  forbiddenTerrains: [TerrainType.WATER],
};

// =============================================================================
// WALLS (Form Villages/Cities, Hold Soldiers)
// =============================================================================

export const WOOD_WALL: BuildingDefinition = {
  id: 'wood_wall',
  nameKey: 'building.wood_wall.name',
  descriptionKey: 'building.wood_wall.description',
  category: BuildingCategory.WALL,
  cost: {
    [ResourceType.WOOD]: 15,
  },
  constructionTurns: 2,
  canHoldSoldiers: true,
  canHoldMountedUnits: false, // CRITICAL: Walls cannot hold cavalry!
  soldierCapacity: 10,
  visionRadius: 3,
  isWall: true,
  wallMaterial: 'WOOD', // Forms VILLAGE when loop closed
  forbiddenTerrains: [TerrainType.WATER],
};

export const STONE_WALL: BuildingDefinition = {
  id: 'stone_wall',
  nameKey: 'building.stone_wall.name',
  descriptionKey: 'building.stone_wall.description',
  category: BuildingCategory.WALL,
  cost: {
    [ResourceType.WOOD]: 10,
    [ResourceType.STONE]: 10,
  },
  constructionTurns: 4,
  canHoldSoldiers: true,
  canHoldMountedUnits: false, // CRITICAL: Walls cannot hold cavalry!
  soldierCapacity: 20,
  visionRadius: 4,
  isWall: true,
  wallMaterial: 'STONE', // Forms CITY when loop closed
  forbiddenTerrains: [TerrainType.WATER],
};

// =============================================================================
// GATES (Entry Points in Walls)
// =============================================================================

export const WOOD_GATE: BuildingDefinition = {
  id: 'wood_gate',
  nameKey: 'building.wood_gate.name',
  descriptionKey: 'building.wood_gate.description',
  category: BuildingCategory.GATE,
  cost: {
    [ResourceType.WOOD]: 20,
  },
  constructionTurns: 1,
  canHoldSoldiers: false, // Gates are entry points, cannot station soldiers
  visionRadius: 3,
  isGate: true,
  wallMaterial: 'WOOD',
  forbiddenTerrains: [TerrainType.WATER],
};

export const STONE_GATE: BuildingDefinition = {
  id: 'stone_gate',
  nameKey: 'building.stone_gate.name',
  descriptionKey: 'building.stone_gate.description',
  category: BuildingCategory.GATE,
  cost: {
    [ResourceType.WOOD]: 15,
    [ResourceType.STONE]: 15,
  },
  constructionTurns: 2,
  canHoldSoldiers: false, // Gates are entry points, cannot station soldiers
  visionRadius: 4,
  isGate: true,
  wallMaterial: 'STONE',
  forbiddenTerrains: [TerrainType.WATER],
};

// =============================================================================
// BUILDING REGISTRY
// =============================================================================

export const ALL_BUILDINGS: BuildingDefinition[] = [
  // Infrastructure (3)
  TENT,
  HUT,
  HOUSE,

  // Production (4)
  FARM,
  LUMBER_MILL,
  QUARRY,
  MINE,

  // Military (4)
  BARRACKS,
  ARCHERY_RANGE,
  STABLE,
  TRAINING_GROUND,

  // Walls (2)
  WOOD_WALL,
  STONE_WALL,

  // Gates (2)
  WOOD_GATE,
  STONE_GATE,
];

export const BUILDINGS_BY_ID: Record<string, BuildingDefinition> = ALL_BUILDINGS.reduce(
  (acc, building) => {
    acc[building.id] = building;
    return acc;
  },
  {} as Record<string, BuildingDefinition>,
);

export const BUILDINGS_BY_CATEGORY: Record<BuildingCategory, BuildingDefinition[]> =
  ALL_BUILDINGS.reduce(
    (acc, building) => {
      if (!acc[building.category]) {
        acc[building.category] = [];
      }
      acc[building.category].push(building);
      return acc;
    },
    {} as Record<BuildingCategory, BuildingDefinition[]>,
  );

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getBuildingById(id: string): BuildingDefinition | undefined {
  return BUILDINGS_BY_ID[id];
}

export function getBuildingsByCategory(category: BuildingCategory): BuildingDefinition[] {
  return BUILDINGS_BY_CATEGORY[category] || [];
}

export function canBuildingHoldUnit(buildingId: string, unitIsMounted: boolean): boolean {
  const building = getBuildingById(buildingId);
  if (!building || !building.canHoldSoldiers) {
    return false;
  }

  // If unit is mounted (cavalry), check if building allows mounted units
  if (unitIsMounted && !building.canHoldMountedUnits) {
    return false;
  }

  return true;
}
