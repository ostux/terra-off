/**
 * Test Utilities
 * Helper functions and mock data for tests
 */

import type { Tile, Coordinates, PlayerId, ResourceAmount } from '@/data/types';
import { TerrainType, FogState } from '@/data/types';

/**
 * Create a mock tile for testing
 */
export function createMockTile(overrides: Partial<Tile> = {}): Tile {
  return {
    coordinates: { x: 0, y: 0 },
    terrain: TerrainType.GRASSLAND,
    resourceDeposit: null,
    building: null,
    soldiers: null,
    generatedAt: new Date(),
    lastModified: new Date(),
    ...overrides,
  };
}

/**
 * Create mock coordinates
 */
export function createCoordinates(x: number, y: number): Coordinates {
  return { x, y };
}

/**
 * Create mock player ID
 */
export function createPlayerId(id: string = 'player-1'): PlayerId {
  return id as PlayerId;
}

/**
 * Create mock resources
 */
export function createResources(overrides: Partial<ResourceAmount> = {}): ResourceAmount {
  return {
    FOOD: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
    ...overrides,
  };
}

/**
 * Assert that two resource amounts are equal
 */
export function expectResources(
  actual: ResourceAmount,
  expected: Partial<ResourceAmount>
): void {
  const expectedFull = createResources(expected);
  expect(actual.FOOD).toBe(expectedFull.FOOD);
  expect(actual.WOOD).toBe(expectedFull.WOOD);
  expect(actual.STONE).toBe(expectedFull.STONE);
  expect(actual.IRON).toBe(expectedFull.IRON);
}
