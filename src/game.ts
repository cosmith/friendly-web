import {
  GameState, GamePhase, Player, PlayerState, Projectile, Particle,
  Pickup, PickupType, WeaponType, WeaponInstance, Vec2, Color,
  MenuScreen, AIDifficulty, TileMap,
} from './types';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, PLAYER_JUMP_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT, MAX_FALL_SPEED,
  FRICTION, MAX_HEALTH, SPAWN_TIME, INVINCIBLE_TIME, ROUND_TIME,
  MAX_ROUNDS, KILLS_TO_WIN, GRENADE_DAMAGE, GRENADE_RADIUS,
  GRENADE_FUSE, GRENADE_SPEED, PICKUP_RESPAWN_TIME, SCREEN_SHAKE_DECAY,
  PLAYER_COLORS, DEFAULT_CONTROLS, WEAPON_DEFS, PICKUP_WEAPONS, TILE_SIZE,
} from './constants';
import { moveAndCollide, dist, isSolid, rectOverlap } from './physics';
import { InputManager } from './input';
import { Renderer } from './renderer';
import { AIController } from './ai';
import { ALL_MAPS } from './maps';
import { SoundManager } from './sound';

// ============================================================
// Main Game Class
// ============================================================

export class Game {
  private renderer: Renderer;
  private input: InputManager;
  private ai: AIController;
  private sound: SoundManager;
  private state: GameState;
  private lastTime: number = 0;

  // Menu state
  private menuScreen: MenuScreen = MenuScreen.Main;
  private menuIndex: number = 0;
  private mapSelectIndex: number = 0;
  private setupSelectedRow: number = 0;
  private setupSelectedCol: number = 0;
  private playerSetup: Array<{ name: string; isAI: boolean; enabled: boolean; color: Color }>;

  // Round-end
  private roundEndTimer: number = 0;
  private roundWinner: Player | null = null;

  // Explosions for rendering
  private explosions: Array<{ x: number; y: number; radius: number; timer: number; maxTime: number }> = [];

  // Grenade entities (separate from projectiles for bounce physics)
  private grenades: Array<{
    pos: Vec2; vel: Vec2; ownerId: number; fuse: number; active: boolean;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.ai = new AIController();
    this.sound = new SoundManager();

    this.playerSetup = [
      { name: 'P1', isAI: false, enabled: true, color: PLAYER_COLORS[0] },
      { name: 'P2', isAI: true, enabled: true, color: PLAYER_COLORS[1] },
      { name: 'P3', isAI: true, enabled: false, color: PLAYER_COLORS[2] },
      { name: 'P4', isAI: true, enabled: false, color: PLAYER_COLORS[3] },
    ];

    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: GamePhase.Menu,
      players: [],
      projectiles: [],
      particles: [],
      pickups: [],
      currentMap: ALL_MAPS[0],
      roundTime: ROUND_TIME,
      maxRoundTime: ROUND_TIME,
      roundNumber: 1,
      maxRounds: MAX_ROUNDS,
      nextProjectileId: 0,
      screenShake: 0,
      gravity: GRAVITY,
    };
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(time: number): void {
    const dt = Math.min((time - this.lastTime) / 1000, 1 / 30); // Cap at ~30fps min
    this.lastTime = time;

    this.update(dt);
    this.render();
    this.input.endFrame();

    requestAnimationFrame((t) => this.loop(t));
  }

  // ==========================
  // UPDATE
  // ==========================

  private update(dt: number): void {
    switch (this.state.phase) {
      case GamePhase.Menu:
        this.updateMenu();
        break;
      case GamePhase.Playing:
        this.updatePlaying(dt);
        break;
      case GamePhase.RoundEnd:
        this.updateRoundEnd(dt);
        break;
      case GamePhase.GameOver:
        this.updateGameOver();
        break;
    }
  }

  private updateMenu(): void {
    switch (this.menuScreen) {
      case MenuScreen.Main:
        this.updateMainMenu();
        break;
      case MenuScreen.PlayerSetup:
        this.updatePlayerSetup();
        break;
      case MenuScreen.MapSelect:
        this.updateMapSelect();
        break;
    }
  }

