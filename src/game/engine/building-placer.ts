/**
 * Building Placement Engine
 * Validates and handles building placement logic
 */

import type { PlayerId, Coordinates, ResourceCost } from '@/data/types';
import { getBuildingById } from '@/data/buildings';
import { ActionType } from '@/data/types';

export interface PlacementValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlacementContext {
  playerId: PlayerId;
  buildingId: string;
  coordinates: Coordinates;
  turnNumber: number;
}

/**
 * Validate building placement
 */
export function validateBuildingPlacement(
  context: PlacementContext,
  checks: {
    hasBuildingAt: (coords: Coordinates) => boolean;
    hasConstructionAt: (coords: Coordinates) => boolean;
    canAffordCost: (cost: ResourceCost) => boolean;
    hasActionsRemaining: (actionType: ActionType) => boolean;
    isGateTile?: (coords: Coordinates) => boolean; // Phase 3 integration
    getTerrain?: (coords: Coordinates) => string | null; // Terrain validation
  },
): PlacementValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get building definition
  const buildingDef = getBuildingById(context.buildingId);
  if (!buildingDef) {
    errors.push(`Building definition not found: ${context.buildingId}`);
    return { valid: false, errors, warnings };
  }

  // Check if tile is already occupied by a building
  if (checks.hasBuildingAt(context.coordinates)) {
    errors.push(`Tile already has a building at (${context.coordinates.x}, ${context.coordinates.y})`);
  }

  // Check if tile has construction in progress
  if (checks.hasConstructionAt(context.coordinates)) {
    errors.push(`Construction already in progress at (${context.coordinates.x}, ${context.coordinates.y})`);
  }

  // Check if player can afford the building
  if (!checks.canAffordCost(buildingDef.cost)) {
    errors.push(`Insufficient resources to build ${buildingDef.nameKey}`);
  }

  // Check if player has actions remaining
  if (!checks.hasActionsRemaining(ActionType.BUILD)) {
    errors.push('No actions remaining this turn');
  }

  // Check if trying to build on a gate tile (Phase 3 integration)
  if (checks.isGateTile && checks.isGateTile(context.coordinates)) {
    errors.push('Cannot build on gate tiles');
  }

  // Check terrain suitability
  if (checks.getTerrain) {
    const terrain = checks.getTerrain(context.coordinates);
    if (terrain) {
      const terrainCheck = isTerrainSuitable(context.buildingId, terrain);
      if (!terrainCheck.suitable) {
        errors.push(terrainCheck.reason || 'Unsuitable terrain');
      }
    }
  }

  // Warnings (don't block placement, but inform player)
  if (buildingDef.peasantRequirement && buildingDef.peasantRequirement > 0) {
    warnings.push(
      `This building requires ${buildingDef.peasantRequirement} peasants for 100% efficiency`,
    );
  }

  if (buildingDef.constructionTurns > 3) {
    warnings.push(`Construction will take ${buildingDef.constructionTurns} turns`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate total cost for a building
 */
export function calculateBuildingCost(buildingId: string): ResourceCost {
  const buildingDef = getBuildingById(buildingId);
  if (!buildingDef) {
    return {};
  }

  return { ...buildingDef.cost };
}

/**
 * Get building construction time
 */
export function getBuildingConstructionTime(buildingId: string): number {
  const buildingDef = getBuildingById(buildingId);
  return buildingDef?.constructionTurns || 0;
}

/**
 * Check if building can be placed on terrain
 */
export function isTerrainSuitable(
  buildingId: string,
  terrain: string,
): { suitable: boolean; reason?: string } {
  const buildingDef = getBuildingById(buildingId);
  if (!buildingDef) {
    return { suitable: false, reason: 'Building definition not found' };
  }

  // Check forbidden terrains
  if (buildingDef.forbiddenTerrains && buildingDef.forbiddenTerrains.includes(terrain as never)) {
    return { suitable: false, reason: `Cannot build on ${terrain.toLowerCase()} terrain` };
  }

  // Check allowed terrains (if specified, only these are allowed)
  if (buildingDef.allowedTerrains && buildingDef.allowedTerrains.length > 0) {
    if (!buildingDef.allowedTerrains.includes(terrain as never)) {
      const allowedList = buildingDef.allowedTerrains.join(', ');
      return {
        suitable: false,
        reason: `Can only build on: ${allowedList.toLowerCase()}`,
      };
    }
  }

  return { suitable: true };
}

/**
 * Get buildings that can be built given available resources
 */
export function getAffordableBuildings(
  allBuildingIds: string[],
  canAfford: (cost: ResourceCost) => boolean,
): string[] {
  return allBuildingIds.filter((buildingId) => {
    const cost = calculateBuildingCost(buildingId);
    return canAfford(cost);
  });
}

/**
 * Check if building is a prerequisite for another building
 * (Placeholder for Phase 7 research system)
 */
export function checkPrerequisites(
  _buildingId: string,
  _playerResearch: string[] = [],
  _playerBuildings: string[] = [],
): { met: boolean; missing: string[] } {
  // For now, no prerequisites
  // Phase 7 will add research requirements
  return { met: true, missing: [] };
}
