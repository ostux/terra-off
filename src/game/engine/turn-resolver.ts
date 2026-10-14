/**
 * Turn Resolver
 * Processes turn-end resolution: production, construction, research, combat
 */

import type {
  PlayerId,
  TurnResolutionResult,
  TurnEvent,
  PlayerAction,
  VisionSource,
  TileKey,
} from '@/data/types';
import { TurnEventType } from '@/data/types';
import { VisionCalculator } from './vision-calculator';
import { useBuildingsStore } from '@/stores/game/buildings';
import { useExplorationStore } from '@/stores/game/exploration';
import { useMapStore } from '@/stores/game/map';
import { VISION_CONFIG } from '@/data/config';

/**
 * Turn resolution context
 * Contains all stores and data needed for resolution
 */
export interface TurnResolutionContext {
  turnNumber: number;
  currentPlayerId: PlayerId;
  queuedActions: PlayerAction[];
}

/**
 * Turn Resolver
 * Processes all turn-end events in correct order
 */
export class TurnResolver {
  private visionCalculator: VisionCalculator;

  constructor() {
    this.visionCalculator = new VisionCalculator();
  }

  /**
   * Resolve turn for all players
   * Returns events that occurred during resolution
   */
  async resolveTurn(context: TurnResolutionContext): Promise<TurnResolutionResult> {
    const events: TurnEvent[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Process resource production
      await this.processResourceProduction(context, events);

      // Step 2: Progress construction
      await this.progressConstruction(context, events);

      // Step 3: Progress research
      await this.progressResearch(context, events);

      // Step 4: Train units
      await this.trainUnits(context, events);

      // Step 5: Process unit movements (from queued actions)
      await this.processMovements(context, events);

      // Step 6: Resolve combat (from queued actions)
      await this.resolveCombat(context, events);

      // Step 7: Recalculate vision for all players
      await this.recalculateVision(context, events);

      // Step 8: Update fog of war
      await this.updateFogOfWar(context, events);

      // Step 9: Generate new tiles that entered vision
      await this.generateNewTiles(context, events);

      // Step 10: Check for settlement formation/destruction
      await this.checkSettlements(context, events);

      return {
        success: true,
        events,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error during resolution');

      return {
        success: false,
        events,
        errors,
      };
    }
  }

  /**
   * Step 1: Process resource production based on peasant allocation
   */
  private async processResourceProduction(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    // This will be implemented when we integrate with stores
    // For now, placeholder
    console.log('Processing resource production for turn', context.turnNumber);
  }

  /**
   * Step 2: Progress building construction
   */
  private async progressConstruction(
    context: TurnResolutionContext,
    events: TurnEvent[],
  ): Promise<void> {
    console.log('🏗️ Progressing construction for turn', context.turnNumber);

    const buildingsStore = useBuildingsStore();
    const explorationStore = useExplorationStore();

    // Progress all construction by one turn
    const completedBuildings = buildingsStore.progressConstruction(context.turnNumber);

    // For each completed building, recalculate fog immediately
    for (const building of completedBuildings) {
      console.log(
        `✅ Building completed: ${building.buildingId} at (${building.coordinates.x}, ${building.coordinates.y})`,
      );

      // Immediately recalculate vision for the player who owns this building
      await explorationStore.recalculateVisionNow(building.playerId);

      // Add event for building completion
      events.push({
        type: TurnEventType.BUILDING_COMPLETED,
        playerId: building.playerId,
        turnNumber: context.turnNumber,
        timestamp: new Date(),
        buildingId: building.buildingId,
        coordinates: building.coordinates,
      });
    }

    if (completedBuildings.length > 0) {
      console.log(`🎉 ${completedBuildings.length} building(s) completed this turn`);
    }
  }

  /**
   * Step 3: Progress research
   */
  private async progressResearch(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('Progressing research for turn', context.turnNumber);
  }

  /**
   * Step 4: Train units
   */
  private async trainUnits(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('Training units for turn', context.turnNumber);
  }

  /**
   * Step 5: Process unit movements
   */
  private async processMovements(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('Processing movements for turn', context.turnNumber);
  }

  /**
   * Step 6: Resolve combat
   */
  private async resolveCombat(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('Resolving combat for turn', context.turnNumber);
  }

  /**
   * Step 7: Recalculate vision for all players
   */
  private async recalculateVision(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('🔍 Recalculating vision for turn', context.turnNumber);

    const buildingsStore = useBuildingsStore();
    const buildingsModule = await import('@/data/buildings');
    const ALL_BUILDINGS = buildingsModule.ALL_BUILDINGS;
    type BuildingDefinition = (typeof ALL_BUILDINGS)[number];

    // Get all players (for now, just the current player)
    // TODO: In multiplayer, iterate through all players
    const players = [context.currentPlayerId];

    for (const playerId of players) {
      // Collect vision sources from completed buildings
      const visionSources: VisionSource[] = [];
      const playerBuildings = buildingsStore.getPlayerBuildings(playerId);

      for (const building of playerBuildings) {
        // Get building definition to access vision radius
        const buildingDef = ALL_BUILDINGS.find((b: BuildingDefinition) => b.id === building.buildingId);
        if (!buildingDef) continue;

        const visionSource = this.visionCalculator.createBuildingVisionSource(
          building.entityId,
          building.coordinates,
          buildingDef.visionRadius || VISION_CONFIG.DEFAULT_VISION_RADIUS,
          playerId,
        );
        visionSources.push(visionSource);
      }

      // Calculate vision
      const visionResult = this.visionCalculator.calculateVision(playerId, visionSources);

      console.log(
        `👁️ Player ${playerId}: ${visionResult.visibleTiles.size} visible tiles, ${visionResult.newlyVisible.length} newly revealed`,
      );

      // Store the vision result for fog update step
      (context as any).visionResults = (context as any).visionResults || new Map();
      (context as any).visionResults.set(playerId, visionResult);
    }
  }

  /**
   * Step 8: Update fog of war
   */
  private async updateFogOfWar(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('🌫️ Updating fog of war for turn', context.turnNumber);

    const explorationStore = useExplorationStore();
    const mapStore = useMapStore();
    const fogManager = explorationStore.getFogManager();

    // Get vision results from previous step
    const visionResults = (context as any).visionResults as Map<PlayerId, any>;
    if (!visionResults) {
      console.warn('⚠️ No vision results available for fog update');
      return;
    }

    for (const [playerId, visionResult] of visionResults.entries()) {
      // Get previous vision state (cached in vision calculator)
      const previouslyVisible = this.visionCalculator.getVisibleTiles(playerId);

      // Get all current tiles for snapshot saving
      const currentTiles = new Map();
      for (const tileKey of visionResult.visibleTiles) {
        const tile = mapStore.getTileByKey(tileKey);
        if (tile) {
          currentTiles.set(tileKey, tile);
        }
      }
      for (const tileKey of previouslyVisible) {
        if (!currentTiles.has(tileKey)) {
          const tile = mapStore.getTileByKey(tileKey);
          if (tile) {
            currentTiles.set(tileKey, tile);
          }
        }
      }

      // Update fog of war (reveals new tiles, covers old ones, saves snapshots)
      const fogUpdate = fogManager.updateFog(
        playerId,
        visionResult.visibleTiles,
        previouslyVisible,
        currentTiles,
        context.turnNumber,
      );

      console.log(
        `🌫️ Player ${playerId}: Revealed ${fogUpdate.revealed.length} tiles, covered ${fogUpdate.covered.length} tiles`,
      );
    }
  }

  /**
   * Step 9: Generate new tiles
   */
  private async generateNewTiles(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('🗺️ Generating new tiles for turn', context.turnNumber);

    const mapStore = useMapStore();

    // Get vision results from previous step
    const visionResults = (context as any).visionResults as Map<PlayerId, any>;
    if (!visionResults) {
      console.warn('⚠️ No vision results available for tile generation');
      return;
    }

    // Collect all tiles that need to be generated (from all players)
    const tilesToGenerate = new Set<TileKey>();

    for (const [_playerId, visionResult] of visionResults.entries()) {
      for (const tileKey of visionResult.tilesRequiringGeneration) {
        tilesToGenerate.add(tileKey);
      }
    }

    // Generate tiles that don't exist yet
    const tilesNeedingGeneration: TileKey[] = [];
    for (const tileKey of tilesToGenerate) {
      const existingTile = mapStore.getTileByKey(tileKey);
      if (!existingTile) {
        tilesNeedingGeneration.push(tileKey);
      }
    }

    if (tilesNeedingGeneration.length > 0) {
      mapStore.ensureTilesExist(tilesNeedingGeneration);
      console.log(
        `🗺️ Generated ${tilesNeedingGeneration.length} new tiles (${tilesToGenerate.size} total tiles required)`,
      );
    }
  }

  /**
   * Step 10: Check for settlement formation/destruction
   */
  private async checkSettlements(
    context: TurnResolutionContext,
    _events: TurnEvent[],
  ): Promise<void> {
    console.log('Checking settlements for turn', context.turnNumber);
  }

  /**
   * Get resolution order description
   */
  static getResolutionOrder(): string[] {
    return [
      '1. Process resource production (based on peasant allocation)',
      '2. Progress building construction (decrement turns remaining)',
      '3. Progress research (decrement turns remaining)',
      '4. Train units (complete training)',
      '5. Process unit movements (execute queued moves)',
      '6. Resolve combat (execute queued attacks)',
      '7. Recalculate vision (update vision sources)',
      '8. Update fog of war (save snapshots, update states)',
      '9. Generate new tiles (tiles entering vision)',
      '10. Check settlements (detect wall loops, apply bonuses)',
    ];
  }
}

/**
 * Create turn resolver instance
 */
export function createTurnResolver(): TurnResolver {
  return new TurnResolver();
}