  private updateMainMenu(): void {
    const items = ['Play', 'Quick Match'];
    if (this.input.isPressed('KeyW') || this.input.isPressed('ArrowUp')) {
      this.menuIndex = (this.menuIndex - 1 + items.length) % items.length;
    }
    if (this.input.isPressed('KeyS') || this.input.isPressed('ArrowDown')) {
      this.menuIndex = (this.menuIndex + 1) % items.length;
    }
    if (this.input.isPressed('KeyF') || this.input.isPressed('Enter') || this.input.isPressed('Space')) {
      if (this.menuIndex === 0) {
        this.menuScreen = MenuScreen.PlayerSetup;
        this.menuIndex = 0;
      } else if (this.menuIndex === 1) {
        this.startQuickMatch();
      }
    }
  }

  private updatePlayerSetup(): void {
    if (this.input.isPressed('Escape')) {
      this.menuScreen = MenuScreen.Main;
      return;
    }

    if (this.input.isPressed('ArrowUp') || this.input.isPressed('KeyW')) {
      this.setupSelectedRow = (this.setupSelectedRow - 1 + 4) % 4;
    }
    if (this.input.isPressed('ArrowDown') || this.input.isPressed('KeyS')) {
      this.setupSelectedRow = (this.setupSelectedRow + 1) % 4;
    }
    if (this.input.isPressed('ArrowLeft') || this.input.isPressed('KeyA')) {
      this.setupSelectedCol = (this.setupSelectedCol - 1 + 2) % 2;
    }
    if (this.input.isPressed('ArrowRight') || this.input.isPressed('KeyD')) {
      this.setupSelectedCol = (this.setupSelectedCol + 1) % 2;
    }

    // Toggle with Enter/F
    if (this.input.isPressed('KeyF') || this.input.isPressed('Space')) {
      const p = this.playerSetup[this.setupSelectedRow];
      if (this.setupSelectedCol === 1) {
        // Cycle: HUMAN -> CPU -> OFF -> HUMAN
        if (p.enabled && !p.isAI) {
          p.isAI = true;
        } else if (p.enabled && p.isAI) {
          p.enabled = false;
        } else {
          p.enabled = true;
          p.isAI = false;
        }
      }
    }

    // Enter to start
    if (this.input.isPressed('Enter')) {
      const enabledCount = this.playerSetup.filter(p => p.enabled).length;
      if (enabledCount >= 2) {
        this.menuScreen = MenuScreen.MapSelect;
        this.mapSelectIndex = 0;
      }
    }
  }

  private updateMapSelect(): void {
    if (this.input.isPressed('Escape')) {
      this.menuScreen = MenuScreen.PlayerSetup;
      return;
    }

    if (this.input.isPressed('ArrowUp') || this.input.isPressed('KeyW')) {
      this.mapSelectIndex = (this.mapSelectIndex - 1 + ALL_MAPS.length) % ALL_MAPS.length;
    }
    if (this.input.isPressed('ArrowDown') || this.input.isPressed('KeyS')) {
      this.mapSelectIndex = (this.mapSelectIndex + 1) % ALL_MAPS.length;
    }
    if (this.input.isPressed('Enter') || this.input.isPressed('KeyF') || this.input.isPressed('Space')) {
      this.startGame(ALL_MAPS[this.mapSelectIndex]);
    }
  }

  private startQuickMatch(): void {
    // 1 human + 1 CPU, random map
    this.playerSetup[0].enabled = true; this.playerSetup[0].isAI = false;
    this.playerSetup[1].enabled = true; this.playerSetup[1].isAI = true;
    this.playerSetup[2].enabled = false;
    this.playerSetup[3].enabled = false;
    const map = ALL_MAPS[Math.floor(Math.random() * ALL_MAPS.length)];
    this.startGame(map);
  }

