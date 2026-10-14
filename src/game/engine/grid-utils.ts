/**
 * Grid Coordinate System Utilities
 * Square grid operations: distance, neighbors, radius, pathfinding
 */

import { toTileKey, type Coordinates, type TileKey } from '@/data/types';

/**
 * Direction types for neighbor calculation
 */
export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
  NORTHEAST = 'NORTHEAST',
  NORTHWEST = 'NORTHWEST',
  SOUTHEAST = 'SOUTHEAST',
  SOUTHWEST = 'SOUTHWEST',
}

/**
 * Direction vectors for 4-directional movement
 */
const _CARDINAL_DIRECTIONS: Record<Direction, Coordinates> = {
  [Direction.NORTH]: { x: 0, y: -1 },
  [Direction.SOUTH]: { x: 0, y: 1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.WEST]: { x: -1, y: 0 },
  [Direction.NORTHEAST]: { x: 1, y: -1 },
  [Direction.NORTHWEST]: { x: -1, y: -1 },
  [Direction.SOUTHEAST]: { x: 1, y: 1 },
  [Direction.SOUTHWEST]: { x: -1, y: 1 },
};

/**
 * Get cardinal (4-directional) neighbors
 */
export function getCardinalNeighbors(coords: Coordinates): Coordinates[] {
  return [
    { x: coords.x, y: coords.y - 1 }, // North
    { x: coords.x, y: coords.y + 1 }, // South
    { x: coords.x + 1, y: coords.y }, // East
    { x: coords.x - 1, y: coords.y }, // West
  ];
}

/**
 * Get all 8-directional neighbors
 */
export function getAllNeighbors(coords: Coordinates): Coordinates[] {
  return [
    { x: coords.x, y: coords.y - 1 }, // North
    { x: coords.x, y: coords.y + 1 }, // South
    { x: coords.x + 1, y: coords.y }, // East
    { x: coords.x - 1, y: coords.y }, // West
    { x: coords.x + 1, y: coords.y - 1 }, // Northeast
    { x: coords.x - 1, y: coords.y - 1 }, // Northwest
    { x: coords.x + 1, y: coords.y + 1 }, // Southeast
    { x: coords.x - 1, y: coords.y + 1 }, // Southwest
  ];
}

/**
 * Calculate Manhattan distance (taxicab distance)
 * Used for grid-based movement cost
 */
export function getManhattanDistance(a: Coordinates, b: Coordinates): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Calculate Euclidean distance (straight-line distance)
 * Used for vision radius calculations
 */
export function getEuclideanDistance(a: Coordinates, b: Coordinates): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Chebyshev distance (chessboard distance)
 * Maximum of absolute differences
 */
export function getChebyshevDistance(a: Coordinates, b: Coordinates): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Get all tiles within a given radius (Manhattan distance)
 * Used for vision calculations
 */
export function getTilesInRadius(center: Coordinates, radius: number): TileKey[] {
  const tiles: TileKey[] = [];

  for (let x = center.x - radius; x <= center.x + radius; x++) {
    for (let y = center.y - radius; y <= center.y + radius; y++) {
      const coords = { x, y };
      if (getManhattanDistance(center, coords) <= radius) {
        tiles.push(toTileKey(x, y));
      }
    }
  }

  return tiles;
}

/**
 * Get all tiles within a given radius (Euclidean distance)
 * Creates a circular area
 */
export function getTilesInCircularRadius(center: Coordinates, radius: number): TileKey[] {
  const tiles: TileKey[] = [];

  for (let x = center.x - radius; x <= center.x + radius; x++) {
    for (let y = center.y - radius; y <= center.y + radius; y++) {
      const coords = { x, y };
      if (getEuclideanDistance(center, coords) <= radius) {
        tiles.push(toTileKey(x, y));
      }
    }
  }

  return tiles;
}

/**
 * Check if two coordinates are equal
 */
