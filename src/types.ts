// ============================================================
// Core Types for Friendly Strike Web
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Player-related types
export interface PlayerConfig {
  name: string;
  color: Color;
  controls: PlayerControls;
  isAI: boolean;
  aiDifficulty: AIDifficulty;
}

export interface PlayerControls {
  left: string;
  right: string;
  up: string;    // jump
  down: string;  // crouch / aim down
  shoot: string;
  nextWeapon: string;
  prevWeapon: string;
  throwGrenade: string;
}

export enum AIDifficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2,
  Expert = 3,
}

export enum PlayerState {
  Alive,
  Dead,
  Spawning,
}

export interface Player {
  id: number;
  config: PlayerConfig;
  state: PlayerState;
  pos: Vec2;
  vel: Vec2;
  facing: number; // -1 left, 1 right
  aimAngle: number;
  onGround: boolean;
  health: number;
  maxHealth: number;
  weapons: WeaponInstance[];
  currentWeaponIndex: number;
  grenades: number;
  score: number;
  deaths: number;
  spawnTimer: number;
  invincibleTimer: number;
  hitFlashTimer: number;
  crouching: boolean;
}

// Weapon types
export enum WeaponType {
  Pistol = 'pistol',
  Shotgun = 'shotgun',
  MachineGun = 'machinegun',
  Sniper = 'sniper',
  RocketLauncher = 'rocket',
  Flamethrower = 'flamethrower',
  GrenadeLauncher = 'grenadelauncher',
  LaserGun = 'laser',
  Minigun = 'minigun',
  PlasmaRifle = 'plasma',
}

export interface WeaponDef {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number;        // shots per second
  bulletSpeed: number;
  bulletCount: number;     // for shotgun spread
  spread: number;          // angle spread in radians
  ammo: number;            // max ammo, -1 for infinite
  recoil: number;
  bulletSize: number;
  explosive: boolean;
  explosionRadius: number;
  bulletColor: Color;
  autoFire: boolean;
  bulletLifetime: number;  // in seconds
  piercing: boolean;
}

export interface WeaponInstance {
  def: WeaponDef;
  ammo: number;
  cooldown: number;
}

// Projectile
export interface Projectile {
  id: number;
  ownerId: number;
  pos: Vec2;
  vel: Vec2;
  weaponDef: WeaponDef;
  lifetime: number;
  active: boolean;
}

// Particles
export interface Particle {
  pos: Vec2;
  vel: Vec2;
  color: Color;
  size: number;
  lifetime: number;
  maxLifetime: number;
  gravity: boolean;
}

// Pickups
export enum PickupType {
  Weapon,
  Health,
  Grenade,
}

export interface Pickup {
  pos: Vec2;
  type: PickupType;
  weaponType?: WeaponType;
  active: boolean;
  respawnTimer: number;
  bobOffset: number;
}

// Map / Arena
export interface TileMap {
  name: string;
  width: number;        // in tiles
  height: number;       // in tiles
  tileSize: number;
  tiles: number[][];    // 0 = empty, 1+ = solid tile types
  spawnPoints: Vec2[];
  pickupSpots: Vec2[];
  background: Color;
  tileColors: Color[];  // color per tile type
}

// Game state
export enum GamePhase {
  Menu,
  Playing,
  RoundEnd,
  GameOver,
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  projectiles: Projectile[];
  particles: Particle[];
  pickups: Pickup[];
  currentMap: TileMap;
  roundTime: number;
  maxRoundTime: number;
  roundNumber: number;
  maxRounds: number;
  nextProjectileId: number;
  screenShake: number;
  gravity: number;
}

// Input
export interface InputState {
  keysDown: Set<string>;
  keysPressed: Set<string>;
  keysReleased: Set<string>;
}

// Menu
export enum MenuScreen {
  Main,
  PlayerSetup,
  MapSelect,
  Controls,
}

export interface MenuItem {
  label: string;
  action: () => void;
}
