/**
 * Perlin Noise Implementation
 * Used for natural-looking terrain generation
 */

/**
 * Permutation table for Perlin noise
 * Seeded version will be created from game seed
 */
function createPermutationTable(seed: number): number[] {
  const p: number[] = [];

  // Initialize with 0-255
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  // Shuffle using seed
  let state = seed;
  for (let i = 255; i > 0; i--) {
    // Simple seeded random
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = Math.floor((state / 0x7fffffff) * (i + 1));
    [p[i], p[j]] = [p[j]!, p[i]!];
  }

  // Duplicate for wrapping
  return [...p, ...p];
}

/**
 * Perlin Noise Generator
 */
export class PerlinNoise {
  private p: number[];

  constructor(seed: string | number) {
    const numericSeed =
      typeof seed === 'string'
        ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : seed;

    this.p = createPermutationTable(numericSeed);
  }

  /**
   * Fade function for smooth interpolation
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  /**
   * Gradient function
   */
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 2D Perlin noise
   * Returns value between -1 and 1
   */
  noise2D(x: number, y: number): number {
    // Find unit square
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // Find relative coordinates within square
    x -= Math.floor(x);
    y -= Math.floor(y);

    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);

    // Hash coordinates of 4 square corners
    const a = this.p[X]! + Y;
    const aa = this.p[a]!;
    const ab = this.p[a + 1]!;
    const b = this.p[X + 1]! + Y;
    const ba = this.p[b]!;
    const bb = this.p[b + 1]!;

    // Blend results from 4 corners
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[aa]!, x, y), this.grad(this.p[ba]!, x - 1, y)),
      this.lerp(u, this.grad(this.p[ab]!, x, y - 1), this.grad(this.p[bb]!, x - 1, y - 1)),
    );
  }

  /**
   * Octave noise (multiple frequencies combined)
   * Creates more natural-looking terrain
   */
  octaveNoise2D(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    lacunarity: number,
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;

      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Normalized noise (0 to 1)
   */
  normalizedNoise2D(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) / 2;
  }

  /**
   * Normalized octave noise (0 to 1)
   */
  normalizedOctaveNoise2D(
    x: number,
    y: number,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2.0,
  ): number {
    return (this.octaveNoise2D(x, y, octaves, persistence, lacunarity) + 1) / 2;
  }
}

/**
 * Simple noise value mapper
 * Maps noise value to discrete ranges
 */
export function mapNoiseToRange<T>(
  noiseValue: number,
  ranges: Array<{ threshold: number; value: T }>,
): T {
  for (const range of ranges) {
    if (noiseValue < range.threshold) {
      return range.value;
    }
  }
  // Return last value if no match
  return ranges[ranges.length - 1]!.value;
}
