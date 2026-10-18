/**
 * WaveFunctionCollapse Core Algorithm
 * Exact implementation of Maxim Gumin's Model.cs
 * Source: https://github.com/mxgmn/WaveFunctionCollapse/blob/master/Model.cs
 */

export type Heuristic = "Entropy" | "MRV" | "Scanline";

export class WfcModel {
  MX: number; // Width in tiles
  MY: number; // Height in tiles
  T: number; // Number of tile types / patterns
  periodic: boolean;
  heuristic: Heuristic;

  // Wave state: wave[cellIndex][tileType] === true if tileType is still possible
  wave: boolean[][];
  // Propagator: propagator[direction][tileA] = array of allowed tileB in neighbor
  // Directions: 0 = Left (-1, 0), 1 = Down (0, 1), 2 = Right (1, 0), 3 = Up (0, -1)
  propagator: number[][][];
  // Compatible: compatible[cellIndex][tileType][direction] = number of compatible patterns in neighbor
  compatible: number[][][];
  // Observed: observed[cellIndex] = final tile index chosen (-1 if unobserved)
  observed: number[];

  // Undo / Ban stack for AC-4 constraint propagation
  stack: [cellIndex: number, tileIndex: number][];
  stacksize: number;
  observedSoFar: number;

  // Pattern weights and precomputed Shannon entropy components
  weights: number[];
  weightLogWeights: number[];
  distribution: number[];
  sumsOfOnes: number[];
  sumOfWeights: number;
  sumOfWeightLogWeights: number;
  startingEntropy: number;
  sumsOfWeights: number[];
  sumsOfWeightLogWeights: number[];
  entropies: number[];

  // Opposite direction mapping:
  // Left (0) <-> Right (2)
  // Down (1) <-> Up (3)
  static dx = [-1, 0, 1, 0];
  static dy = [0, 1, 0, -1];
  static opposite = [2, 3, 0, 1];

  constructor(
    width: number,
    height: number,
    numTiles: number,
    weights: number[],
    propagator: number[][][],
    periodic = false,
    heuristic: Heuristic = "Entropy",
  ) {
    this.MX = width;
    this.MY = height;
    this.T = numTiles;
    this.weights = weights;
    this.propagator = propagator;
    this.periodic = periodic;
    this.heuristic = heuristic;

    const totalCells = width * height;
    this.wave = [];
    this.compatible = [];
    for (let i = 0; i < totalCells; i++) {
      this.wave[i] = new Array(this.T).fill(false);
      this.compatible[i] = [];
      for (let t = 0; t < this.T; t++) {
        this.compatible[i][t] = [0, 0, 0, 0];
      }
    }

    this.distribution = new Array(this.T).fill(0);
    this.observed = new Array(totalCells).fill(-1);

    this.weightLogWeights = new Array(this.T).fill(0);
    this.sumOfWeights = 0;
    this.sumOfWeightLogWeights = 0;

    for (let t = 0; t < this.T; t++) {
      const w = this.weights[t];
      this.weightLogWeights[t] = w * Math.log(w > 0 ? w : 1e-6);
      this.sumOfWeights += w;
      this.sumOfWeightLogWeights += this.weightLogWeights[t];
    }

    this.startingEntropy =
      Math.log(this.sumOfWeights) -
      this.sumOfWeightLogWeights / this.sumOfWeights;

    this.sumsOfOnes = new Array(totalCells).fill(0);
    this.sumsOfWeights = new Array(totalCells).fill(0);
    this.sumsOfWeightLogWeights = new Array(totalCells).fill(0);
    this.entropies = new Array(totalCells).fill(0);

    this.stack = new Array(totalCells * this.T);
    this.stacksize = 0;
    this.observedSoFar = 0;
  }

  // Clear wave and initialize entropy tracking
  clear(): void {
    const totalCells = this.MX * this.MY;
    for (let i = 0; i < totalCells; i++) {
      for (let t = 0; t < this.T; t++) {
        this.wave[i][t] = true;
        for (let d = 0; d < 4; d++) {
          this.compatible[i][t][d] =
            this.propagator[WfcModel.opposite[d]][t].length;
        }
      }

      this.sumsOfOnes[i] = this.T;
      this.sumsOfWeights[i] = this.sumOfWeights;
      this.sumsOfWeightLogWeights[i] = this.sumOfWeightLogWeights;
      this.entropies[i] = this.startingEntropy;
      this.observed[i] = -1;
    }

    this.stacksize = 0;
    this.observedSoFar = 0;

    // Boundary constraint banning for non-periodic boundaries
    if (!this.periodic) {
      for (let y = 0; y < this.MY; y++) {
        for (let x = 0; x < this.MX; x++) {
          const i = x + y * this.MX;
          for (let t = 0; t < this.T; t++) {
            const noNeighborsLeft =
              x === 0 && this.propagator[0][t].length === 0;
            const noNeighborsBottom =
              y === this.MY - 1 && this.propagator[1][t].length === 0;
            const noNeighborsRight =
              x === this.MX - 1 && this.propagator[2][t].length === 0;
            const noNeighborsTop =
              y === 0 && this.propagator[3][t].length === 0;

            if (
              noNeighborsLeft ||
              noNeighborsBottom ||
              noNeighborsRight ||
              noNeighborsTop
            ) {
              this.ban(i, t);
            }
          }
        }
      }
    }

    if (this.stacksize > 0) {
      this.propagate();
    }
  }

