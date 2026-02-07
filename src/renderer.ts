import { Color, Player, Projectile, Particle, Pickup, TileMap, GameState, PlayerState, PickupType, WeaponType, GamePhase } from './types';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT, WEAPON_DEFS, PLAYER_COLORS } from './constants';

// ============================================================
// Renderer - All drawing operations
// ============================================================

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  clear(color: Color): void {
    this.ctx.fillStyle = this.colorStr(color);
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  applyScreenShake(shake: number): void {
    if (shake > 0.5) {
      const ox = (Math.random() - 0.5) * shake * 2;
      const oy = (Math.random() - 0.5) * shake * 2;
      this.ctx.save();
      this.ctx.translate(ox, oy);
    }
  }

  resetScreenShake(shake: number): void {
    if (shake > 0.5) {
      this.ctx.restore();
    }
  }

  drawTileMap(map: TileMap): void {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x];
        if (tile > 0) {
          const color = map.tileColors[tile] || map.tileColors[1];
          this.ctx.fillStyle = this.colorStr(color);
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Simple edge highlight
          const lighter = { r: Math.min(255, color.r + 25), g: Math.min(255, color.g + 25), b: Math.min(255, color.b + 25) };
          this.ctx.fillStyle = this.colorStr(lighter);
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 2);
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, 2, TILE_SIZE);
        }
      }
    }
  }

  drawPlayer(player: Player): void {
    if (player.state === PlayerState.Dead) return;

    const { pos, facing, config, invincibleTimer, hitFlashTimer, crouching } = player;
    const w = PLAYER_WIDTH;
    const h = crouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
    const x = pos.x - w / 2;
    const y = pos.y - h;

    // Spawning/invincible blink
    if (invincibleTimer > 0 && Math.floor(invincibleTimer * 10) % 2 === 0) {
      return; // blink effect
    }

    const color = config.color;
    const bodyColor = hitFlashTimer > 0
      ? { r: 255, g: 255, b: 255 }
      : color;

    // Body
    this.ctx.fillStyle = this.colorStr(bodyColor);
    this.ctx.fillRect(x, y, w, h);

    // Darker legs
    const legColor = { r: Math.floor(color.r * 0.7), g: Math.floor(color.g * 0.7), b: Math.floor(color.b * 0.7) };
    this.ctx.fillStyle = this.colorStr(legColor);
    this.ctx.fillRect(x, y + h * 0.6, w, h * 0.4);

    // Eyes
    const eyeX = pos.x + facing * 3;
    const eyeY = y + 6;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(eyeX - 2, eyeY, 3, 3);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(eyeX - 1 + (facing > 0 ? 1 : 0), eyeY + 1, 1, 1);

    // Weapon indicator
    const weapon = player.weapons[player.currentWeaponIndex];
    if (weapon) {
      const gunLen = 10;
      const gunX = pos.x + facing * (w / 2);
      const gunY = y + 10;
      const aimX = gunX + Math.cos(player.aimAngle) * gunLen;
      const aimY = gunY + Math.sin(player.aimAngle) * gunLen;

      this.ctx.strokeStyle = '#888';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(gunX, gunY);
      this.ctx.lineTo(aimX, aimY);
      this.ctx.stroke();
    }

    // Name tag
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '9px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(config.name, pos.x, y - 12);

    // Health bar
    const hpBarW = 24;
    const hpBarH = 3;
    const hpX = pos.x - hpBarW / 2;
    const hpY = y - 8;
    const hpRatio = player.health / player.maxHealth;
    this.ctx.fillStyle = '#300';
    this.ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
    this.ctx.fillStyle = hpRatio > 0.5 ? '#0c0' : hpRatio > 0.25 ? '#cc0' : '#c00';
    this.ctx.fillRect(hpX, hpY, hpBarW * hpRatio, hpBarH);
  }

  drawProjectile(proj: Projectile): void {
    if (!proj.active) return;
    const { pos, weaponDef } = proj;
    const color = weaponDef.bulletColor;
    const size = weaponDef.bulletSize;

    this.ctx.fillStyle = this.colorStr(color);

    if (weaponDef.explosive) {
      // Draw rocket/grenade shape
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      this.ctx.fill();
      // Glow
      this.ctx.fillStyle = this.colorStr({ r: 255, g: 200, b: 100 }, 0.3);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size * 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (weaponDef.type === WeaponType.Flamethrower) {
      // Flame particles
      this.ctx.fillStyle = this.colorStr(color, 0.7);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size + Math.random() * 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (weaponDef.type === WeaponType.PlasmaRifle) {
      // Plasma ball
      this.ctx.fillStyle = this.colorStr(color, 0.5);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size + 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = this.colorStr({ r: 200, g: 220, b: 255 });
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, size - 1, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (weaponDef.type === WeaponType.LaserGun) {
      // Laser beam segment
      this.ctx.fillStyle = this.colorStr(color);
      this.ctx.fillRect(pos.x - size, pos.y - 1, size * 2, 2);
      this.ctx.fillStyle = this.colorStr({ r: 200, g: 255, b: 200 }, 0.4);
      this.ctx.fillRect(pos.x - size - 1, pos.y - 2, size * 2 + 2, 4);
    } else {
      // Standard bullet
      this.ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
    }
  }

  drawParticle(particle: Particle): void {
    const alpha = particle.lifetime / particle.maxLifetime;
    this.ctx.fillStyle = this.colorStr(particle.color, alpha);
    this.ctx.fillRect(
      particle.pos.x - particle.size / 2,
      particle.pos.y - particle.size / 2,
      particle.size,
      particle.size,
    );
  }

  drawPickup(pickup: Pickup): void {
    if (!pickup.active) return;
    const { pos, type, weaponType } = pickup;
    const bob = Math.sin(pickup.bobOffset) * 3;

    // Background glow
    this.ctx.fillStyle = 'rgba(255, 255, 100, 0.15)';
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y + bob - 5, 14, 0, Math.PI * 2);
    this.ctx.fill();

    if (type === PickupType.Weapon && weaponType) {
      const wdef = WEAPON_DEFS[weaponType];
      const col = wdef.bulletColor;
      // Weapon box
      this.ctx.fillStyle = this.colorStr(col, 0.8);
      this.ctx.fillRect(pos.x - 10, pos.y - 10 + bob, 20, 12);
      // Label
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '7px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(wdef.name.substring(0, 5), pos.x, pos.y + 8 + bob);
    } else if (type === PickupType.Health) {
      this.ctx.fillStyle = '#0f0';
      this.ctx.fillRect(pos.x - 5, pos.y - 8 + bob, 10, 10);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(pos.x - 1, pos.y - 7 + bob, 2, 8);
      this.ctx.fillRect(pos.x - 4, pos.y - 4 + bob, 8, 2);
    } else if (type === PickupType.Grenade) {
      this.ctx.fillStyle = '#4a4';
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y - 3 + bob, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawGrenade(x: number, y: number, fuse: number): void {
    this.ctx.fillStyle = '#4a4';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    // Fuse indicator (blink when close to exploding)
    if (fuse < 0.5 && Math.floor(fuse * 20) % 2 === 0) {
      this.ctx.fillStyle = '#f00';
      this.ctx.beginPath();
      this.ctx.arc(x, y - 5, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawExplosion(x: number, y: number, radius: number, progress: number): void {
    const alpha = 1 - progress;
    const r = radius * (0.5 + progress * 0.5);
    // Outer
    this.ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.3})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();
    // Inner
    this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.5})`;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawHUD(state: GameState): void {
    const { players, roundTime, roundNumber, maxRounds } = state;

    // Top bar
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, 30);

    // Round info
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    const minutes = Math.floor(roundTime / 60);
    const seconds = Math.floor(roundTime % 60);
    this.ctx.fillText(
      `Round ${roundNumber}/${maxRounds}  |  ${minutes}:${seconds.toString().padStart(2, '0')}`,
      GAME_WIDTH / 2,
      18,
    );

    // Player scores
    const scoreWidth = 160;
    const startX = 10;
    players.forEach((p, i) => {
      const x = startX + i * scoreWidth;
      const y = GAME_HEIGHT - 24;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(x, y, scoreWidth - 8, 20);

      this.ctx.fillStyle = this.colorStr(p.config.color);
      this.ctx.fillRect(x, y, 4, 20);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${p.config.name}`, x + 8, y + 10);

      // Current weapon & ammo
      const weapon = p.weapons[p.currentWeaponIndex];
      if (weapon) {
        const ammoStr = weapon.def.ammo === -1 ? 'INF' : `${weapon.ammo}`;
        this.ctx.fillText(`K:${p.score} ${weapon.def.name.substring(0, 6)} [${ammoStr}]`, x + 8, y + 18);
      }
    });
  }

  drawMenu(selectedIndex: number, items: string[], title: string, subtitle?: string): void {
    this.clear({ r: 15, g: 15, b: 25 });

    // Title
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, GAME_WIDTH / 2, 100);

    if (subtitle) {
      this.ctx.font = '14px monospace';
      this.ctx.fillStyle = '#888';
      this.ctx.fillText(subtitle, GAME_WIDTH / 2, 130);
    }

    // Subtitle line
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(GAME_WIDTH / 2 - 150, 145);
    this.ctx.lineTo(GAME_WIDTH / 2 + 150, 145);
    this.ctx.stroke();

    // Menu items
    items.forEach((item, i) => {
      const y = 190 + i * 40;
      const selected = i === selectedIndex;

      if (selected) {
        this.ctx.fillStyle = 'rgba(60, 140, 255, 0.2)';
        this.ctx.fillRect(GAME_WIDTH / 2 - 150, y - 15, 300, 30);
        this.ctx.fillStyle = '#4af';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillText(`> ${item} <`, GAME_WIDTH / 2, y + 5);
      } else {
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(item, GAME_WIDTH / 2, y + 5);
      }
    });

    // Controls hint
    this.ctx.fillStyle = '#555';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('W/S or Up/Down to navigate  |  F or Enter to select', GAME_WIDTH / 2, GAME_HEIGHT - 30);
  }

  drawPlayerSetup(players: Array<{ name: string; isAI: boolean; enabled: boolean; color: Color }>, selectedRow: number, selectedCol: number): void {
    this.clear({ r: 15, g: 15, b: 25 });

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Player Setup', GAME_WIDTH / 2, 50);

    players.forEach((p, i) => {
      const y = 100 + i * 100;
      const isSelectedRow = i === selectedRow;

      // Row background
      this.ctx.fillStyle = isSelectedRow ? 'rgba(60, 140, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';
      this.ctx.fillRect(50, y - 10, GAME_WIDTH - 100, 80);

      // Player color indicator
      this.ctx.fillStyle = this.colorStr(p.color);
      this.ctx.fillRect(60, y, 20, 50);

      // Player name
      const nameSelected = isSelectedRow && selectedCol === 0;
      this.ctx.fillStyle = nameSelected ? '#4af' : '#fff';
      this.ctx.font = `${nameSelected ? 'bold ' : ''}14px monospace`;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${p.name}`, 100, y + 20);

      // Type (Human/AI/Off)
      const typeSelected = isSelectedRow && selectedCol === 1;
      const typeStr = !p.enabled ? 'OFF' : p.isAI ? 'CPU' : 'HUMAN';
      this.ctx.fillStyle = typeSelected ? '#4af' : '#aaa';
      this.ctx.font = `${typeSelected ? 'bold ' : ''}14px monospace`;
      this.ctx.fillText(`Type: ${typeStr}`, 350, y + 20);

      // Controls info
      if (p.enabled && !p.isAI) {
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px monospace';
        const controlHints = [
          'P1: WASD + F/Q/E/G',
          'P2: Arrows + Num0/./1/2',
          'P3: IJKL + H/Y/U/N',
          'P4: CPU only',
        ];
        this.ctx.fillText(controlHints[i], 100, y + 45);
      }
    });

    // Instructions
    this.ctx.fillStyle = '#555';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Up/Down to select player | Left/Right to change | Enter to start', GAME_WIDTH / 2, GAME_HEIGHT - 30);
  }

  drawRoundEnd(winner: Player | null, players: Player[], countdown: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.ctx.textAlign = 'center';

    if (winner) {
      this.ctx.fillStyle = this.colorStr(winner.config.color);
      this.ctx.font = 'bold 28px monospace';
      this.ctx.fillText(`${winner.config.name} wins the round!`, GAME_WIDTH / 2, 200);
    } else {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 28px monospace';
      this.ctx.fillText('Draw!', GAME_WIDTH / 2, 200);
    }

    // Scoreboard
    const sorted = [...players].sort((a, b) => b.score - a.score);
    this.ctx.font = '14px monospace';
    sorted.forEach((p, i) => {
      const y = 260 + i * 30;
      this.ctx.fillStyle = this.colorStr(p.config.color);
      this.ctx.fillText(`${p.config.name}  -  Kills: ${p.score}  Deaths: ${p.deaths}`, GAME_WIDTH / 2, y);
    });

    this.ctx.fillStyle = '#888';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Next round in ${Math.ceil(countdown)}...`, GAME_WIDTH / 2, GAME_HEIGHT - 80);
  }

  drawGameOver(players: Player[]): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.ctx.textAlign = 'center';

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const champ = sorted[0];

    this.ctx.fillStyle = this.colorStr(champ.config.color);
    this.ctx.font = 'bold 32px monospace';
    this.ctx.fillText(`${champ.config.name} WINS!`, GAME_WIDTH / 2, 150);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText('FINAL SCOREBOARD', GAME_WIDTH / 2, 210);

    this.ctx.font = '14px monospace';
    sorted.forEach((p, i) => {
      const y = 250 + i * 35;
      this.ctx.fillStyle = this.colorStr(p.config.color);
      this.ctx.fillText(
        `#${i + 1}  ${p.config.name}  -  Kills: ${p.score}  Deaths: ${p.deaths}  K/D: ${p.deaths > 0 ? (p.score / p.deaths).toFixed(1) : p.score.toFixed(1)}`,
        GAME_WIDTH / 2,
        y,
      );
    });

    this.ctx.fillStyle = '#888';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('Press Enter to return to menu', GAME_WIDTH / 2, GAME_HEIGHT - 50);
  }

  drawMapSelect(maps: string[], selectedIndex: number): void {
    this.clear({ r: 15, g: 15, b: 25 });

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Select Arena', GAME_WIDTH / 2, 60);

    maps.forEach((name, i) => {
      const y = 120 + i * 45;
      const selected = i === selectedIndex;

      if (selected) {
        this.ctx.fillStyle = 'rgba(60, 140, 255, 0.2)';
        this.ctx.fillRect(GAME_WIDTH / 2 - 150, y - 15, 300, 35);
        this.ctx.fillStyle = '#4af';
        this.ctx.font = 'bold 16px monospace';
      } else {
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '16px monospace';
      }
      this.ctx.fillText(name, GAME_WIDTH / 2, y + 5);
    });

    this.ctx.fillStyle = '#555';
    this.ctx.font = '11px monospace';
    this.ctx.fillText('Up/Down to select | Enter to play | Esc to go back', GAME_WIDTH / 2, GAME_HEIGHT - 30);
  }

  private colorStr(c: Color, alpha?: number): string {
    const a = alpha ?? c.a ?? 1;
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
  }
}
