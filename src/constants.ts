import { WeaponType, WeaponDef, Color, PlayerControls } from './types';

// ============================================================
// Game Constants
// ============================================================

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 20;

// Physics
export const GRAVITY = 800;
export const PLAYER_SPEED = 200;
export const PLAYER_JUMP_SPEED = 380;
export const PLAYER_WIDTH = 14;
export const PLAYER_HEIGHT = 28;
export const PLAYER_CROUCH_HEIGHT = 18;
export const MAX_FALL_SPEED = 600;
export const FRICTION = 0.85;

// Gameplay
export const MAX_HEALTH = 100;
export const SPAWN_TIME = 2.0;
export const INVINCIBLE_TIME = 1.5;
export const ROUND_TIME = 120;       // seconds
export const MAX_ROUNDS = 5;
export const KILLS_TO_WIN = 15;
export const GRENADE_DAMAGE = 60;
export const GRENADE_RADIUS = 80;
export const GRENADE_FUSE = 2.0;
export const GRENADE_SPEED = 400;
export const PICKUP_RESPAWN_TIME = 10;
export const SCREEN_SHAKE_DECAY = 8;

// Player colors
export const PLAYER_COLORS: Color[] = [
  { r: 60, g: 140, b: 255 },    // Blue
  { r: 255, g: 60, b: 60 },     // Red
  { r: 60, g: 220, b: 60 },     // Green
  { r: 255, g: 220, b: 40 },    // Yellow
];

// Default controls for 4 players
export const DEFAULT_CONTROLS: PlayerControls[] = [
  { // Player 1 - WASD
    left: 'KeyA',
    right: 'KeyD',
    up: 'KeyW',
    down: 'KeyS',
    shoot: 'KeyF',
    nextWeapon: 'KeyE',
    prevWeapon: 'KeyQ',
    throwGrenade: 'KeyG',
  },
  { // Player 2 - Arrows
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    shoot: 'Numpad0',
    nextWeapon: 'NumpadDecimal',
    prevWeapon: 'Numpad1',
    throwGrenade: 'Numpad2',
  },
  { // Player 3 - IJKL
    left: 'KeyJ',
    right: 'KeyL',
    up: 'KeyI',
    down: 'KeyK',
    shoot: 'KeyH',
    nextWeapon: 'KeyU',
    prevWeapon: 'KeyY',
    throwGrenade: 'KeyN',
  },
  { // Player 4 - CPU by default
    left: '',
    right: '',
    up: '',
    down: '',
    shoot: '',
    nextWeapon: '',
    prevWeapon: '',
    throwGrenade: '',
  },
];

// ============================================================
// Weapon Definitions
// ============================================================

