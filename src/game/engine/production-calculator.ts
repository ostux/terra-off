/**
 * Production Calculator
 * Calculates resource production based on peasant allocation and efficiency
 */

import type {
  ResourceType,
  ResourceAmount,
  PeasantProductionCalculation,
  EntityId,
} from '@/data/types';
import { calculatePeasantEfficiency } from '@/data/config';

/**
 * Building production info
 */
export interface BuildingProduction {
  buildingEntityId: EntityId;
  buildingId: string;
  resourceType: ResourceType;
  baseProduction: number; // At 100% efficiency
  peasantsAllocated: number;
  peasantsRequired: number;
  efficiency: number;
  actualProduction: number;
  settlementBonus: number; // Multiplier from settlement (1.0 = no bonus, 1.2 = +20%)
}

/**
 * Calculate production for a single building
 */
export function calculateBuildingProduction(
  baseProduction: number,
  peasantsAllocated: number,
  peasantsRequired: number,
  settlementBonus = 1.0,
): PeasantProductionCalculation {
  const efficiency = calculatePeasantEfficiency(peasantsAllocated, peasantsRequired);
  const productionBeforeBonus = baseProduction * efficiency;
  const actualProduction = productionBeforeBonus * settlementBonus;

  return {
    allocatedPeasants: peasantsAllocated,
    requiredPeasants: peasantsRequired,
    efficiencyMultiplier: efficiency,
    baseProduction,
    actualProduction,
  };
}

/**
 * Calculate total resource production from multiple buildings
 */
export function calculateTotalProduction(
  productions: BuildingProduction[],
): ResourceAmount {
  const total: ResourceAmount = {
    FOOD: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
  };

  for (const production of productions) {
    total[production.resourceType] += production.actualProduction;
  }

  return total;
}

/**
 * Calculate production by resource type
 */
export function calculateProductionByResource(
  productions: BuildingProduction[],
  resourceType: ResourceType,
): number {
  return productions
    .filter((p) => p.resourceType === resourceType)
    .reduce((sum, p) => sum + p.actualProduction, 0);
}

/**
 * Get production summary for all buildings
 */
export function getProductionSummary(productions: BuildingProduction[]) {
  const totalProduction = calculateTotalProduction(productions);

  const buildingCount = productions.length;
  const activeBuildings = productions.filter((p) => p.peasantsAllocated > 0).length;
  const optimalBuildings = productions.filter((p) => p.efficiency >= 1.0).length;
  const suboptimalBuildings = productions.filter(
    (p) => p.efficiency > 0 && p.efficiency < 1.0,
  ).length;
  const inactiveBuildings = productions.filter((p) => p.efficiency === 0).length;

  const averageEfficiency =
    buildingCount > 0
      ? productions.reduce((sum, p) => sum + p.efficiency, 0) / buildingCount
      : 0;

  return {
    totalProduction,
    buildingCount,
    activeBuildings,
    optimalBuildings,
    suboptimalBuildings,
    inactiveBuildings,
    averageEfficiency,
  };
}

/**
 * Get recommendations for improving production
 */
export function getProductionRecommendations(productions: BuildingProduction[]): string[] {
  const recommendations: string[] = [];

  // Find inactive buildings (0% efficiency)
  const inactive = productions.filter((p) => p.efficiency === 0 && p.peasantsRequired > 0);
  if (inactive.length > 0 && inactive[0]) {
    recommendations.push(
      `${inactive.length} building(s) inactive. Allocate at least ${inactive[0].peasantsRequired * 0.5} peasants to activate.`,
    );
  }

  // Find suboptimal buildings
  const suboptimal = productions.filter((p) => p.efficiency > 0 && p.efficiency < 1.0);
  if (suboptimal.length > 0) {
    recommendations.push(
      `${suboptimal.length} building(s) operating below 100% efficiency. Allocate more peasants for better production.`,
    );
  }

  // Find over-allocated buildings
  const overAllocated = productions.filter((p) => p.efficiency > 2.0);
  if (overAllocated.length > 0) {
    recommendations.push(
      `${overAllocated.length} building(s) highly over-allocated. Consider redistributing excess peasants.`,
    );
  }

  return recommendations;
}

/**
 * Calculate optimal peasant distribution for buildings
 * Tries to maximize total production given limited peasants
 */
export function calculateOptimalDistribution(
  buildings: Array<{
    buildingEntityId: EntityId;
    resourceType: ResourceType;
    baseProduction: number;
    requiredPeasants: number;
    priority: number; // Higher = more important (e.g., food > others)
  }>,
  availablePeasants: number,
): Map<EntityId, number> {
  const allocation = new Map<EntityId, number>();

  // Sort by priority * production value
  const sorted = [...buildings].sort((a, b) => {
    const valueA = a.priority * a.baseProduction;
    const valueB = b.priority * b.baseProduction;
    return valueB - valueA;
  });

  let remaining = availablePeasants;

  // First pass: allocate minimum (50%) to all buildings
  for (const building of sorted) {
    const minimum = Math.ceil(building.requiredPeasants * 0.5);
    if (remaining >= minimum) {
      allocation.set(building.buildingEntityId, minimum);
      remaining -= minimum;
    }
  }

  // Second pass: bring high-priority buildings to 100%
  for (const building of sorted) {
    const current = allocation.get(building.buildingEntityId) || 0;
    const needed = building.requiredPeasants - current;

    if (needed > 0 && remaining >= needed) {
      allocation.set(building.buildingEntityId, building.requiredPeasants);
      remaining -= needed;
    }
  }

  // Third pass: over-allocate to highest priority if peasants remain
  for (const building of sorted) {
    if (remaining === 0) break;

    const current = allocation.get(building.buildingEntityId) || 0;
    const max = building.requiredPeasants * 5; // 500% cap
    const canAllocate = Math.min(remaining, max - current);

    if (canAllocate > 0) {
      allocation.set(building.buildingEntityId, current + canAllocate);
      remaining -= canAllocate;
    }
  }

  return allocation;
}
