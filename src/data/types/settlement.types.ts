/**
 * Settlement System Types
 * Villages and cities formed by wall loops
 */

import type { PlayerId, TileKey } from './game.types';
import type { WallMaterial } from './wall.types';
import type { ResourceType } from './resource.types';

/**
 * Settlement types
 */
export enum SettlementType {
  VILLAGE = 'VILLAGE', // Wood walls
  CITY = 'CITY', // Stone walls
}

/**
 * Settlement bonus types
 */
export interface SettlementBonus {
  bonusType: 'RESOURCE_PRODUCTION' | 'PEASANT_CAPACITY' | 'SOLDIER_CAPACITY' | 'VISION';
  resourceType?: ResourceType; // For resource production bonuses
  multiplier?: number; // e.g., 1.2 = +20%
  flatBonus?: number; // e.g., +10 peasants
  description: string;
}

/**
 * Settlement instance
 */
export interface Settlement {
  settlementId: string;
  name: string;
  type: SettlementType;
  ownerId: PlayerId;

  // Territory
  wallTiles: TileKey[];
  gateTiles: TileKey[];
  interiorTiles: TileKey[];
  area: number;

  // Bonuses
  bonuses: SettlementBonus[];

  // Stats
  population: number; // Total peasants in settlement
  buildingCount: number;
  militaryStrength: number; // Total soldiers in settlement

  // Metadata
  formedAt: Date;
  formedAtTurn: number;
  lastModified: Date;
}

/**
 * Settlement formation event
 */
export interface SettlementFormationEvent {
  settlementId: string;
  settlementType: SettlementType;
  ownerId: PlayerId;
  wallMaterial: WallMaterial;
  area: number;
  turnNumber: number;
}

/**
 * Settlement destruction event
 */
export interface SettlementDestructionEvent {
  settlementId: string;
  settlementType: SettlementType;
  ownerId: PlayerId;
  reason: 'WALL_DESTROYED' | 'GATE_DESTROYED' | 'CONQUERED';
  turnNumber: number;
}

/**
 * Settlement validation
 */
export interface SettlementValidation {
  valid: boolean;
  errors: string[];
  wallMaterial: WallMaterial;
  hasGate: boolean;
  wallsConsistent: boolean; // All same material
}

/**
 * Player settlements summary
 */
export interface PlayerSettlements {
  playerId: PlayerId;
  villages: Settlement[];
  cities: Settlement[];
  totalSettlements: number;
  totalPopulation: number;
  totalArea: number;
}