  private startGame(map: TileMap): void {
    this.state.currentMap = map;
    this.state.roundNumber = 1;
    this.state.phase = GamePhase.Playing;

    // Create players
    this.state.players = [];
    let id = 0;
    for (let i = 0; i < 4; i++) {
      const setup = this.playerSetup[i];
      if (!setup.enabled) continue;

      const player: Player = {
        id: id,
        config: {
          name: setup.name,
          color: setup.color,
          controls: DEFAULT_CONTROLS[i],
          isAI: setup.isAI,
          aiDifficulty: AIDifficulty.Medium,
        },
        state: PlayerState.Alive,
        pos: { ...map.spawnPoints[id % map.spawnPoints.length] },
        vel: { x: 0, y: 0 },
        facing: 1,
        aimAngle: 0,
        onGround: false,
        health: MAX_HEALTH,
        maxHealth: MAX_HEALTH,
        weapons: [this.createWeaponInstance(WeaponType.Pistol)],
        currentWeaponIndex: 0,
        grenades: 3,
        score: 0,
        deaths: 0,
        spawnTimer: 0,
        invincibleTimer: INVINCIBLE_TIME,
        hitFlashTimer: 0,
        crouching: false,
      };
      this.state.players.push(player);
      id++;
    }

    this.resetRound();
  }

  private resetRound(): void {
    const map = this.state.currentMap;
    this.state.roundTime = ROUND_TIME;
    this.state.projectiles = [];
    this.state.particles = [];
    this.state.pickups = [];
    this.explosions = [];
    this.grenades = [];
    this.state.screenShake = 0;

    // Reset players
    this.state.players.forEach((p, i) => {
      p.state = PlayerState.Alive;
      p.pos = { ...map.spawnPoints[i % map.spawnPoints.length] };
      p.vel = { x: 0, y: 0 };
      p.health = MAX_HEALTH;
      p.weapons = [this.createWeaponInstance(WeaponType.Pistol)];
      p.currentWeaponIndex = 0;
      p.grenades = 3;
      p.invincibleTimer = INVINCIBLE_TIME;
      p.spawnTimer = 0;
      p.hitFlashTimer = 0;
    });

    // Spawn pickups
    map.pickupSpots.forEach((spot) => {
      const pickup: Pickup = {
        pos: { ...spot },
        type: PickupType.Weapon,
        weaponType: PICKUP_WEAPONS[Math.floor(Math.random() * PICKUP_WEAPONS.length)],
        active: true,
        respawnTimer: 0,
        bobOffset: Math.random() * Math.PI * 2,
      };
      // Mix in some health and grenade pickups
      const r = Math.random();
      if (r < 0.2) {
        pickup.type = PickupType.Health;
        pickup.weaponType = undefined;
      } else if (r < 0.35) {
        pickup.type = PickupType.Grenade;
        pickup.weaponType = undefined;
      }
      this.state.pickups.push(pickup);
    });
  }

  private createWeaponInstance(type: WeaponType): WeaponInstance {
    const def = WEAPON_DEFS[type];
    return {
      def,
      ammo: def.ammo,
      cooldown: 0,
    };
  }

  private updatePlaying(dt: number): void {
    // Pause
    if (this.input.isPressed('Escape')) {
      this.state.phase = GamePhase.Menu;
      this.menuScreen = MenuScreen.Main;
      return;
    }

    // Update round timer
    this.state.roundTime -= dt;
    if (this.state.roundTime <= 0) {
      this.endRound();
      return;
    }

    // Update players
    for (const player of this.state.players) {
      this.updatePlayer(player, dt);
    }

    // Update projectiles
    this.updateProjectiles(dt);

    // Update grenades
    this.updateGrenades(dt);

    // Update particles
    this.updateParticles(dt);

    // Update pickups
    this.updatePickups(dt);

    // Update explosions
    this.explosions = this.explosions.filter(e => {
      e.timer += dt;
      return e.timer < e.maxTime;
    });

    // Screen shake decay
    if (this.state.screenShake > 0) {
      this.state.screenShake -= SCREEN_SHAKE_DECAY * dt;
      if (this.state.screenShake < 0) this.state.screenShake = 0;
    }

    // Check win condition
    this.checkWinCondition();
  }

