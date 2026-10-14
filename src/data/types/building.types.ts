/**
 * Building System Types (Runtime State)
 * Building instances and state management
 *
 * Note: Building definitions are in src/data/buildings.ts
 */

import type { PlayerId, EntityId, Coordinates } from './game.types';
import type { ResourceCost } from './resource.types';

/**
 * Building instance (placed on map)
 */
export interface BuildingInstance {
  entityId: EntityId;
  buildingId: string; // Reference to building definition
  ownerId: PlayerId;
  coordinates: Coordinates;
  level: number;

  // Construction state
  isUnderConstruction: boolean;
  constructionTurnsRemaining: number;
  constructionStartedTurn: number;

  // Operational state
  peasantsAllocated: number;
  productionMultiplier: number; // Based on peasant allocation
  isActive: boolean;

  // Military
  soldiersStationed: EntityId[]; // Unit entity IDs stationed here
  soldierCount: number;

  // Metadata
  placedAt: Date;
  lastModified: Date;
}

/**
 * Building construction queue entry
 */
export interface ConstructionQueueEntry {
  entityId: EntityId;
  buildingId: string;
  coordinates: Coordinates;
  ownerId: PlayerId;
  turnsRemaining: number;
  totalTurns: number;
  costPaid: ResourceCost;
  startedTurn: number;
  canCancel: boolean;
  refundAmount?: ResourceCost; // If cancelled
}

/**
 * Building upgrade state
 */
export interface BuildingUpgrade {
  buildingEntityId: EntityId;
  currentLevel: number;
  targetLevel: number;
  turnsRemaining: number;
  costPaid: ResourceCost;
  startedTurn: number;
}

/**
 * Building placement validation
 */
export interface BuildingPlacementValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  cost: ResourceCost;
  turns: number;
}

/**
 * Building demolition result
 */
export interface DemolitionResult {
  success: boolean;
  buildingId: string;
  coordinates: Coordinates;
  peasantsReleased: number;
  soldiersReleased: EntityId[];
  refund: ResourceCost;
}

/**
 * Building statistics for player
 */
export interface PlayerBuildingStats {
  playerId: PlayerId;
  totalBuildings: number;
  buildingsByType: Map<string, number>;
  underConstruction: number;
  totalPeasantsGenerated: number; // From infrastructure buildings
  totalSoldierCapacity: number; // From military buildings
}
