// Every tuning number and colour for The Gilded Vault in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  speed: 230,
  sprintSpeed: 360,
  /** Sprinting is loud: observers fill the alarm this much faster. */
  sprintNoise: 1.6,
  pickupRadius: 30,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 95,
  chaseSpeed: 205,
  /** Vision cone: half-angle and range in pixels. */
  fov: 1.05, // ~60 degrees each side
  range: 240,
  /** Suspicion per second at point-blank range, scaled by closeness. */
  spotRate: 1.5,
  /** Seconds a guard keeps hunting the last seen spot. */
  huntTime: 4,
  /** Seconds a guard waits at each patrol waypoint. */
  waitTime: 1.2,
};

export const CAMERA = {
  fov: 0.62, // ~35 degrees each side
  range: 260,
  spotRate: 1.2,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 1.1, // radians each side of the base angle
};

export const ALARM = {
  /** Alarm level at which the whole floor goes loud. */
  trigger: 100,
  /** How fast the alarm falls while nobody sees the thief. */
  decay: 14,
  /** Seconds the loud alarm lasts once triggered. */
  loudTime: 8,
  /** How close a guard must get to grab the thief during the alarm. */
  catchRadius: 30,
};

export const TOOLS = {
  smokeStart: 2, // smoke bombs per level
  empStart: 1, // EMP pulses per level
  smokeRadius: 110,
  smokeTime: 3.5,
  empTime: 6,
};

export const LIVES = 3;

/** Score values. */
export const SCORE = {
  lootSmall: 100,
  lootBig: 250,
  diamond: 1000,
  levelBonus: 500,
  timeBonusPerSecond: 10,
};

export const COLORS = {
  floor: '#1a1d29',
  floorAlt: '#20242f',
  wall: '#3a3f52',
  wallEdge: '#565d78',
  cover: '#2c4a5e', // display cases and crates: safe cover
  coverEdge: '#5f93ad',
  carpet: '#4a2b33',
  player: '#e8c15a', // the thief's golden hood
  playerDark: '#8a6d1f',
  guard: '#d84a4a',
  guardDark: '#7e2222',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneHot: 'rgba(255, 80, 60, 0.30)',
  cameraCone: 'rgba(255, 140, 60, 0.16)',
  loot: '#ffd94a',
  diamond: '#7fe7ff',
  exit: '#58d68d',
  van: '#58d68d',
  smoke: 'rgba(200, 200, 210, 0.45)',
  hud: '#e8e6df',
  alarm: '#ff5347',
  danger: '#ff5347',
  safe: '#58d68d',
};