  private updatePlayer(player: Player, dt: number): void {
    // Handle respawn timer
    if (player.state === PlayerState.Dead) {
      player.spawnTimer -= dt;
      if (player.spawnTimer <= 0) {
        this.respawnPlayer(player);
      }
      return;
    }

    if (player.state === PlayerState.Spawning) {
      player.invincibleTimer -= dt;
      if (player.invincibleTimer <= 0) {
        player.state = PlayerState.Alive;
      }
    }

    // Timers
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
    if (player.hitFlashTimer > 0) player.hitFlashTimer -= dt;

    // Weapon cooldowns
    for (const w of player.weapons) {
      if (w.cooldown > 0) w.cooldown -= dt;
    }

    // Get input
    let moveX = 0;
    let jump = false;
    let crouch = false;
    let shoot = false;
    let nextWeapon = false;
    let prevWeapon = false;
    let throwGrenade = false;

    if (player.config.isAI) {
      const action = this.ai.update(player, this.state, dt);
      if (action.left) moveX = -1;
      if (action.right) moveX = 1;
      jump = action.jump;
      crouch = action.crouch;
      shoot = action.shoot;
      if (action.switchWeapon) nextWeapon = true;
      throwGrenade = action.throwGrenade;

      // AI aim
      player.aimAngle = this.ai.getAimAngle(player, this.state);
      player.facing = Math.cos(player.aimAngle) >= 0 ? 1 : -1;
    } else {
      const c = player.config.controls;
      if (this.input.isDown(c.left)) moveX = -1;
      if (this.input.isDown(c.right)) moveX = 1;
      jump = this.input.isPressed(c.up);
      crouch = this.input.isDown(c.down);

      const weapon = player.weapons[player.currentWeaponIndex];
      if (weapon) {
        if (weapon.def.autoFire) {
          shoot = this.input.isDown(c.shoot);
        } else {
          shoot = this.input.isPressed(c.shoot);
        }
      }

      nextWeapon = this.input.isPressed(c.nextWeapon);
      prevWeapon = this.input.isPressed(c.prevWeapon);
      throwGrenade = this.input.isPressed(c.throwGrenade);

      // Update facing and aim from movement
      if (moveX !== 0) player.facing = moveX;
      // Simple aim: face direction, with vertical aim
      let aimY = 0;
      if (this.input.isDown(c.up)) aimY = -1;
      if (this.input.isDown(c.down)) aimY = 1;
      player.aimAngle = Math.atan2(aimY * 0.5, player.facing);
    }

    // Crouching
    player.crouching = crouch && player.onGround;

    // Movement
    player.vel.x = moveX * PLAYER_SPEED;

    // Jump
    if (jump && player.onGround) {
      player.vel.y = -PLAYER_JUMP_SPEED;
      player.onGround = false;
      this.sound.play('jump');
    }

    // Apply gravity
    player.vel.y += this.state.gravity * dt;
    if (player.vel.y > MAX_FALL_SPEED) player.vel.y = MAX_FALL_SPEED;

    // Move with collision
    const h = player.crouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
    const result = moveAndCollide(
      this.state.currentMap,
      player.pos,
      player.vel,
      PLAYER_WIDTH,
      h,
      dt,
    );
    player.pos = result.pos;
    player.vel = result.vel;
    player.onGround = result.onGround;

    // Weapon switching
    if (nextWeapon && player.weapons.length > 1) {
      player.currentWeaponIndex = (player.currentWeaponIndex + 1) % player.weapons.length;
    }
    if (prevWeapon && player.weapons.length > 1) {
      player.currentWeaponIndex = (player.currentWeaponIndex - 1 + player.weapons.length) % player.weapons.length;
    }

    // Shooting
    if (shoot) {
      this.playerShoot(player);
    }

    // Throw grenade
    if (throwGrenade && player.grenades > 0) {
      this.throwGrenade(player);
    }
  }

