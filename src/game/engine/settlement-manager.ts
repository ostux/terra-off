/**
 * Settlement Manager
 * Manages settlement recognition, naming, bonuses, and lifecycle
 */

import type {
  Settlement,
  SettlementType,
  SettlementBonus,
  SettlementFormationEvent,
  SettlementDestructionEvent,
  WallLoop,
  PlayerId,
  TileKey,
  WallMaterial,
} from '@/data/types';
import { SettlementType as SettType } from '@/data/types';

/**
 * Settlement name generator
 */
class SettlementNameGenerator {
  private usedNames = new Set<string>();

  // Predefined settlement names pool
  private readonly villageNames = [
    'Riverside',
    'Oakwood',
    'Meadowbrook',
    'Stonehaven',
    'Willowdale',
    'Ashford',
    'Thornbury',
    'Millbrook',
    'Greenwood',
    'Fairfield',
    'Brookside',
    'Westfield',
    'Clearwater',
    'Redwood',
    'Shadowmere',
    'Brightholm',
    'Starfall',
    'Windridge',
    'Frostholm',
    'Sundale',
  ];

  private readonly cityNames = [
    'Ironforge',
    'Stormhold',
    'Greystone',
    'Silverkeep',
    'Blackrock',
    'Goldcrest',
    'Dragonspire',
    'Wolfhaven',
    'Ravenfort',
    'Lionheart',
    'Shadowgate',
    'Brightstar',
    'Stormwind',
    'Ironpeak',
    'Stonewatch',
    'Silvermoon',
    'Darkshore',
    'Frostforge',
    'Sunspire',
    'Thunderkeep',
  ];

  private villageIndex = 0;
  private cityIndex = 0;

  /**
   * Generate unique settlement name
   */
  generateName(type: SettlementType, _playerId: PlayerId): string {
    const namePool = type === SettType.VILLAGE ? this.villageNames : this.cityNames;
    const index = type === SettType.VILLAGE ? this.villageIndex++ : this.cityIndex++;

    // Cycle through names
    const baseName = namePool[index % namePool.length]!;

    // Make unique by adding player suffix if needed
    let name = baseName;
    let suffix = 1;

    while (this.usedNames.has(name)) {
      name = `${baseName} ${suffix}`;
      suffix++;
    }

    this.usedNames.add(name);
    return name;
  }

  /**
   * Release a name back to the pool
   */
  releaseName(name: string): void {
    this.usedNames.delete(name);
  }

  /**
   * Reset generator
   */
  reset(): void {
    this.usedNames.clear();
    this.villageIndex = 0;
    this.cityIndex = 0;
  }
}

/**
 * Settlement Manager
 */
export class SettlementManager {
  private settlements = new Map<string, Settlement>();
  private nameGenerator = new SettlementNameGenerator();

  /**
   * Classify wall material to settlement type
   */
  private classifySettlementType(wallMaterial: WallMaterial): SettlementType {
    return wallMaterial === 'WOOD' ? SettType.VILLAGE : SettType.CITY;
  }

  /**
   * Calculate settlement bonuses based on type and size
   */
  private calculateBonuses(type: SettlementType, area: number): SettlementBonus[] {
    const bonuses: SettlementBonus[] = [];

    if (type === SettType.VILLAGE) {
      // Village bonuses (modest)
      bonuses.push({
        bonusType: 'RESOURCE_PRODUCTION',
        multiplier: 1.1, // +10% production
        description: 'Village production bonus: +10% to all resources',
      });

      bonuses.push({
        bonusType: 'PEASANT_CAPACITY',
        flatBonus: Math.floor(area * 0.5), // +0.5 peasants per interior tile
        description: `Village housing bonus: +${Math.floor(area * 0.5)} peasants`,
      });

      // Larger villages get vision bonus
      if (area >= 20) {
        bonuses.push({
          bonusType: 'VISION',
          flatBonus: 1,
          description: 'Large village: +1 vision radius',
        });
      }
    } else {
      // City bonuses (significant)
      bonuses.push({
        bonusType: 'RESOURCE_PRODUCTION',
        multiplier: 1.25, // +25% production
        description: 'City production bonus: +25% to all resources',
      });

      bonuses.push({
        bonusType: 'PEASANT_CAPACITY',
        flatBonus: Math.floor(area * 1.0), // +1 peasant per interior tile
        description: `City housing bonus: +${Math.floor(area * 1.0)} peasants`,
      });

      bonuses.push({
        bonusType: 'SOLDIER_CAPACITY',
        multiplier: 1.2, // +20% soldier capacity
        description: 'City fortification: +20% soldier capacity on walls',
      });

      bonuses.push({
        bonusType: 'VISION',
        flatBonus: 2,
        description: 'City watchtowers: +2 vision radius',
      });
    }

    return bonuses;
  }

