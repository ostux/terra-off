/**
 * Seeded Random Number Generator
 * Deterministic RNG for reproducible tile generation
 */

/**
 * Simple hash function for seed generation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded Random Number Generator (Mulberry32)
 * Fast, high-quality PRNG that's deterministic
 */
export class SeededRNG {
  private state: number;

  constructor(seed: string | number) {
    if (typeof seed === 'string') {
      this.state = hashString(seed);
    } else {
      this.state = seed;
    }

    // Ensure non-zero state
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /**
   * Get next random number [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Get random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Get random float between min (inclusive) and max (exclusive)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Get random boolean with given probability
   */
  nextBoolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)]!;
  }

  /**
   * Shuffle array in place
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j]!, array[i]!];
    }
    return array;
  }
}

/**
 * Create RNG from seed and coordinates
 * Ensures same coordinates always generate same values
 */
export function createCoordinateRNG(seed: string, x: number, y: number): SeededRNG {
  const coordinateSeed = `${seed}-${x}-${y}`;
  return new SeededRNG(coordinateSeed);
}