  private playerShoot(player: Player): void {
    const weapon = player.weapons[player.currentWeaponIndex];
    if (!weapon || weapon.cooldown > 0) return;
    if (weapon.ammo === 0) {
      // Out of ammo, switch to pistol
      const pistolIdx = player.weapons.findIndex(w => w.def.type === WeaponType.Pistol);
      if (pistolIdx >= 0) player.currentWeaponIndex = pistolIdx;
      return;
    }

    const def = weapon.def;
    weapon.cooldown = 1 / def.fireRate;
    if (weapon.ammo > 0) weapon.ammo--;

    const gunX = player.pos.x + player.facing * (PLAYER_WIDTH / 2);
    const gunY = player.pos.y - (player.crouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT) + 10;

    for (let i = 0; i < def.bulletCount; i++) {
      const spreadAngle = player.aimAngle + (Math.random() - 0.5) * def.spread;
      const vx = Math.cos(spreadAngle) * def.bulletSpeed;
      const vy = Math.sin(spreadAngle) * def.bulletSpeed;

      const proj: Projectile = {
        id: this.state.nextProjectileId++,
        ownerId: player.id,
        pos: { x: gunX, y: gunY },
        vel: { x: vx, y: vy },
        weaponDef: def,
        lifetime: def.bulletLifetime,
        active: true,
      };
      this.state.projectiles.push(proj);
    }

    // Recoil
    player.vel.x -= Math.cos(player.aimAngle) * def.recoil * 10;
    player.vel.y -= Math.sin(player.aimAngle) * def.recoil * 5;

    // Muzzle flash particles
    for (let i = 0; i < 3; i++) {
      this.spawnParticle(
        { x: gunX, y: gunY },
        {
          x: Math.cos(player.aimAngle) * 100 + (Math.random() - 0.5) * 50,
          y: Math.sin(player.aimAngle) * 100 + (Math.random() - 0.5) * 50,
        },
        { r: 255, g: 200, b: 100 },
        2,
        0.1,
      );
    }

    // Screen shake
    this.state.screenShake = Math.max(this.state.screenShake, def.recoil * 0.5);

    this.sound.play('shoot');
  }

  private throwGrenade(player: Player): void {
    player.grenades--;
    const angle = player.aimAngle;
    this.grenades.push({
      pos: { x: player.pos.x, y: player.pos.y - PLAYER_HEIGHT / 2 },
      vel: {
        x: Math.cos(angle) * GRENADE_SPEED,
        y: Math.sin(angle) * GRENADE_SPEED - 100,
      },
      ownerId: player.id,
      fuse: GRENADE_FUSE,
      active: true,
    });
    this.sound.play('shoot');
  }

  private updateProjectiles(dt: number): void {
    for (const proj of this.state.projectiles) {
      if (!proj.active) continue;

      proj.lifetime -= dt;
      if (proj.lifetime <= 0) {
        proj.active = false;
        continue;
      }

      // Apply gravity to grenades/rockets slightly
      if (proj.weaponDef.explosive && proj.weaponDef.type === WeaponType.GrenadeLauncher) {
        proj.vel.y += GRAVITY * 0.5 * dt;
      }

      proj.pos.x += proj.vel.x * dt;
      proj.pos.y += proj.vel.y * dt;

      // Check tile collision
      if (isSolid(this.state.currentMap, proj.pos.x, proj.pos.y)) {
        if (proj.weaponDef.explosive) {
          this.explode(proj.pos.x, proj.pos.y, proj.weaponDef.explosionRadius, proj.weaponDef.damage, proj.ownerId);
        } else {
          this.spawnImpactParticles(proj.pos, proj.weaponDef.bulletColor);
        }
        proj.active = false;
        continue;
      }

      // Check player collision
      for (const player of this.state.players) {
        if (player.id === proj.ownerId) continue;
        if (player.state !== PlayerState.Alive) continue;
        if (player.invincibleTimer > 0) continue;

        const h = player.crouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
        const playerRect = {
          x: player.pos.x - PLAYER_WIDTH / 2,
          y: player.pos.y - h,
          w: PLAYER_WIDTH,
          h: h,
        };

        const projRect = {
          x: proj.pos.x - proj.weaponDef.bulletSize / 2,
          y: proj.pos.y - proj.weaponDef.bulletSize / 2,
          w: proj.weaponDef.bulletSize,
          h: proj.weaponDef.bulletSize,
        };

        if (rectOverlap(playerRect, projRect)) {
          if (proj.weaponDef.explosive) {
            this.explode(proj.pos.x, proj.pos.y, proj.weaponDef.explosionRadius, proj.weaponDef.damage, proj.ownerId);
          } else {
            this.damagePlayer(player, proj.weaponDef.damage, proj.ownerId);
            this.spawnImpactParticles(proj.pos, proj.weaponDef.bulletColor);
          }

          if (!proj.weaponDef.piercing) {
            proj.active = false;
          }
          break;
        }
      }
    }

    // Clean up inactive projectiles
    this.state.projectiles = this.state.projectiles.filter(p => p.active);
  }

