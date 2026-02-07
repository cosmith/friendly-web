import { Vec2, Rect, TileMap } from './types';
import { TILE_SIZE } from './constants';

// ============================================================
// Physics & Collision
// ============================================================

export function tileAt(map: TileMap, x: number, y: number): number {
  const tx = Math.floor(x / TILE_SIZE);
  const ty = Math.floor(y / TILE_SIZE);
  if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return 1;
  return map.tiles[ty][tx];
}

export function isSolid(map: TileMap, x: number, y: number): boolean {
  return tileAt(map, x, y) > 0;
}

export function rectOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Move an entity with AABB collision against the tilemap.
 * Returns the resolved position and whether the entity is on ground.
 */
export function moveAndCollide(
  map: TileMap,
  pos: Vec2,
  vel: Vec2,
  width: number,
  height: number,
  dt: number,
): { pos: Vec2; vel: Vec2; onGround: boolean } {
  const newPos = { x: pos.x, y: pos.y };
  const newVel = { x: vel.x, y: vel.y };
  let onGround = false;

  // Move X
  newPos.x += newVel.x * dt;
  // Check collision on X axis
  const xRect: Rect = { x: newPos.x - width / 2, y: newPos.y - height, w: width, h: height };
  if (checkTileCollision(map, xRect)) {
    // Push back
    if (newVel.x > 0) {
      const tileX = Math.floor((xRect.x + xRect.w) / TILE_SIZE) * TILE_SIZE;
      newPos.x = tileX - width / 2;
    } else if (newVel.x < 0) {
      const tileX = (Math.floor(xRect.x / TILE_SIZE) + 1) * TILE_SIZE;
      newPos.x = tileX + width / 2;
    }
    newVel.x = 0;
  }

  // Move Y
  newPos.y += newVel.y * dt;
  const yRect: Rect = { x: newPos.x - width / 2, y: newPos.y - height, w: width, h: height };
  if (checkTileCollision(map, yRect)) {
    if (newVel.y > 0) {
      // Hitting ground
      const tileY = Math.floor((yRect.y + yRect.h) / TILE_SIZE) * TILE_SIZE;
      newPos.y = tileY;
      onGround = true;
    } else if (newVel.y < 0) {
      // Hitting ceiling
      const tileY = (Math.floor(yRect.y / TILE_SIZE) + 1) * TILE_SIZE;
      newPos.y = tileY + height;
    }
    newVel.y = 0;
  }

  return { pos: newPos, vel: newVel, onGround };
}

function checkTileCollision(map: TileMap, rect: Rect): boolean {
  const left = Math.floor(rect.x / TILE_SIZE);
  const right = Math.floor((rect.x + rect.w - 0.01) / TILE_SIZE);
  const top = Math.floor(rect.y / TILE_SIZE);
  const bottom = Math.floor((rect.y + rect.h - 0.01) / TILE_SIZE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return true;
      if (map.tiles[ty][tx] > 0) return true;
    }
  }
  return false;
}

/**
 * Raycast against the tilemap. Returns hit position or null.
 */
export function raycast(
  map: TileMap,
  origin: Vec2,
  dir: Vec2,
  maxDist: number,
): Vec2 | null {
  const step = TILE_SIZE / 2;
  const steps = Math.ceil(maxDist / step);
  const d = normalize(dir);

  for (let i = 1; i <= steps; i++) {
    const px = origin.x + d.x * step * i;
    const py = origin.y + d.y * step * i;
    if (isSolid(map, px, py)) {
      return { x: px, y: py };
    }
  }
  return null;
}