  // Ban a pattern at cell i and register for AC-4 propagation
  ban(i: number, t: number): void {
    this.wave[i][t] = false;

    for (let d = 0; d < 4; d++) {
      this.compatible[i][t][d] = 0;
    }

    this.stack[this.stacksize] = [i, t];
    this.stacksize++;

    this.sumsOfOnes[i] -= 1;
    this.sumsOfWeights[i] -= this.weights[t];
    this.sumsOfWeightLogWeights[i] -= this.weightLogWeights[t];

    const sum = this.sumsOfWeights[i];
    this.entropies[i] =
      sum > 0 ? Math.log(sum) - this.sumsOfWeightLogWeights[i] / sum : 0;
  }

  // Propagate banned patterns across the grid using AC-4 algorithm
  propagate(): boolean {
    while (this.stacksize > 0) {
      const [i1, t1] = this.stack[this.stacksize - 1];
      this.stacksize--;

      const x1 = i1 % this.MX;
      const y1 = Math.floor(i1 / this.MX);

      for (let d = 0; d < 4; d++) {
        let x2 = x1 + WfcModel.dx[d];
        let y2 = y1 + WfcModel.dy[d];

        if (!this.periodic && (x2 < 0 || y2 < 0 || x2 >= this.MX || y2 >= this.MY)) {
          continue;
        }

        if (x2 < 0) x2 += this.MX;
        else if (x2 >= this.MX) x2 -= this.MX;
        if (y2 < 0) y2 += this.MY;
        else if (y2 >= this.MY) y2 -= this.MY;

        const i2 = x2 + y2 * this.MX;
        const p = this.propagator[d][t1];
        const compat = this.compatible[i2];

        for (let l = 0; l < p.length; l++) {
          const t2 = p[l];
          const comp = compat[t2];

          comp[d]--;
          if (comp[d] === 0) {
            this.ban(i2, t2);
            // Contradiction detected: cell has 0 remaining patterns
            if (this.sumsOfOnes[i2] === 0) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  // Find the next cell to observe using Minimum Shannon Entropy with random noise
  nextUnobservedNode(rng: () => number): number {
    if (this.heuristic === "Scanline") {
      const totalCells = this.MX * this.MY;
      for (let i = this.observedSoFar; i < totalCells; i++) {
        if (this.sumsOfOnes[i] > 1) {
          this.observedSoFar = i + 1;
          return i;
        }
      }
      return -1;
    }

    let min = 1e9;
    let argmin = -1;
    const totalCells = this.MX * this.MY;

    for (let i = 0; i < totalCells; i++) {
      const remainingValues = this.sumsOfOnes[i];
      if (remainingValues > 1) {
        const entropy = this.entropies[i];
        const noise = 1e-6 * rng();
        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }

    return argmin;
  }

  // Collapse cell to a single pattern sampled by weights
  observe(node: number, rng: () => number): void {
    const w = this.wave[node];
    let totalWeight = 0;
    for (let t = 0; t < this.T; t++) {
      this.distribution[t] = w[t] ? this.weights[t] : 0.0;
      totalWeight += this.distribution[t];
    }

    // Sample from distribution
    let r = 0;
    let roll = rng() * totalWeight;
    for (let t = 0; t < this.T; t++) {
      if (this.distribution[t] > 0) {
        roll -= this.distribution[t];
        if (roll <= 0) {
          r = t;
          break;
        }
      }
    }

    // Ban all other patterns in this cell
    for (let t = 0; t < this.T; t++) {
      if (w[t] !== (t === r)) {
        this.ban(node, t);
      }
    }
  }

  // Run the full WFC constraint satisfaction solver
  run(seed: number, limit = -1, clearState = true): boolean {
    if (clearState) {
      this.clear();
    } else {
      const initSuccess = this.propagate();
      if (!initSuccess) return false;
    }

    // Mulberry32 deterministic PRNG
    let s = seed | 0;
    const rng = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let iterations = 0;
    while (limit < 0 || iterations < limit) {
      iterations++;
      const node = this.nextUnobservedNode(rng);
      if (node >= 0) {
        this.observe(node, rng);
        const success = this.propagate();
        if (!success) {
          return false; // Contradiction
        }
      } else {
        // Success: all cells collapsed
        const totalCells = this.MX * this.MY;
        for (let i = 0; i < totalCells; i++) {
          for (let t = 0; t < this.T; t++) {
            if (this.wave[i][t]) {
              this.observed[i] = t;
              break;
            }
          }
        }
        return true;
      }
    }

    return true;
  }
}
