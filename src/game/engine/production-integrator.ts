/**
 * Production Integrator
 * Connects building production system with resource generation
 */

import type { ResourceAmount } from '@/data/types';
import { ResourceType, TerrainType } from '@/data/types';
import type { PlacedBuilding } from '@/stores/game/buildings';
import type { BuildingDefinition } from '@/data/buildings';

/**
 * Calculate actual resource production for a building based on peasant allocation
 */
export function calculateBuildingProduction(
  building: PlacedBuilding,
  buildingDef: BuildingDefinition,
  peasantAllocation: number,
  settlementBonus: number = 1.0,
  terrain?: TerrainType,
): { resourceType: ResourceType; amount: number } | null {
  // Only production buildings produce resources
  if (!buildingDef.production) return null;

  const { resourceType, amountPerTurn } = buildingDef.production;
  const requiredPeasants = buildingDef.peasantRequirement || 0;

  // Calculate efficiency
  const efficiency = calculatePeasantEfficiency(peasantAllocation, requiredPeasants);

  // Apply terrain bonus if applicable
  let terrainBonus = 1.0;
  if (terrain && buildingDef.terrainBonus) {
    terrainBonus = buildingDef.terrainBonus.get(terrain) || 1.0;
  }

  // Calculate actual production with all bonuses
  const productionBeforeBonus = amountPerTurn * efficiency;
  const productionWithTerrain = productionBeforeBonus * terrainBonus;
  const actualProduction = Math.floor(productionWithTerrain * settlementBonus);

  return {
    resourceType,
    amount: actualProduction,
  };
}

/**
 * Calculate peasant efficiency based on allocation
 * Uses config.ts formula for consistency
 *
 * Formula:
 * - Below 50% of required: 0% efficiency (no production)
 * - Above 50%: Linear scaling (allocated / required)
 * - Cap at 500% (5.0x multiplier)
 *
 * Examples (required = 6):
 * - 0 peasants: 0% (0.0x)
 * - 3 peasants (50%): 50% (0.5x)
 * - 6 peasants (100%): 100% (1.0x) ← optimal
 * - 12 peasants (200%): 200% (2.0x)
 * - 30 peasants (500%): 500% (5.0x) ← maximum
 */
function calculatePeasantEfficiency(allocated: number, required: number): number {
  if (required === 0) return 1.0; // No peasants needed = always 100%
  if (allocated === 0) return 0.0; // No peasants = no production

  // Below 50% threshold = no production
  if (allocated < required * 0.5) {
    return 0.0;
  }

  // Linear scaling, capped at 500% (5.0x multiplier)
  const multiplier = allocated / required;
  return Math.min(multiplier, 5.0);
}

/**
 * Calculate total production from all buildings for a player
 */
export function calculatePlayerProduction(
  buildings: Array<{
    building: PlacedBuilding;
    definition: BuildingDefinition;
    peasantAllocation: number;
    terrain?: TerrainType;
  }>,
  settlementBonuses: Map<string, number> = new Map(),
): ResourceAmount {
  const production: ResourceAmount = {
    [ResourceType.FOOD]: 0,
    [ResourceType.WOOD]: 0,
    [ResourceType.STONE]: 0,
    [ResourceType.IRON]: 0,
  };

  for (const { building, definition, peasantAllocation, terrain } of buildings) {
    // Get settlement bonus for this building's location
    const locationKey = `${building.coordinates.x},${building.coordinates.y}`;
    const settlementBonus = settlementBonuses.get(locationKey) || 1.0;

    const result = calculateBuildingProduction(
      building,
      definition,
      peasantAllocation,
      settlementBonus,
      terrain,
    );

    if (result) {
      production[result.resourceType] += result.amount;
    }
  }

  return production;
}