export const WEAPON_DEFS: Record<WeaponType, WeaponDef> = {
  [WeaponType.Pistol]: {
    type: WeaponType.Pistol,
    name: 'Pistol',
    damage: 18,
    fireRate: 4,
    bulletSpeed: 700,
    bulletCount: 1,
    spread: 0.02,
    ammo: -1,
    recoil: 2,
    bulletSize: 3,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 255, g: 255, b: 100 },
    autoFire: false,
    bulletLifetime: 1.5,
    piercing: false,
  },
  [WeaponType.Shotgun]: {
    type: WeaponType.Shotgun,
    name: 'Shotgun',
    damage: 12,
    fireRate: 1.5,
    bulletSpeed: 600,
    bulletCount: 6,
    spread: 0.25,
    ammo: 20,
    recoil: 8,
    bulletSize: 2,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 255, g: 200, b: 100 },
    autoFire: false,
    bulletLifetime: 0.4,
    piercing: false,
  },
  [WeaponType.MachineGun]: {
    type: WeaponType.MachineGun,
    name: 'Machine Gun',
    damage: 10,
    fireRate: 12,
    bulletSpeed: 750,
    bulletCount: 1,
    spread: 0.08,
    ammo: 60,
    recoil: 3,
    bulletSize: 2,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 255, g: 255, b: 150 },
    autoFire: true,
    bulletLifetime: 1.2,
    piercing: false,
  },
  [WeaponType.Sniper]: {
    type: WeaponType.Sniper,
    name: 'Sniper',
    damage: 70,
    fireRate: 0.8,
    bulletSpeed: 1200,
    bulletCount: 1,
    spread: 0,
    ammo: 10,
    recoil: 12,
    bulletSize: 2,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 255, g: 100, b: 100 },
    autoFire: false,
    bulletLifetime: 2.0,
    piercing: true,
  },
  [WeaponType.RocketLauncher]: {
    type: WeaponType.RocketLauncher,
    name: 'Rocket Launcher',
    damage: 50,
    fireRate: 1.2,
    bulletSpeed: 400,
    bulletCount: 1,
    spread: 0,
    ammo: 8,
    recoil: 10,
    bulletSize: 5,
    explosive: true,
    explosionRadius: 70,
    bulletColor: { r: 255, g: 100, b: 50 },
    autoFire: false,
    bulletLifetime: 3.0,
    piercing: false,
  },
  [WeaponType.Flamethrower]: {
    type: WeaponType.Flamethrower,
    name: 'Flamethrower',
    damage: 5,
    fireRate: 30,
    bulletSpeed: 300,
    bulletCount: 1,
    spread: 0.3,
    ammo: 120,
    recoil: 0,
    bulletSize: 4,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 255, g: 150, b: 30 },
    autoFire: true,
    bulletLifetime: 0.3,
    piercing: false,
  },
  [WeaponType.GrenadeLauncher]: {
    type: WeaponType.GrenadeLauncher,
    name: 'Grenade Launcher',
    damage: 40,
    fireRate: 1.5,
    bulletSpeed: 350,
    bulletCount: 1,
    spread: 0,
    ammo: 12,
    recoil: 6,
    bulletSize: 5,
    explosive: true,
    explosionRadius: 60,
    bulletColor: { r: 100, g: 200, b: 50 },
    autoFire: false,
    bulletLifetime: 2.0,
    piercing: false,
  },
  [WeaponType.LaserGun]: {
    type: WeaponType.LaserGun,
    name: 'Laser Gun',
    damage: 25,
    fireRate: 5,
    bulletSpeed: 1000,
    bulletCount: 1,
    spread: 0,
    ammo: 30,
    recoil: 1,
    bulletSize: 2,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 50, g: 255, b: 50 },
    autoFire: true,
    bulletLifetime: 1.0,
    piercing: false,
  },
  [WeaponType.Minigun]: {
    type: WeaponType.Minigun,
    name: 'Minigun',
    damage: 8,
    fireRate: 20,
    bulletSpeed: 700,
    bulletCount: 1,
    spread: 0.12,
    ammo: 100,
    recoil: 2,
    bulletSize: 2,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 255, g: 255, b: 200 },
    autoFire: true,
    bulletLifetime: 1.0,
    piercing: false,
  },
  [WeaponType.PlasmaRifle]: {
    type: WeaponType.PlasmaRifle,
    name: 'Plasma Rifle',
    damage: 30,
    fireRate: 3,
    bulletSpeed: 500,
    bulletCount: 1,
    spread: 0.03,
    ammo: 24,
    recoil: 4,
    bulletSize: 6,
    explosive: false,
    explosionRadius: 0,
    bulletColor: { r: 100, g: 150, b: 255 },
    autoFire: true,
    bulletLifetime: 1.5,
    piercing: false,
  },
};

// Weapons that can spawn as pickups (everything except pistol)
export const PICKUP_WEAPONS: WeaponType[] = [
  WeaponType.Shotgun,
  WeaponType.MachineGun,
  WeaponType.Sniper,
  WeaponType.RocketLauncher,
  WeaponType.Flamethrower,
  WeaponType.GrenadeLauncher,
  WeaponType.LaserGun,
  WeaponType.Minigun,
  WeaponType.PlasmaRifle,
];
