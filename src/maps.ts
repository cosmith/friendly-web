import { TileMap } from './types';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from './constants';

// ============================================================
// Arena Maps
// ============================================================

const COLS = Math.floor(GAME_WIDTH / TILE_SIZE);  // 40
const ROWS = Math.floor(GAME_HEIGHT / TILE_SIZE);  // 30

function createEmptyGrid(): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < ROWS; y++) {
    grid.push(new Array(COLS).fill(0));
  }
  return grid;
}

function setTile(grid: number[][], x: number, y: number, val: number = 1): void {
  if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
    grid[y][x] = val;
  }
}

function fillRow(grid: number[][], y: number, x1: number, x2: number, val: number = 1): void {
  for (let x = x1; x <= x2; x++) setTile(grid, x, y, val);
}

function fillCol(grid: number[][], x: number, y1: number, y2: number, val: number = 1): void {
  for (let y = y1; y <= y2; y++) setTile(grid, x, y, val);
}

function addBorder(grid: number[][]): void {
  fillRow(grid, 0, 0, COLS - 1, 2);
  fillRow(grid, ROWS - 1, 0, COLS - 1, 2);
  fillCol(grid, 0, 0, ROWS - 1, 2);
  fillCol(grid, COLS - 1, 0, ROWS - 1, 2);
}

// ---- Map 1: Classic Arena ----
function createClassicArena(): TileMap {
  const grid = createEmptyGrid();
  addBorder(grid);

  // Ground platforms
  fillRow(grid, 25, 5, 15);
  fillRow(grid, 25, 24, 34);
  // Mid platforms
  fillRow(grid, 20, 10, 18);
  fillRow(grid, 20, 22, 30);
  // Upper platforms
  fillRow(grid, 15, 4, 10);
  fillRow(grid, 15, 16, 24);
  fillRow(grid, 15, 30, 36);
  // Top platforms
  fillRow(grid, 10, 12, 20);
  fillRow(grid, 10, 26, 32);
  // Very top
  fillRow(grid, 6, 17, 23);

  return {
    name: 'Classic Arena',
    width: COLS,
    height: ROWS,
    tileSize: TILE_SIZE,
    tiles: grid,
    spawnPoints: [
      { x: 8 * TILE_SIZE, y: 24 * TILE_SIZE },
      { x: 30 * TILE_SIZE, y: 24 * TILE_SIZE },
      { x: 14 * TILE_SIZE, y: 14 * TILE_SIZE },
      { x: 32 * TILE_SIZE, y: 14 * TILE_SIZE },
    ],
    pickupSpots: [
      { x: 14 * TILE_SIZE, y: 19 * TILE_SIZE },
      { x: 26 * TILE_SIZE, y: 19 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 5 * TILE_SIZE },
      { x: 7 * TILE_SIZE, y: 14 * TILE_SIZE },
      { x: 33 * TILE_SIZE, y: 14 * TILE_SIZE },
    ],
    background: { r: 20, g: 20, b: 40 },
    tileColors: [
      { r: 0, g: 0, b: 0 },         // 0 = empty (unused)
      { r: 100, g: 100, b: 120 },    // 1 = platform
      { r: 70, g: 70, b: 90 },       // 2 = border
    ],
  };
}

// ---- Map 2: Towers ----
function createTowers(): TileMap {
  const grid = createEmptyGrid();
  addBorder(grid);

  // Floor
  fillRow(grid, 28, 1, COLS - 2);
  // Left tower
  fillCol(grid, 6, 12, 27);
  fillCol(grid, 7, 12, 27);
  fillRow(grid, 12, 4, 9);
  // Right tower
  fillCol(grid, 32, 12, 27);
  fillCol(grid, 33, 12, 27);
  fillRow(grid, 12, 31, 36);
  // Center platform stack
  fillRow(grid, 23, 15, 25);
  fillRow(grid, 18, 17, 23);
  fillRow(grid, 13, 15, 25);
  fillRow(grid, 8, 18, 22);
  // Bridges
  fillRow(grid, 16, 8, 14);
  fillRow(grid, 16, 26, 32);

  return {
    name: 'Towers',
    width: COLS,
    height: ROWS,
    tileSize: TILE_SIZE,
    tiles: grid,
    spawnPoints: [
      { x: 3 * TILE_SIZE, y: 27 * TILE_SIZE },
      { x: 36 * TILE_SIZE, y: 27 * TILE_SIZE },
      { x: 5 * TILE_SIZE, y: 11 * TILE_SIZE },
      { x: 34 * TILE_SIZE, y: 11 * TILE_SIZE },
    ],
    pickupSpots: [
      { x: 20 * TILE_SIZE, y: 22 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 12 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 7 * TILE_SIZE },
      { x: 11 * TILE_SIZE, y: 15 * TILE_SIZE },
      { x: 29 * TILE_SIZE, y: 15 * TILE_SIZE },
    ],
    background: { r: 25, g: 15, b: 30 },
    tileColors: [
      { r: 0, g: 0, b: 0 },
      { r: 120, g: 80, b: 100 },
      { r: 80, g: 50, b: 70 },
    ],
  };
}

