/**
 * Research System Types
 * Technology tree and research progress
 *
 * Note: Research definitions will be in src/data/research.ts
 */

import type { PlayerId } from './game.types';
import type { ResourceCost } from './resource.types';

/**
 * Research categories
 */
export enum ResearchCategory {
  ECONOMY = 'ECONOMY',
  MILITARY = 'MILITARY',
  CONSTRUCTION = 'CONSTRUCTION',
  ADMINISTRATION = 'ADMINISTRATION',
  ADVANCED = 'ADVANCED',
}

/**
 * Research unlock types
 */
export enum ResearchUnlockType {
  BUILDING = 'BUILDING',
  UNIT = 'UNIT',
  UPGRADE = 'UPGRADE',
  BONUS = 'BONUS',
  ACTION_INCREASE = 'ACTION_INCREASE',
}

/**
 * Research unlock
 */
export interface ResearchUnlock {
  unlockType: ResearchUnlockType;
  unlockId: string; // Building ID, unit ID, etc.
  value?: number; // For bonuses, action increases
  description: string;
}

/**
 * Research state for player
 */
export interface PlayerResearchState {
  playerId: PlayerId;
  completedResearch: Set<string>; // Research IDs
  activeResearch: ResearchProgress | null;
  availableResearch: string[]; // Research IDs that can be started
}

/**
 * Research progress
 */
export interface ResearchProgress {
  researchId: string;
  ownerId: PlayerId;
  turnsRemaining: number;
  totalTurns: number;
  costPaid: ResourceCost;
  startedTurn: number;
  canCancel: boolean;
}

/**
 * Research completion event
 */
export interface ResearchCompletionEvent {
  researchId: string;
  playerId: PlayerId;
  turnNumber: number;
  unlocks: ResearchUnlock[];
  bonusesApplied: string[];
}

/**
 * Research validation
 */
export interface ResearchValidation {
  valid: boolean;
  errors: string[];
  hasPrerequisites: boolean;
  missingPrerequisites: string[];
  canAfford: boolean;
  missingResources: ResourceCost;
}

/**
 * Research tree node (for UI display)
 */
export interface ResearchTreeNode {
  researchId: string;
  category: ResearchCategory;
  prerequisites: string[];
  unlocks: ResearchUnlock[];
  isResearched: boolean;
  isAvailable: boolean;
  isInProgress: boolean;
  position: { x: number; y: number }; // For tree visualization
}

/**
 * Player research statistics
 */
export interface PlayerResearchStats {
  playerId: PlayerId;
  totalResearched: number;
  researchByCategory: Map<ResearchCategory, number>;
  currentlyResearching: string | null;
  availableResearchCount: number;
  techLevel: number; // Overall tech advancement
}
