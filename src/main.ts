import { Game } from './game';

// ============================================================
// Entry Point - Friendly Strike Web
// ============================================================

const canvas = document.getElementById('game') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element not found');

const game = new Game(canvas);
game.start();
