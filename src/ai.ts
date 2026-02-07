import { Player, PlayerState, GameState, AIDifficulty, Vec2 } from './types';
import { dist } from './physics';
import { PLAYER_WIDTH } from './constants';

// ============================================================
// AI System - CPU-controlled players
// ============================================================

interface AIAction {
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  shoot: boolean;
  switchWeapon: boolean;
  throwGrenade: boolean;
}

const EMPTY_ACTION: AIAction = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  shoot: false,
  switchWeapon: false,
  throwGrenade: false,
};

export class AIController {
  private decisionTimers: Map<number, number> = new Map();
  private currentActions: Map<number, AIAction> = new Map();
  private targetIds: Map<number, number> = new Map();
  private jumpTimers: Map<number, number> = new Map();

  update(player: Player, state: GameState, dt: number): AIAction {
    if (player.state !== PlayerState.Alive) return { ...EMPTY_ACTION };

    const pid = player.id;
    const difficulty = player.config.aiDifficulty;

    // Decision interval based on difficulty
    const decisionInterval = [0.5, 0.3, 0.15, 0.08][difficulty];

    let timer = this.decisionTimers.get(pid) ?? 0;
    timer -= dt;

    let jumpTimer = this.jumpTimers.get(pid) ?? 0;
    jumpTimer -= dt;
    this.jumpTimers.set(pid, jumpTimer);

    if (timer <= 0) {
      timer = decisionInterval;
      const action = this.makeDecision(player, state, difficulty);
      this.currentActions.set(pid, action);
    }

    this.decisionTimers.set(pid, timer);
    return this.currentActions.get(pid) ?? { ...EMPTY_ACTION };
  }

  private makeDecision(player: Player, state: GameState, difficulty: AIDifficulty): AIAction {
    const action: AIAction = { ...EMPTY_ACTION };

    // Find nearest alive enemy
    const enemies = state.players.filter(
      p => p.id !== player.id && p.state === PlayerState.Alive
    );

    if (enemies.length === 0) return action;

    // Pick target (nearest or lowest health based on difficulty)
    let target: Player;
    if (difficulty >= AIDifficulty.Hard) {
      // Prioritize low-health enemies
      target = enemies.reduce((best, e) => {
        const d = dist(player.pos, e.pos);
        const score = d - (100 - e.health) * 3;
        const bestD = dist(player.pos, best.pos);
        const bestScore = bestD - (100 - best.health) * 3;
        return score < bestScore ? e : best;
      });
    } else {
      target = enemies.reduce((closest, e) =>
        dist(player.pos, e.pos) < dist(player.pos, closest.pos) ? e : closest
      );
    }

    this.targetIds.set(player.id, target.id);

    const dx = target.pos.x - player.pos.x;
    const dy = target.pos.y - player.pos.y;
    const distance = dist(player.pos, target.pos);

    // Movement: approach target
    const desiredDist = difficulty >= AIDifficulty.Hard ? 150 : 100;

    if (Math.abs(dx) > desiredDist + 50) {
      if (dx > 0) action.right = true;
      else action.left = true;
    } else if (Math.abs(dx) < desiredDist - 50) {
      // Back away if too close (harder AI)
      if (difficulty >= AIDifficulty.Medium) {
        if (dx > 0) action.left = true;
        else action.right = true;
      }
    } else {
      // Strafe randomly
      if (Math.random() < 0.3) {
        if (Math.random() > 0.5) action.left = true;
        else action.right = true;
      }
    }

    // Jump: if target is above or to navigate terrain
    if (dy < -40 && this.jumpTimers.get(player.id)! <= 0) {
      action.jump = true;
      this.jumpTimers.set(player.id, 0.3 + Math.random() * 0.5);
    }

    // Random jump for navigation
    if (player.onGround && Math.random() < (difficulty >= AIDifficulty.Hard ? 0.15 : 0.08)) {
      if (this.jumpTimers.get(player.id)! <= 0) {
        action.jump = true;
        this.jumpTimers.set(player.id, 0.5);
      }
    }

    // Shooting
    const accuracy = [0.3, 0.5, 0.7, 0.9][difficulty];
    const shootRange = 400;

    if (distance < shootRange) {
      if (Math.random() < accuracy) {
        action.shoot = true;
      }
    }

    // Grenade when enemy is close and below
    if (distance < 120 && dy > 20 && player.grenades > 0 && Math.random() < 0.1) {
      action.throwGrenade = true;
    }

    // Weapon switching (harder AI picks better weapons for range)
    if (Math.random() < 0.02 && player.weapons.length > 1) {
      action.switchWeapon = true;
    }

    // Crouch to dodge (harder AI)
    if (difficulty >= AIDifficulty.Hard && Math.random() < 0.05) {
      action.crouch = true;
    }

    return action;
  }

  getAimAngle(player: Player, state: GameState): number {
    const targetId = this.targetIds.get(player.id);
    if (targetId === undefined) return player.facing > 0 ? 0 : Math.PI;

    const target = state.players.find(p => p.id === targetId);
    if (!target || target.state !== PlayerState.Alive) {
      return player.facing > 0 ? 0 : Math.PI;
    }

    const dx = target.pos.x - player.pos.x;
    const dy = (target.pos.y - 14) - (player.pos.y - 14);
    let angle = Math.atan2(dy, dx);

    // Add inaccuracy based on difficulty
    const inaccuracy = [0.3, 0.2, 0.1, 0.03][player.config.aiDifficulty];
    angle += (Math.random() - 0.5) * inaccuracy;

    return angle;
  }
}
