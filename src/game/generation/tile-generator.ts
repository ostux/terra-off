/**
 * Tile Generator
 * On-demand, deterministic tile generation based on coordinates and seed
 */

import type { Coordinates, Tile } from '@/data/types';
import { TerrainType, ResourceDepositType } from '@/data/types';
import { MAP_CONFIG } from '@/data/config';
import { PerlinNoise, mapNoiseToRange } from './noise';
import { createCoordinateRNG } from './seeded-rng';

/**
 * Tile Generator
 * Generates tiles deterministically based on seed and coordinates
 */
export class TileGenerator {
  private seed: string;
  private terrainNoise: PerlinNoise;
  private resourceNoise: PerlinNoise;
  private richnessNoise: PerlinNoise;

  constructor(seed: string) {
    this.seed = seed;
    this.terrainNoise = new PerlinNoise(seed);
    this.resourceNoise = new PerlinNoise(seed + '-resources');
    this.richnessNoise = new PerlinNoise(seed + '-richness');
  }

  /**
   * Generate a single tile at coordinates
   * MUST be deterministic: same coordinates = same tile
   */
  generateTile(coords: Coordinates): Tile {
    const terrain = this.generateTerrain(coords);
    const resourceDeposit = this.generateResourceDeposit(coords, terrain);

    return {
      coordinates: coords,
      terrain,
      resourceDeposit,
      building: null,
      soldiers: null,
      generatedAt: new Date(),
      lastModified: new Date(),
    };
  }

  /**
   * Generate terrain type for coordinates
   */
  private generateTerrain(coords: Coordinates): TerrainType {
    // Use multiple octaves for more natural terrain
    const noiseValue = this.terrainNoise.normalizedOctaveNoise2D(
      coords.x * 0.05, // Scale factor for terrain variation
      coords.y * 0.05,
      4, // 4 octaves
      0.5, // persistence
      2.0, // lacunarity
    );

    // Map noise to terrain types based on probabilities
    const ranges = [
      { threshold: 0.1, value: TerrainType.WATER },
      { threshold: 0.15, value: TerrainType.WASTELAND },
      { threshold: 0.20, value: TerrainType.DESERT },
      { threshold: 0.35, value: TerrainType.MOUNTAIN },
      { threshold: 0.6, value: TerrainType.FOREST },
      { threshold: 1.0, value: TerrainType.GRASSLAND },
    ];

    return mapNoiseToRange(noiseValue, ranges);
  }

  /**
   * Generate resource deposit (if any) for coordinates
   */
  private generateResourceDeposit(
    coords: Coordinates,
    terrain: TerrainType,
  ): Tile['resourceDeposit'] {
    // Get probability based on terrain
    const probability = MAP_CONFIG.RESOURCE_DEPOSIT_PROBABILITY[terrain];

    // Use coordinate-based RNG for consistent deposits
    const rng = createCoordinateRNG(this.seed, coords.x, coords.y);

    // Check if tile has resource
    if (!rng.nextBoolean(probability)) {
      return null;
    }

    // Determine resource type based on terrain
    const resourceType = this.selectResourceType(terrain, rng.next());

    if (!resourceType) {
      return null;
    }

    // Determine richness using noise
    const richnessValue = this.richnessNoise.normalizedNoise2D(
      coords.x * 0.1,
      coords.y * 0.1,
    );

    let richness: number;
    if (richnessValue < 0.33) {
      richness = 1; // Poor
    } else if (richnessValue < 0.66) {
      richness = 2; // Normal
    } else {
      richness = 3; // Rich
    }

    return {
      type: resourceType,
      richness,
      depleted: false,
    };
  }

  /**
   * Select resource type based on terrain
   */
  private selectResourceType(terrain: TerrainType, random: number): ResourceDepositType | null {
    switch (terrain) {
      case TerrainType.GRASSLAND:
        return ResourceDepositType.FOOD;

      case TerrainType.FOREST:
        return random < 0.7 ? ResourceDepositType.WOOD : ResourceDepositType.FOOD;

      case TerrainType.MOUNTAIN:
        return random < 0.6 ? ResourceDepositType.STONE : ResourceDepositType.IRON;

      case TerrainType.DESERT:
        return random < 0.5 ? ResourceDepositType.STONE : ResourceDepositType.IRON;

      case TerrainType.WASTELAND:
        return random < 0.7 ? ResourceDepositType.IRON : ResourceDepositType.STONE;

      case TerrainType.WATER:
        return null;

      default:
        return null;
    }
  }

  /**
   * Generate multiple tiles at once (batch generation)
   */
  generateTiles(coordinatesList: Coordinates[]): Map<string, Tile> {
    const tiles = new Map<string, Tile>();

    for (const coords of coordinatesList) {
      const key = `${coords.x},${coords.y}`;
      tiles.set(key, this.generateTile(coords));
    }

    return tiles;
  }

  /**
   * Preview terrain at coordinates (without full tile generation)
   * Useful for minimap rendering
   */
  previewTerrain(coords: Coordinates): TerrainType {
    return this.generateTerrain(coords);
  }
}
