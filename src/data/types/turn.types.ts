/**
 * Turn System Types
 * Manages turn-based gameplay flow
 */

import type { PlayerId } from './game.types';
import type { PlayerAction } from './action.types';

/**
 * Turn phases
 */
export enum TurnPhase {
  ACTION = 'ACTION', // Player taking actions
  RESOLUTION = 'RESOLUTION', // Processing turn end
}

/**
 * Turn order type (sequential or simultaneous)
 */
export enum TurnOrderType {
  SEQUENTIAL = 'SEQUENTIAL', // Players take turns one at a time
  SIMULTANEOUS = 'SIMULTANEOUS', // All players plan, then resolve together
}

/**
 * Turn state
 */
export interface TurnState {
  turnNumber: number;
  currentPlayerId: PlayerId | null; // Null during resolution phase
  phase: TurnPhase;
  turnOrder: PlayerId[]; // Order of players
  turnOrderType: TurnOrderType;
  turnStartedAt: Date;
  turnEndsAt?: Date; // Optional turn timer deadline
}

/**
 * Turn timer configuration
 */
export interface TurnTimer {
  enabled: boolean;
  durationSeconds: number; // Time limit per turn
  warningAtSeconds: number; // Show warning when X seconds remain
}

/**
 * Turn resolution event types
 */
export enum TurnEventType {
  RESOURCE_PRODUCED = 'RESOURCE_PRODUCED',
  BUILDING_COMPLETED = 'BUILDING_COMPLETED',
  UNIT_TRAINED = 'UNIT_TRAINED',
  RESEARCH_COMPLETED = 'RESEARCH_COMPLETED',
  UNIT_MOVED = 'UNIT_MOVED',
  COMBAT_RESOLVED = 'COMBAT_RESOLVED',
  VISION_UPDATED = 'VISION_UPDATED',
  FOG_UPDATED = 'FOG_UPDATED',
  SETTLEMENT_FORMED = 'SETTLEMENT_FORMED',
  SETTLEMENT_DESTROYED = 'SETTLEMENT_DESTROYED',
}

/**
 * Base turn event
 */
export interface BaseTurnEvent {
  type: TurnEventType;
  turnNumber: number;
  playerId: PlayerId;
  timestamp: Date;
}

/**
 * Resource production event
 */
export interface ResourceProducedEvent extends BaseTurnEvent {
  type: TurnEventType.RESOURCE_PRODUCED;
  resourceType: string;
  amount: number;
}

/**
 * Building completion event
 */
export interface BuildingCompletedEvent extends BaseTurnEvent {
  type: TurnEventType.BUILDING_COMPLETED;
  buildingId: string;
  coordinates: { x: number; y: number };
}

/**
 * Union type of all turn events
 */
export type TurnEvent = ResourceProducedEvent | BuildingCompletedEvent; // Add more as needed

/**
 * Turn history entry
 */
export interface TurnHistoryEntry {
  turnNumber: number;
  playerId: PlayerId;
  actions: PlayerAction[];
  events: TurnEvent[];
  startedAt: Date;
  endedAt: Date;
}

/**
 * Turn resolution result
 */
export interface TurnResolutionResult {
  success: boolean;
  events: TurnEvent[];
  errors: string[];
}