  private updateGrenades(dt: number): void {
    for (const gren of this.grenades) {
      if (!gren.active) continue;

      gren.fuse -= dt;
      if (gren.fuse <= 0) {
        this.explode(gren.pos.x, gren.pos.y, GRENADE_RADIUS, GRENADE_DAMAGE, gren.ownerId);
        gren.active = false;
        continue;
      }

      // Physics
      gren.vel.y += GRAVITY * dt;
      gren.pos.x += gren.vel.x * dt;
      gren.pos.y += gren.vel.y * dt;

      // Bounce off tiles
      if (isSolid(this.state.currentMap, gren.pos.x, gren.pos.y)) {
        // Simple bounce
        if (isSolid(this.state.currentMap, gren.pos.x, gren.pos.y - Math.abs(gren.vel.y * dt))) {
          gren.vel.x *= -0.5;
          gren.pos.x -= gren.vel.x * dt * 2;
        }
        if (isSolid(this.state.currentMap, gren.pos.x - Math.abs(gren.vel.x * dt), gren.pos.y)) {
          gren.vel.y *= -0.5;
          gren.pos.y -= gren.vel.y * dt * 2;
        }
      }
    }

    this.grenades = this.grenades.filter(g => g.active);
  }

  private explode(x: number, y: number, radius: number, damage: number, ownerId: number): void {
    // Damage players in radius
    for (const player of this.state.players) {
      if (player.state !== PlayerState.Alive) continue;
      const d = dist({ x, y }, player.pos);
      if (d < radius) {
        const falloff = 1 - (d / radius);
        const dmg = Math.floor(damage * falloff);
        const skipInvincible = player.id === ownerId; // Self-damage ignores invincibility
        if (player.invincibleTimer <= 0 || skipInvincible) {
          this.damagePlayer(player, dmg, ownerId);
          // Knockback
          const dx = player.pos.x - x;
          const dy = player.pos.y - y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          player.vel.x += (dx / len) * falloff * 400;
          player.vel.y += (dy / len) * falloff * 300 - 100;
        }
      }
    }

    // Explosion visual
    this.explosions.push({ x, y, radius, timer: 0, maxTime: 0.4 });

    // Particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 200;
      this.spawnParticle(
        { x, y },
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 50 },
        Math.random() > 0.5 ? { r: 255, g: 150, b: 50 } : { r: 255, g: 100, b: 30 },
        2 + Math.random() * 3,
        0.3 + Math.random() * 0.5,
        true,
      );
    }

    // Screen shake
    this.state.screenShake = Math.max(this.state.screenShake, 8);

    this.sound.play('explode');
  }

  private damagePlayer(player: Player, damage: number, attackerId: number): void {
    player.health -= damage;
    player.hitFlashTimer = 0.1;
    this.sound.play('hit');

    // Blood particles
    for (let i = 0; i < 5; i++) {
      this.spawnParticle(
        { x: player.pos.x, y: player.pos.y - PLAYER_HEIGHT / 2 },
        { x: (Math.random() - 0.5) * 100, y: -Math.random() * 80 },
        { r: 200 + Math.floor(Math.random() * 55), g: 0, b: 0 },
        2,
        0.3 + Math.random() * 0.3,
        true,
      );
    }

    if (player.health <= 0) {
      this.killPlayer(player, attackerId);
    }
  }

  private killPlayer(player: Player, killerId: number): void {
    player.state = PlayerState.Dead;
    player.spawnTimer = SPAWN_TIME;
    player.deaths++;

    // Credit the killer
    const killer = this.state.players.find(p => p.id === killerId);
    if (killer && killer.id !== player.id) {
      killer.score++;
    }

    // Death particles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.spawnParticle(
        { x: player.pos.x, y: player.pos.y - PLAYER_HEIGHT / 2 },
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 50 },
        player.config.color,
        2 + Math.random() * 2,
        0.5 + Math.random() * 0.5,
        true,
      );
    }

    this.state.screenShake = Math.max(this.state.screenShake, 4);
    this.sound.play('death');
  }

  private respawnPlayer(player: Player): void {
    const map = this.state.currentMap;
    // Pick spawn point furthest from enemies
    let bestSpawn = map.spawnPoints[0];
    let bestDist = 0;

    for (const sp of map.spawnPoints) {
      let minEnemyDist = Infinity;
      for (const other of this.state.players) {
        if (other.id === player.id || other.state !== PlayerState.Alive) continue;
        const d = dist(sp, other.pos);
        if (d < minEnemyDist) minEnemyDist = d;
      }
      if (minEnemyDist > bestDist) {
        bestDist = minEnemyDist;
        bestSpawn = sp;
      }
    }

    player.pos = { ...bestSpawn };
    player.vel = { x: 0, y: 0 };
    player.health = MAX_HEALTH;
    player.state = PlayerState.Spawning;
    player.invincibleTimer = INVINCIBLE_TIME;
    player.weapons = [this.createWeaponInstance(WeaponType.Pistol)];
    player.currentWeaponIndex = 0;
    player.grenades = Math.min(player.grenades + 1, 5);
  }

  private updateParticles(dt: number): void {
    for (const p of this.state.particles) {
      p.lifetime -= dt;
      if (p.gravity) {
        p.vel.y += GRAVITY * dt;
      }
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
    }
    this.state.particles = this.state.particles.filter(p => p.lifetime > 0);
  }

  private updatePickups(dt: number): void {
    for (const pickup of this.state.pickups) {
      pickup.bobOffset += dt * 3;

      if (!pickup.active) {
        pickup.respawnTimer -= dt;
        if (pickup.respawnTimer <= 0) {
          pickup.active = true;
          // Randomize weapon type on respawn
          if (pickup.type === PickupType.Weapon) {
            pickup.weaponType = PICKUP_WEAPONS[Math.floor(Math.random() * PICKUP_WEAPONS.length)];
          }
        }
        continue;
      }

      // Check player collision
      for (const player of this.state.players) {
        if (player.state !== PlayerState.Alive) continue;
        const d = dist(pickup.pos, player.pos);
        if (d < 20) {
          this.collectPickup(player, pickup);
          break;
        }
      }
    }
  }

  private collectPickup(player: Player, pickup: Pickup): void {
    switch (pickup.type) {
      case PickupType.Weapon:
        if (pickup.weaponType) {
          // Replace or add weapon
          const existing = player.weapons.findIndex(w => w.def.type === pickup.weaponType);
          if (existing >= 0) {
            // Refill ammo
            player.weapons[existing].ammo = player.weapons[existing].def.ammo;
          } else {
            const newWeapon = this.createWeaponInstance(pickup.weaponType);
            player.weapons.push(newWeapon);
            player.currentWeaponIndex = player.weapons.length - 1;
          }
        }
        break;
      case PickupType.Health:
        player.health = Math.min(player.health + 40, MAX_HEALTH);
        break;
      case PickupType.Grenade:
        player.grenades = Math.min(player.grenades + 3, 10);
        break;
    }

    pickup.active = false;
    pickup.respawnTimer = PICKUP_RESPAWN_TIME;
    this.sound.play('pickup');
  }

  private checkWinCondition(): void {
    // Check if someone reached kill limit
    for (const player of this.state.players) {
      if (player.score >= KILLS_TO_WIN) {
        this.endRound();
        return;
      }
    }

    // Check if only one player alive (for very short rounds)
    const alive = this.state.players.filter(p => p.state === PlayerState.Alive);
    if (alive.length <= 1 && this.state.roundTime < ROUND_TIME - 5) {
      // Give a few seconds before ending
      if (this.state.roundTime > 3) {
        this.state.roundTime = 3;
      }
    }
  }

  private endRound(): void {
    // Find round winner (highest score)
    const sorted = [...this.state.players].sort((a, b) => b.score - a.score);
    this.roundWinner = sorted[0].score > 0 ? sorted[0] : null;

    if (this.state.roundNumber >= this.state.maxRounds) {
      this.state.phase = GamePhase.GameOver;
    } else {
      this.state.phase = GamePhase.RoundEnd;
      this.roundEndTimer = 5;
    }
  }

  private updateRoundEnd(dt: number): void {
    this.roundEndTimer -= dt;
    if (this.roundEndTimer <= 0) {
      this.state.roundNumber++;
      this.state.phase = GamePhase.Playing;
      this.resetRound();
    }
  }

  private updateGameOver(): void {
    if (this.input.isPressed('Enter') || this.input.isPressed('Space')) {
      this.state = this.createInitialState();
      this.menuScreen = MenuScreen.Main;
      this.menuIndex = 0;
    }
  }

  private spawnParticle(pos: Vec2, vel: Vec2, color: Color, size: number, lifetime: number, gravity: boolean = false): void {
    if (this.state.particles.length > 500) return;
    this.state.particles.push({
      pos: { ...pos },
      vel: { ...vel },
      color,
      size,
      lifetime,
      maxLifetime: lifetime,
      gravity,
    });
  }

  private spawnImpactParticles(pos: Vec2, color: Color): void {
    for (let i = 0; i < 4; i++) {
      this.spawnParticle(
        pos,
        {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
        },
        color,
        1 + Math.random() * 2,
        0.15 + Math.random() * 0.15,
      );
    }
  }

  // ==========================
  // RENDER
  // ==========================

  private render(): void {
    switch (this.state.phase) {
      case GamePhase.Menu:
        this.renderMenu();
        break;
      case GamePhase.Playing:
        this.renderPlaying();
        break;
      case GamePhase.RoundEnd:
        this.renderPlaying(); // Draw game in background
        this.renderer.drawRoundEnd(this.roundWinner, this.state.players, this.roundEndTimer);
        break;
      case GamePhase.GameOver:
        this.renderPlaying();
        this.renderer.drawGameOver(this.state.players);
        break;
    }
  }

  private renderMenu(): void {
    switch (this.menuScreen) {
      case MenuScreen.Main:
        this.renderer.drawMenu(
          this.menuIndex,
          ['Play', 'Quick Match'],
          'FRIENDLY STRIKE',
          '2D Arena Shooter - Web Edition',
        );
        break;
      case MenuScreen.PlayerSetup:
        this.renderer.drawPlayerSetup(this.playerSetup, this.setupSelectedRow, this.setupSelectedCol);
        break;
      case MenuScreen.MapSelect:
        this.renderer.drawMapSelect(
          ALL_MAPS.map(m => m.name),
          this.mapSelectIndex,
        );
        break;
    }
  }

  private renderPlaying(): void {
    const { currentMap, screenShake } = this.state;

    this.renderer.clear(currentMap.background);
    this.renderer.applyScreenShake(screenShake);

    // Draw map
    this.renderer.drawTileMap(currentMap);

    // Draw pickups
    for (const pickup of this.state.pickups) {
      this.renderer.drawPickup(pickup);
    }

    // Draw grenades
    for (const gren of this.grenades) {
      if (!gren.active) continue;
      this.renderer.drawGrenade(gren.pos.x, gren.pos.y, gren.fuse);
    }

    // Draw projectiles
    for (const proj of this.state.projectiles) {
      this.renderer.drawProjectile(proj);
    }

    // Draw explosions
    for (const exp of this.explosions) {
      this.renderer.drawExplosion(exp.x, exp.y, exp.radius, exp.timer / exp.maxTime);
    }

    // Draw particles
    for (const p of this.state.particles) {
      this.renderer.drawParticle(p);
    }

    // Draw players
    for (const player of this.state.players) {
      this.renderer.drawPlayer(player);
    }

    this.renderer.resetScreenShake(screenShake);

    // HUD on top
    this.renderer.drawHUD(this.state);
  }
}
