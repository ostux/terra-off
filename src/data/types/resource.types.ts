/**
 * Resource System Types
 * Manages player resources and resource operations
 */

import type { PlayerId } from './game.types';

/**
 * Resource types (matches ResourceType enum in buildings.ts)
 */
export enum ResourceType {
  FOOD = 'FOOD',
  WOOD = 'WOOD',
  STONE = 'STONE',
  IRON = 'IRON',
}

/**
 * Resource amount by type
 */
export type ResourceAmount = {
  [K in ResourceType]: number;
};

/**
 * Resource delta (positive or negative changes)
 */
export type ResourceDelta = Partial<ResourceAmount>;

/**
 * Player resource state
 */
export interface PlayerResources {
  playerId: PlayerId;
  current: ResourceAmount;
  capacity: ResourceAmount; // Storage limits
  production: ResourceAmount; // Per turn production
  consumption: ResourceAmount; // Per turn consumption
  netProduction: ResourceAmount; // Production - consumption
}

/**
 * Resource transaction
 */
export interface ResourceTransaction {
  playerId: PlayerId;
  resourceType: ResourceType;
  amount: number; // Positive = gain, negative = spend
  reason: string;
  turnNumber: number;
  timestamp: Date;
}

/**
 * Resource cost (for buildings, units, research)
 */
export type ResourceCost = Partial<ResourceAmount>;

/**
 * Resource check result
 */
export interface ResourceCheck {
  canAfford: boolean;
  missing?: ResourceDelta; // What resources are missing
  cost: ResourceCost;
}

/**
 * Resource production source
 */
export interface ResourceProductionSource {
  sourceType: 'BUILDING' | 'TILE' | 'BONUS';
  sourceId: string;
  resourceType: ResourceType;
  baseAmount: number;
  multiplier: number; // From peasants/bonuses
  finalAmount: number;
}

/**
 * Resource overflow event
 */
export interface ResourceOverflow {
  playerId: PlayerId;
  resourceType: ResourceType;
  amountLost: number;
  currentAmount: number;
  capacity: number;
  turnNumber: number;
}