  /**
   * Create settlement from valid wall loop
   */
  createSettlement(
    loop: WallLoop,
    turnNumber: number,
  ): { settlement: Settlement; event: SettlementFormationEvent } | null {
    if (!loop.isValid) {
      return null;
    }

    const type = this.classifySettlementType(loop.material);
    const name = this.nameGenerator.generateName(type, loop.ownerId);
    const bonuses = this.calculateBonuses(type, loop.area);

    const settlement: Settlement = {
      settlementId: loop.loopId,
      name,
      type,
      ownerId: loop.ownerId,
      wallTiles: loop.wallTiles,
      gateTiles: loop.gateTiles,
      interiorTiles: loop.interiorTiles,
      area: loop.area,
      bonuses,
      population: 0, // Will be calculated from buildings
      buildingCount: 0, // Will be calculated
      militaryStrength: 0, // Will be calculated
      formedAt: new Date(),
      formedAtTurn: turnNumber,
      lastModified: new Date(),
    };

    this.settlements.set(settlement.settlementId, settlement);

    const event: SettlementFormationEvent = {
      settlementId: settlement.settlementId,
      settlementType: type,
      ownerId: loop.ownerId,
      wallMaterial: loop.material,
      area: loop.area,
      turnNumber,
    };

    return { settlement, event };
  }

  /**
   * Update settlement from modified loop
   */
  updateSettlement(
    settlementId: string,
    loop: WallLoop,
    _turnNumber: number,
  ): { settlement: Settlement; upgraded: boolean } | null {
    const existing = this.settlements.get(settlementId);

    if (!existing || !loop.isValid) {
      return null;
    }

    const newType = this.classifySettlementType(loop.material);
    const upgraded = existing.type === SettType.VILLAGE && newType === SettType.CITY;

    // If upgraded to city, generate new name
    let newName = existing.name;
    if (upgraded) {
      this.nameGenerator.releaseName(existing.name);
      newName = this.nameGenerator.generateName(newType, loop.ownerId);
    }

    const bonuses = this.calculateBonuses(newType, loop.area);

    const settlement: Settlement = {
      ...existing,
      name: newName,
      type: newType,
      wallTiles: loop.wallTiles,
      gateTiles: loop.gateTiles,
      interiorTiles: loop.interiorTiles,
      area: loop.area,
      bonuses,
      lastModified: new Date(),
    };

    this.settlements.set(settlementId, settlement);

    return { settlement, upgraded };
  }

  /**
   * Remove settlement
   */
  removeSettlement(
    settlementId: string,
    reason: 'WALL_DESTROYED' | 'GATE_DESTROYED' | 'CONQUERED',
    turnNumber: number,
  ): SettlementDestructionEvent | null {
    const settlement = this.settlements.get(settlementId);

    if (!settlement) {
      return null;
    }

    this.settlements.delete(settlementId);
    this.nameGenerator.releaseName(settlement.name);

    return {
      settlementId,
      settlementType: settlement.type,
      ownerId: settlement.ownerId,
      reason,
      turnNumber,
    };
  }

  /**
   * Get settlement by ID
   */
  getSettlement(settlementId: string): Settlement | undefined {
    return this.settlements.get(settlementId);
  }

  /**
   * Get all settlements
   */
  getAllSettlements(): Settlement[] {
    return Array.from(this.settlements.values());
  }

  /**
   * Get settlements by player
   */
  getPlayerSettlements(playerId: PlayerId): Settlement[] {
    return Array.from(this.settlements.values()).filter(
      (settlement) => settlement.ownerId === playerId,
    );
  }

  /**
   * Get settlements by type
   */
  getSettlementsByType(type: SettlementType): Settlement[] {
    return Array.from(this.settlements.values()).filter(
      (settlement) => settlement.type === type,
    );
  }

  /**
   * Check if tile is in any settlement
   */
  getTileSettlement(tileKey: TileKey): Settlement | undefined {
    return Array.from(this.settlements.values()).find(
      (settlement) =>
        settlement.wallTiles.includes(tileKey) ||
        settlement.gateTiles.includes(tileKey) ||
        settlement.interiorTiles.includes(tileKey),
    );
  }

  /**
   * Update settlement stats (population, buildings, military)
   */
  updateSettlementStats(
    settlementId: string,
    stats: { population?: number; buildingCount?: number; militaryStrength?: number },
  ): void {
    const settlement = this.settlements.get(settlementId);

    if (!settlement) return;

    if (stats.population !== undefined) {
      settlement.population = stats.population;
    }

    if (stats.buildingCount !== undefined) {
      settlement.buildingCount = stats.buildingCount;
    }

    if (stats.militaryStrength !== undefined) {
      settlement.militaryStrength = stats.militaryStrength;
    }

    settlement.lastModified = new Date();
  }

  /**
   * Clear all settlements
   */
  clear(): void {
    this.settlements.clear();
    this.nameGenerator.reset();
  }

  /**
   * Get settlement count
   */
  getSettlementCount(): number {
    return this.settlements.size;
  }
}
