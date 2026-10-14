/**
 * Action System Types
 * Defines the action economy and action types in the turn-based system
 */

import type { PlayerId, EntityId, Coordinates } from './game.types';

/**
 * Types of actions players can take
 */
export enum ActionType {
  BUILD = 'BUILD',
  DEMOLISH = 'DEMOLISH',
  TRAIN = 'TRAIN',
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  RESEARCH = 'RESEARCH',
  UPGRADE = 'UPGRADE',
  ALLOCATE_PEASANTS = 'ALLOCATE_PEASANTS', // FREE - costs 0 actions
}

/**
 * Action cost definition
 */
export interface ActionCost {
  actionType: ActionType;
  cost: number; // Number of actions required
}

/**
 * Source of action bonuses
 */
export enum ActionBonusSource {
  RESEARCH = 'RESEARCH',
  BUILDING = 'BUILDING',
  UPGRADE = 'UPGRADE',
}

/**
 * Action bonus from research/buildings
 */
export interface ActionBonus {
  source: ActionBonusSource;
  sourceId: EntityId; // ID of research/building providing bonus
  bonusAmount: number; // Additional actions per turn
  description: string; // Display text
}

/**
 * Player action state for current turn
 */
export interface PlayerActionState {
  playerId: PlayerId;
  baseActionsPerTurn: number; // From config
  bonuses: ActionBonus[]; // Active bonuses
  maxActionsPerTurn: number; // Base + all bonuses
  actionsRemaining: number; // Current available actions
  actionsTaken: PlayerAction[]; // Actions taken this turn
}

/**
 * Base interface for all player actions
 */
export interface BaseAction {
  actionType: ActionType;
  playerId: PlayerId;
  turnNumber: number;
  timestamp: Date;
}

/**
 * Build action
 */
export interface BuildAction extends BaseAction {
  actionType: ActionType.BUILD;
  buildingId: string;
  coordinates: Coordinates;
}

/**
 * Demolish action
 */
export interface DemolishAction extends BaseAction {
  actionType: ActionType.DEMOLISH;
  coordinates: Coordinates;
}

/**
 * Train unit action
 */
export interface TrainAction extends BaseAction {
  actionType: ActionType.TRAIN;
  unitId: string;
  buildingCoordinates: Coordinates;
  quantity: number;
}

/**
 * Move unit action
 */
export interface MoveAction extends BaseAction {
  actionType: ActionType.MOVE;
  unitEntityId: EntityId;
  from: Coordinates;
  to: Coordinates;
  path: Coordinates[];
}

/**
 * Attack action
 */
export interface AttackAction extends BaseAction {
  actionType: ActionType.ATTACK;
  attackerEntityId: EntityId;
  targetCoordinates: Coordinates;
}

/**
 * Research action
 */
export interface ResearchAction extends BaseAction {
  actionType: ActionType.RESEARCH;
  researchId: string;
}

/**
 * Upgrade building action
 */
export interface UpgradeAction extends BaseAction {
  actionType: ActionType.UPGRADE;
  coordinates: Coordinates;
}

/**
 * Allocate peasants action (FREE - no action cost)
 */
export interface AllocatePeasantsAction extends BaseAction {
  actionType: ActionType.ALLOCATE_PEASANTS;
  targetCoordinates: Coordinates;
  peasantCount: number;
}

/**
 * Union type of all possible actions
 */
export type PlayerAction =
  | BuildAction
  | DemolishAction
  | TrainAction
  | MoveAction
  | AttackAction
  | ResearchAction
  | UpgradeAction
  | AllocatePeasantsAction;

/**
 * Action validation result
 */
export interface ActionValidation {
  valid: boolean;
  error?: string;
  cost: number;
}
