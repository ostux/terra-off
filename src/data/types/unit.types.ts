/**
 * Unit System Types (Runtime State)
 * Unit instances, movement, and combat
 *
 * Note: Unit definitions are in src/data/units.ts
 */

import type { PlayerId, EntityId, Coordinates } from './game.types';
import type { ResourceCost } from './resource.types';

/**
 * Unit instance (trained unit on map)
 */
export interface UnitInstance {
  entityId: EntityId;
  unitId: string; // Reference to unit definition
  ownerId: PlayerId;
  coordinates: Coordinates;

  // Combat stats
  currentHealth: number;
  maxHealth: number;
  currentAttack: number;
  currentDefense: number;

  // Movement
  movementPointsRemaining: number;
  maxMovementPoints: number;
  hasMovedThisTurn: boolean;
  hasAttackedThisTurn: boolean;

  // State
  isStationed: boolean; // Stationed on a building
  stationedAt?: Coordinates; // Building coordinates
  veterancy: number; // Experience level

  // Metadata
  trainedAt: Date;
  trainedAtTurn: number;
}

/**
 * Unit training queue entry
 */
export interface UnitTrainingEntry {
  entityId: EntityId;
  unitId: string;
  quantity: number;
  ownerId: PlayerId;
  trainingBuildingCoordinates: Coordinates;
  turnsRemaining: number;
  totalTurns: number;
  costPaid: ResourceCost;
  startedTurn: number;
}

/**
 * Unit movement command
 */
export interface UnitMovementCommand {
  unitEntityId: EntityId;
  path: Coordinates[];
  destination: Coordinates;
  movementCost: number;
  canComplete: boolean;
}

/**
 * Unit movement result
 */
export interface UnitMovementResult {
  success: boolean;
  unitEntityId: EntityId;
  from: Coordinates;
  to: Coordinates;
  pathTaken: Coordinates[];
  movementPointsUsed: number;
  error?: string;
}

/**
 * Combat participant
 */
export interface CombatParticipant {
  unitEntityId: EntityId;
  unitId: string;
  ownerId: PlayerId;
  coordinates: Coordinates;
  attack: number;
  defense: number;
  health: number;
  quantity: number; // For grouped units
}

/**
 * Combat result
 */
export interface CombatResult {
  turnNumber: number;
  attackerPlayerId: PlayerId;
  defenderPlayerId: PlayerId;
  location: Coordinates;

  attackers: CombatParticipant[];
  defenders: CombatParticipant[];

  attackerLosses: number;
  defenderLosses: number;

  winner: PlayerId | 'DRAW';
  buildingDestroyed: boolean;
  buildingCaptured: boolean;

  details: string; // Combat log
}

/**
 * Unit upkeep cost
 */
export interface UnitUpkeep {
  unitEntityId: EntityId;
  unitId: string;
  foodCost: number;
  totalUpkeep: ResourceCost;
}

/**
 * Player unit statistics
 */
export interface PlayerUnitStats {
  playerId: PlayerId;
  totalUnits: number;
  unitsByType: Map<string, number>;
  inTraining: number;
  totalUpkeep: ResourceCost;
  averageVeterancy: number;
}

/**
 * Unit station assignment
 */
export interface UnitStationAssignment {
  unitEntityId: EntityId;
  buildingCoordinates: Coordinates;
  buildingEntityId: EntityId;
  canStation: boolean;
  reason?: string; // If can't station
}