export function coordinatesEqual(a: Coordinates, b: Coordinates): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Check if a coordinate is within bounds
 */
export function isInBounds(coords: Coordinates, minX: number, minY: number, maxX: number, maxY: number): boolean {
  return coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY;
}

/**
 * Get direction from one coordinate to another
 */
export function getDirection(from: Coordinates, to: Coordinates): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === -1) return Direction.NORTH;
  if (dx === 0 && dy === 1) return Direction.SOUTH;
  if (dx === 1 && dy === 0) return Direction.EAST;
  if (dx === -1 && dy === 0) return Direction.WEST;
  if (dx === 1 && dy === -1) return Direction.NORTHEAST;
  if (dx === -1 && dy === -1) return Direction.NORTHWEST;
  if (dx === 1 && dy === 1) return Direction.SOUTHEAST;
  if (dx === -1 && dy === 1) return Direction.SOUTHWEST;

  return null;
}

/**
 * A* Pathfinding node
 */
interface AStarNode {
  coords: Coordinates;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: AStarNode | null;
}

/**
 * A* pathfinding algorithm
 * Returns path from start to goal, or null if no path exists
 *
 * @param start Starting coordinates
 * @param goal Goal coordinates
 * @param isWalkable Function to check if a tile is walkable
 * @param maxIterations Maximum iterations to prevent infinite loops
 */
export function findPath(
  start: Coordinates,
  goal: Coordinates,
  isWalkable: (coords: Coordinates) => boolean,
  maxIterations = 1000,
): Coordinates[] | null {
  const openSet = new Map<TileKey, AStarNode>();
  const closedSet = new Set<TileKey>();

  const startNode: AStarNode = {
    coords: start,
    g: 0,
    h: getManhattanDistance(start, goal),
    f: getManhattanDistance(start, goal),
    parent: null,
  };

  openSet.set(toTileKey(start.x, start.y), startNode);

  let iterations = 0;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f score
    let currentNode: AStarNode | null = null;
    let lowestF = Infinity;

    for (const node of openSet.values()) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentNode = node;
      }
    }

    if (!currentNode) break;

    // Goal reached
    if (coordinatesEqual(currentNode.coords, goal)) {
      return reconstructPath(currentNode);
    }

    const currentKey = toTileKey(currentNode.coords.x, currentNode.coords.y);
    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Check neighbors
    const neighbors = getCardinalNeighbors(currentNode.coords);

    for (const neighborCoords of neighbors) {
      const neighborKey = toTileKey(neighborCoords.x, neighborCoords.y);

      if (closedSet.has(neighborKey)) continue;
      if (!isWalkable(neighborCoords)) continue;

      const tentativeG = currentNode.g + 1;

      const existingNode = openSet.get(neighborKey);

      if (!existingNode || tentativeG < existingNode.g) {
        const h = getManhattanDistance(neighborCoords, goal);
        const newNode: AStarNode = {
          coords: neighborCoords,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: currentNode,
        };

        openSet.set(neighborKey, newNode);
      }
    }
  }

  // No path found
  return null;
}

/**
 * Reconstruct path from A* node
 */
function reconstructPath(node: AStarNode): Coordinates[] {
  const path: Coordinates[] = [];
  let current: AStarNode | null = node;

  while (current !== null) {
    path.unshift(current.coords);
    current = current.parent;
  }

  return path;
}

/**
 * Get tiles along a line (Bresenham's line algorithm)
 * Used for line of sight calculations
 */
export function getTilesOnLine(from: Coordinates, to: Coordinates): TileKey[] {
  const tiles: TileKey[] = [];

  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    tiles.push(toTileKey(x0, y0));

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }

    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return tiles;
}

/**
 * Get all tiles in a rectangular area
 */
export function getTilesInRectangle(
  topLeft: Coordinates,
  bottomRight: Coordinates,
): TileKey[] {
  const tiles: TileKey[] = [];

  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push(toTileKey(x, y));
    }
  }

  return tiles;
}
