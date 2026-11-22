// The simulation: the thief, the guards, the cameras, the alarm, the loot and
// the tools. Everything moves in fixed steps; the renderer only paints what
// this module holds. Guards patrol, grow suspicious when they see the thief,
// hunt the last seen spot, and chase while the alarm is loud. Cameras sweep.
// Smoke blocks sight; an EMP pulse blinds the cameras.

import { ALARM, CAMERA, FIELD, GUARD, LIVES, PLAYER, SCORE, TOOLS } from './config.js';
import { LEVELS } from './levels.js';

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the segment (x1,y1)-(x2,y2) crosses no wall or cover rect. */
export function lineOfSight(x1, y1, x2, y2, solids) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    for (const s of solids) {
      if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return false;
    }
  }
  return true;
}

function circleHitsSolids(x, y, r, solids) {
  for (const s of solids) {
    const cx = clamp(x, s.x, s.x + s.w);
    const cy = clamp(y, s.y, s.y + s.h);
    if (Math.hypot(x - cx, y - cy) < r) return s;
  }
  return null;
}

/** Move a circle by (dx, dy), sliding along walls and cover. */
function moveCircle(body, dx, dy, solids) {
  let nx = body.x + dx;
  if (!circleHitsSolids(nx, body.y, body.radius, solids)) body.x = nx;
  let ny = body.y + dy;
  if (!circleHitsSolids(body.x, ny, body.radius, solids)) body.y = ny;
  body.x = clamp(body.x, body.radius, FIELD.width - body.radius);
  body.y = clamp(body.y, body.radius, FIELD.height - body.radius);
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    level: null,
    player: { x: 0, y: 0, radius: PLAYER.radius, facing: 0, moving: false, sprinting: false },
    guards: [],
    cameras: [],
    loot: [],
    target: { x: 0, y: 0, taken: false },
    exit: { x: 0, y: 0, w: 0, h: 0 },
    solids: [],
    alarm: 0,
    loud: 0,
    smoke: [],
    emp: 0,
    smokeLeft: TOOLS.smokeStart,
    empLeft: TOOLS.empStart,
    lives: LIVES,
    score: 0,
    levelTime: 0,
    totalTime: 0,
    hasDiamond: false,
    status: 'play', // play | levelDone | busted | won | gameover
    events: [],
    autopilot: false,
    autoStuck: 0,
    autoSidestep: 0,
    autoDir: 1,
  };

  function loadLevel(index) {
    const def = LEVELS[index];
    state.levelIndex = index;
    state.level = def;
    state.player.x = def.start.x;
    state.player.y = def.start.y;
    state.player.facing = -Math.PI / 2;
    state.guards = def.guards.map((g) => ({
      path: g.path,
      wp: 0,
      x: g.path[0][0],
      y: g.path[0][1],
      radius: GUARD.radius,
      facing: 0,
      speed: g.speed,
      mode: 'patrol',
      wait: 0,
      suspicion: 0,
      lastSeen: null,
      hunt: 0,
    }));
    state.cameras = def.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      base: c.base,
      range: c.range ?? CAMERA.range,
      angle: c.base,
      phase: random.next() * Math.PI * 2,
      suspicion: 0,
    }));
    state.loot = def.loot.map((l) => ({ ...l, taken: false }));
    state.target = { x: def.target.x, y: def.target.y, taken: false };
    state.exit = { ...def.exit };
    state.solids = [...def.walls, ...def.cover];
    state.alarm = 0;
    state.loud = 0;
    state.smoke = [];
    state.emp = 0;
    state.smokeLeft = TOOLS.smokeStart;
    state.empLeft = TOOLS.empStart;
    state.levelTime = 0;
    state.hasDiamond = false;
    state.status = 'play';
    state.autoStuck = 0;
    state.autoSidestep = 0;
  }

  function playerInSmoke() {
    for (const s of state.smoke) {
      if (Math.hypot(state.player.x - s.x, state.player.y - s.y) < s.r) return true;
    }
    return false;
  }

  /** Can this observer see the thief right now? */
  function canSee(ox, oy, facing, fov, range, solids) {
    if (playerInSmoke()) return false;
    const dx = state.player.x - ox;
    const dy = state.player.y - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > fov) return false;
    return lineOfSight(ox, oy, state.player.x, state.player.y, solids);
  }

  function busted() {
    state.lives -= 1;
    state.events.push('caught');
    state.status = state.lives <= 0 ? 'gameover' : 'busted';
  }

  function levelComplete() {
    const bonus = SCORE.levelBonus + Math.max(0, Math.round(state.level.par - state.levelTime)) * SCORE.timeBonusPerSecond;
    state.score += bonus;
    state.events.push('win');
    state.status = state.levelIndex + 1 >= LEVELS.length ? 'won' : 'levelDone';
  }

  function nextLevel() {
    loadLevel(state.levelIndex + 1);
  }

  function restartLevel() {
    loadLevel(state.levelIndex);
  }

  function restartGame() {
    state.lives = LIVES;
    state.score = 0;
    state.totalTime = 0;
    loadLevel(0);
  }

  /** Where the autopilot wants to go: nearest loot, then the Star, then the van. */
  function autoGoal() {
    for (const l of state.loot) {
      if (!l.taken) return { x: l.x, y: l.y };
    }
    if (!state.target.taken) return { x: state.target.x, y: state.target.y };
    return { x: state.exit.x + state.exit.w / 2, y: state.exit.y + state.exit.h / 2 };
  }

  // Breadth-first search over a coarse grid, so the autopilot walks around
  // walls instead of pushing into them. Cells are blocked where a solid
  // comes within the thief's radius plus a margin.
  const GRID = 40;
  const COLS = Math.ceil(FIELD.width / GRID);
  const ROWS = Math.ceil(FIELD.height / GRID);

  function cellBlocked(cx, cy) {
    const x = cx * GRID + GRID / 2;
    const y = cy * GRID + GRID / 2;
    const r = PLAYER.radius + 6;
    for (const s of state.solids) {
      const nx = clamp(x, s.x, s.x + s.w);
      const ny = clamp(y, s.y, s.y + s.h);
      if (Math.hypot(x - nx, y - ny) < r) return true;
    }
    return false;
  }

  function findPath(sx, sy, gx, gy) {
    const start = { x: clamp(Math.floor(sx / GRID), 0, COLS - 1), y: clamp(Math.floor(sy / GRID), 0, ROWS - 1) };
    const goal = { x: clamp(Math.floor(gx / GRID), 0, COLS - 1), y: clamp(Math.floor(gy / GRID), 0, ROWS - 1) };
    const key = (x, y) => y * COLS + x;
    const prev = new Map();
    const seen = new Set([key(start.x, start.y)]);
    const queue = [start];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.x === goal.x && cur.y === goal.y) {
        const cells = [];
        let at = cur;
        while (at) {
          cells.push({ x: at.x * GRID + GRID / 2, y: at.y * GRID + GRID / 2 });
          at = prev.get(key(at.x, at.y));
        }
        cells.reverse();
        return cells;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        if (seen.has(key(nx, ny)) || cellBlocked(nx, ny)) continue;
        seen.add(key(nx, ny));
        prev.set(key(nx, ny), cur);
        queue.push({ x: nx, y: ny });
      }
    }
    return [];
  }

  /** Can the thief's circle travel the straight segment without hitting a solid? */
  function canTravel(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (circleHitsSolids(x1 + dx * t, y1 + dy * t, PLAYER.radius, state.solids)) return false;
    }
    return true;
  }

  function autoMove() {
    const goal = autoGoal();
    const p = state.player;
    const goalKey = `${Math.round(goal.x)},${Math.round(goal.y)}`;
    state.autoRepath -= 1 / 60;
    if (!state.autoPath || state.autoGoalKey !== goalKey || state.autoRepath <= 0) {
      state.autoPath = findPath(p.x, p.y, goal.x, goal.y);
      state.autoGoalKey = goalKey;
      state.autoRepath = 0.5;
    }
    // Follow the furthest path point the thief's circle can actually travel
    // to: a zero-width ray is not enough, the circle must clear the corners.
    let aim = null;
    for (let i = state.autoPath.length - 1; i >= 0; i--) {
      const wp = state.autoPath[i];
      if (canTravel(p.x, p.y, wp.x, wp.y)) {
        aim = wp;
        break;
      }
    }
    if (!aim) {
      // Fall back to the path cell after the one nearest the thief.
      let best = 0;
      let bestD = Infinity;
      state.autoPath.forEach((wp, i) => {
        const d = Math.hypot(wp.x - p.x, wp.y - p.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      aim = state.autoPath[Math.min(best + 1, state.autoPath.length - 1)] ?? goal;
    }
    const dx = aim.x - p.x;
    const dy = aim.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return { x: 0, y: 0 };
    return { x: dx / dist, y: dy / dist };
  }

  function update(dt, input) {
    state.events.length = 0;
    if (state.status !== 'play') return;
    state.levelTime += dt;
    state.totalTime += dt;
    if (state.emp > 0) state.emp -= dt;
    for (const s of state.smoke) s.t -= dt;
    state.smoke = state.smoke.filter((s) => s.t > 0);

    const p = state.player;

    // Tools.
    if (input.action('smoke') && state.smokeLeft > 0) {
      state.smokeLeft -= 1;
      state.smoke.push({ x: p.x, y: p.y, r: TOOLS.smokeRadius, t: TOOLS.smokeTime });
      state.events.push('smoke');
    }
    if (input.action('emp') && state.empLeft > 0 && state.emp <= 0) {
      state.empLeft -= 1;
      state.emp = TOOLS.empTime;
      state.events.push('emp');
    }

    // Movement.
    let move = input.move();
    let sprinting = input.sprint() && (move.x !== 0 || move.y !== 0);
    if (state.autopilot) {
      move = autoMove();
      sprinting = state.alarm > 40;
      // Drop smoke when the floor is about to go loud.
      if (state.alarm > 75 && state.smokeLeft > 0 && state.smoke.length === 0) {
        state.smokeLeft -= 1;
        state.smoke.push({ x: p.x, y: p.y, r: TOOLS.smokeRadius, t: TOOLS.smokeTime });
        state.events.push('smoke');
      }
    }
    const speed = sprinting ? PLAYER.sprintSpeed : PLAYER.speed;
    const prevX = p.x;
    const prevY = p.y;
    moveCircle(p, move.x * speed * dt, move.y * speed * dt, state.solids);
    p.moving = p.x !== prevX || p.y !== prevY;
    p.sprinting = sprinting;
    if (p.moving) p.facing = Math.atan2(p.y - prevY, p.x - prevX);

    // Pickups.
    for (const l of state.loot) {
      if (!l.taken && Math.hypot(p.x - l.x, p.y - l.y) < PLAYER.pickupRadius) {
        l.taken = true;
        state.score += l.kind === 'big' ? SCORE.lootBig : SCORE.lootSmall;
        state.events.push('pickup');
      }
    }
    if (!state.target.taken && Math.hypot(p.x - state.target.x, p.y - state.target.y) < PLAYER.pickupRadius) {
      state.target.taken = true;
      state.hasDiamond = true;
      state.score += SCORE.diamond;
      state.events.push('diamond');
    }

    // The exit opens once the Star is taken.
    if (
      state.hasDiamond &&
      p.x >= state.exit.x && p.x <= state.exit.x + state.exit.w &&
      p.y >= state.exit.y && p.y <= state.exit.y + state.exit.h
    ) {
      levelComplete();
      return;
    }

    // Observers: guards and cameras.
    const noise = sprinting ? PLAYER.sprintNoise : 1;
    let anySeeing = false;
    for (const g of state.guards) {
      const seeing = canSee(g.x, g.y, g.facing, GUARD.fov, GUARD.range, state.solids);
      if (seeing) {
        anySeeing = true;
        const closeness = 1 - (Math.hypot(p.x - g.x, p.y - g.y) / GUARD.range) * 0.6;
        g.suspicion = clamp(g.suspicion + GUARD.spotRate * closeness * noise * dt, 0, 1);
        g.lastSeen = { x: p.x, y: p.y };
        state.alarm = clamp(state.alarm + GUARD.spotRate * closeness * noise * 30 * dt, 0, ALARM.trigger);
      } else {
        g.suspicion = clamp(g.suspicion - 0.25 * dt, 0, 1);
      }

      if (state.loud > 0) {
        g.mode = 'chase';
      } else if (g.suspicion > 0.55) {
        g.mode = 'hunt';
        g.hunt = GUARD.huntTime;
      } else if (g.mode === 'hunt') {
        g.hunt -= dt;
        if (g.hunt <= 0) g.mode = 'patrol';
      }

      if (g.mode === 'patrol' || g.mode === 'wait') {
        if (g.wait > 0) {
          g.wait -= dt;
          g.mode = 'wait';
        } else {
          const wp = g.path[g.wp];
          const dx = wp[0] - g.x;
          const dy = wp[1] - g.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 6) {
            g.wp = (g.wp + 1) % g.path.length;
            g.wait = GUARD.waitTime;
            g.mode = 'wait';
          } else {
            g.facing = Math.atan2(dy, dx);
            moveCircle(g, (dx / dist) * g.speed * dt, (dy / dist) * g.speed * dt, state.solids);
          }
        }
      } else if (g.mode === 'hunt' && g.lastSeen) {
        const dx = g.lastSeen.x - g.x;
        const dy = g.lastSeen.y - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
          g.facing = Math.atan2(dy, dx);
          moveCircle(g, (dx / dist) * g.speed * dt, (dy / dist) * g.speed * dt, state.solids);
        } else {
          g.facing += dt * 1.5; // look around the last seen spot
        }
      } else if (g.mode === 'chase') {
        const dx = p.x - g.x;
        const dy = p.y - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          g.facing = Math.atan2(dy, dx);
          moveCircle(g, (dx / dist) * GUARD.chaseSpeed * dt, (dy / dist) * GUARD.chaseSpeed * dt, state.solids);
        }
      }

      // Caught: a guard that can see the thief grabs them up close.
      if (
        Math.hypot(p.x - g.x, p.y - g.y) < GUARD.catchRadius &&
        canSee(g.x, g.y, g.facing, Math.PI, GUARD.range, state.solids)
      ) {
        busted();
        return;
      }
    }

    for (const c of state.cameras) {
      if (state.emp > 0) {
        c.suspicion = 0;
        continue;
      }
      c.angle = c.base + Math.sin(state.totalTime * CAMERA.sweepSpeed + c.phase) * CAMERA.sweepArc;
      const seeing = canSee(c.x, c.y, c.angle, CAMERA.fov, c.range, state.solids);
      if (seeing) {
        anySeeing = true;
        const closeness = 1 - (Math.hypot(p.x - c.x, p.y - c.y) / c.range) * 0.6;
        c.suspicion = clamp(c.suspicion + CAMERA.spotRate * closeness * noise * dt, 0, 1);
        state.alarm = clamp(state.alarm + CAMERA.spotRate * closeness * noise * 30 * dt, 0, ALARM.trigger);
      } else {
        c.suspicion = clamp(c.suspicion - 0.25 * dt, 0, 1);
      }
    }

    if (!anySeeing && state.loud <= 0) {
      state.alarm = clamp(state.alarm - ALARM.decay * dt, 0, ALARM.trigger);
    }

    if (state.alarm >= ALARM.trigger && state.loud <= 0) {
      state.loud = ALARM.loudTime;
      state.events.push('alarm');
    }
    if (state.loud > 0) state.loud -= dt;
  }

  loadLevel(0);

  return {
    state,
    loadLevel,
    nextLevel,
    restartLevel,
    restartGame,
    update,
    lineOfSight,
  };
}
