// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between seven screens:
// title, play, paused, busted, level clear, game over and victory.
//
// ?seed=N fixes the level's random timings. ?shot=cover|patrol|alarm|vault
// (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot. ?auto=1 lets the
// built-in autopilot play, so a headless test can reach the getaway van.
//
// Debug hooks for the playtest: window.__screen() names the screen,
// window.__world is the live world state, window.__paused() says whether
// the game is paused, and window.__state() is a one-line summary.

import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_BUSTED,
  SCREEN_LEVEL,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WON,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const auto = params.get('auto') === '1';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();
world.state.autopilot = auto;

let screen = SCREEN_TITLE;
let paused = false;
let acc = 0;
let last = performance.now();

function soundFor(event) {
  if (event === 'pickup') audio.pickup();
  else if (event === 'diamond') audio.diamond();
  else if (event === 'smoke') audio.smoke();
  else if (event === 'emp') audio.emp();
  else if (event === 'alarm') audio.alarm();
  else if (event === 'caught') audio.caught();
  else if (event === 'win') audio.win();
}

function step(dt) {
  if (screen !== SCREEN_PLAY || paused) return;
  world.update(dt, input);
  for (const event of world.state.events) soundFor(event);
  const st = world.state.status;
  if (st === 'levelDone') screen = SCREEN_LEVEL;
  else if (st === 'busted') screen = SCREEN_BUSTED;
  else if (st === 'gameover') screen = SCREEN_OVER;
  else if (st === 'won') screen = SCREEN_WON;
}

function confirm() {
  audio.unlock();
  audio.click();
  if (screen === SCREEN_TITLE) {
    world.restartGame();
    screen = SCREEN_PLAY;
  } else if (screen === SCREEN_LEVEL) {
    world.nextLevel();
    screen = SCREEN_PLAY;
  } else if (screen === SCREEN_OVER || screen === SCREEN_WON) {
    world.restartGame();
    screen = SCREEN_PLAY;
  }
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, MAX_FRAME);
  last = now;

  if (input.action(ACTION_MUTE)) {
    audio.toggleMute();
  }
  if (input.action(ACTION_PAUSE) && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
    paused = !paused;
    screen = paused ? SCREEN_PAUSED : SCREEN_PLAY;
    audio.click();
  }
  if (input.action(ACTION_CONFIRM)) confirm();
  if (input.action(ACTION_RESTART) && (screen === SCREEN_BUSTED || screen === SCREEN_PLAY)) {
    world.restartLevel();
    screen = SCREEN_PLAY;
  }
  if (auto && screen === SCREEN_TITLE) confirm();
  if (auto && screen === SCREEN_BUSTED) {
    world.restartLevel();
    screen = SCREEN_PLAY;
  }
  if (auto && screen === SCREEN_LEVEL) {
    world.nextLevel();
    screen = SCREEN_PLAY;
  }

  step(dt);
  renderer.draw(world, screen, now / 1000);
  status.textContent =
    screen === SCREEN_PLAY
      ? `${world.state.level.name}. Score $${world.state.score}. Alarm ${Math.round(world.state.alarm)} percent.`
      : screen;
  input.endFrame();
  requestAnimationFrame(frame);
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

// Debug hooks for the headless playtest.
window.__screen = () => screen;
window.__world = world.state;
window.__paused = () => paused;
window.__state = () => {
  const s = world.state;
  return `${screen} level=${s.levelIndex + 1} score=${s.score} alarm=${Math.round(s.alarm)} lives=${s.lives} diamond=${s.hasDiamond} loot=${s.loot.filter((l) => l.taken).length}/${s.loot.length} player=(${Math.round(s.player.x)},${Math.round(s.player.y)})`;
};

if (shot) {
  runShot(shot);
} else {
  window.addEventListener('resize', () => renderer.fit());
  renderer.fit();
  requestAnimationFrame(frame);
}