// ---- Map 3: Cavern ----
function createCavern(): TileMap {
  const grid = createEmptyGrid();
  addBorder(grid);

  // Uneven ground
  fillRow(grid, 27, 1, 8);
  fillRow(grid, 28, 9, 12);
  fillRow(grid, 27, 13, 27);
  fillRow(grid, 28, 28, 31);
  fillRow(grid, 27, 32, COLS - 2);
  // Stalactites (top)
  fillCol(grid, 10, 1, 4);
  fillCol(grid, 20, 1, 6);
  fillCol(grid, 30, 1, 3);
  // Platforms
  fillRow(grid, 22, 3, 9);
  fillRow(grid, 22, 31, 37);
  fillRow(grid, 18, 12, 20);
  fillRow(grid, 18, 22, 28);
  fillRow(grid, 14, 5, 11);
  fillRow(grid, 14, 29, 35);
  fillRow(grid, 10, 14, 26);
  // Center pillar
  fillCol(grid, 19, 19, 26);
  fillCol(grid, 20, 19, 26);
  fillCol(grid, 21, 19, 26);

  return {
    name: 'Cavern',
    width: COLS,
    height: ROWS,
    tileSize: TILE_SIZE,
    tiles: grid,
    spawnPoints: [
      { x: 5 * TILE_SIZE, y: 21 * TILE_SIZE },
      { x: 35 * TILE_SIZE, y: 21 * TILE_SIZE },
      { x: 15 * TILE_SIZE, y: 9 * TILE_SIZE },
      { x: 25 * TILE_SIZE, y: 9 * TILE_SIZE },
    ],
    pickupSpots: [
      { x: 16 * TILE_SIZE, y: 17 * TILE_SIZE },
      { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
      { x: 8 * TILE_SIZE, y: 13 * TILE_SIZE },
      { x: 32 * TILE_SIZE, y: 13 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 9 * TILE_SIZE },
    ],
    background: { r: 15, g: 20, b: 15 },
    tileColors: [
      { r: 0, g: 0, b: 0 },
      { r: 80, g: 100, b: 70 },
      { r: 60, g: 75, b: 50 },
    ],
  };
}

// ---- Map 4: Sky Fortress ----
function createSkyFortress(): TileMap {
  const grid = createEmptyGrid();
  addBorder(grid);

  // Floating platforms - no floor!
  // Bottom level
  fillRow(grid, 26, 3, 8);
  fillRow(grid, 26, 16, 24);
  fillRow(grid, 26, 32, 37);
  // Mid level
  fillRow(grid, 21, 7, 13);
  fillRow(grid, 21, 27, 33);
  // Center
  fillRow(grid, 18, 16, 24);
  // Upper
  fillRow(grid, 14, 3, 9);
  fillRow(grid, 14, 31, 37);
  fillRow(grid, 11, 14, 26);
  // Top
  fillRow(grid, 7, 8, 14);
  fillRow(grid, 7, 26, 32);
  fillRow(grid, 4, 17, 23);

  return {
    name: 'Sky Fortress',
    width: COLS,
    height: ROWS,
    tileSize: TILE_SIZE,
    tiles: grid,
    spawnPoints: [
      { x: 5 * TILE_SIZE, y: 25 * TILE_SIZE },
      { x: 35 * TILE_SIZE, y: 25 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 17 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 10 * TILE_SIZE },
    ],
    pickupSpots: [
      { x: 20 * TILE_SIZE, y: 25 * TILE_SIZE },
      { x: 10 * TILE_SIZE, y: 20 * TILE_SIZE },
      { x: 30 * TILE_SIZE, y: 20 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 3 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 10 * TILE_SIZE },
    ],
    background: { r: 30, g: 30, b: 50 },
    tileColors: [
      { r: 0, g: 0, b: 0 },
      { r: 90, g: 90, b: 140 },
      { r: 60, g: 60, b: 100 },
    ],
  };
}

// ---- Map 5: Warehouse ----
function createWarehouse(): TileMap {
  const grid = createEmptyGrid();
  addBorder(grid);

  // Floor
  fillRow(grid, 28, 1, COLS - 2);
  // Crate stacks (left)
  fillRow(grid, 27, 3, 4); fillRow(grid, 26, 3, 4);
  fillRow(grid, 27, 8, 9); fillRow(grid, 26, 8, 9); fillRow(grid, 25, 8, 9);
  // Crate stacks (right)
  fillRow(grid, 27, 35, 36); fillRow(grid, 26, 35, 36);
  fillRow(grid, 27, 30, 31); fillRow(grid, 26, 30, 31); fillRow(grid, 25, 30, 31);
  // Shelves
  fillRow(grid, 22, 2, 12);
  fillRow(grid, 22, 28, 38);
  fillRow(grid, 16, 6, 16);
  fillRow(grid, 16, 24, 34);
  fillRow(grid, 10, 2, 12);
  fillRow(grid, 10, 28, 38);
  // Center catwalks
  fillRow(grid, 19, 16, 24);
  fillRow(grid, 13, 14, 26);
  fillRow(grid, 7, 16, 24);

  return {
    name: 'Warehouse',
    width: COLS,
    height: ROWS,
    tileSize: TILE_SIZE,
    tiles: grid,
    spawnPoints: [
      { x: 6 * TILE_SIZE, y: 21 * TILE_SIZE },
      { x: 34 * TILE_SIZE, y: 21 * TILE_SIZE },
      { x: 6 * TILE_SIZE, y: 9 * TILE_SIZE },
      { x: 34 * TILE_SIZE, y: 9 * TILE_SIZE },
    ],
    pickupSpots: [
      { x: 20 * TILE_SIZE, y: 18 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 12 * TILE_SIZE },
      { x: 20 * TILE_SIZE, y: 6 * TILE_SIZE },
      { x: 10 * TILE_SIZE, y: 15 * TILE_SIZE },
      { x: 30 * TILE_SIZE, y: 15 * TILE_SIZE },
    ],
    background: { r: 30, g: 25, b: 20 },
    tileColors: [
      { r: 0, g: 0, b: 0 },
      { r: 130, g: 100, b: 70 },
      { r: 90, g: 70, b: 50 },
    ],
  };
}

export const ALL_MAPS: TileMap[] = [
  createClassicArena(),
  createTowers(),
  createCavern(),
  createSkyFortress(),
  createWarehouse(),
];
