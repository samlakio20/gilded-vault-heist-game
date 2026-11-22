// Staged scenes for the entry's screenshots. ?shot=<name>&seed=N paints one
// fixed moment instead of running the loop, twice, then sets
// window.__shotReady so the screenshot tool knows the frame is settled.
// The scenes are real states of the same world the player plays: the cover
// shows the whole first floor at a glance — thief, cones, cameras, loot,
// the Star and the alarm meter in one frame.

import { GUARD } from './config.js';

export function stageShot(name, world) {
  const s = world.state;
  // Put the thief somewhere the frame reads: mid-room, inside a cone's edge.
  const place = {
    cover: { x: 620, y: 380 },
    patrol: { x: 560, y: 300 },
    alarm: { x: 980, y: 180 },
    vault: { x: 1080, y: 200 },
  }[name] ?? { x: 620, y: 380 };
  s.player.x = place.x;
  s.player.y = place.y;
  s.player.facing = -Math.PI / 2;

  if (name === 'alarm') {
    // Mid-chase: the alarm is loud, a guard is closing in, one guard hunts.
    s.alarm = 100;
    s.loud = 6;
    s.guards[0].x = place.x - 120;
    s.guards[0].y = place.y + 60;
    s.guards[0].facing = Math.atan2(place.y - s.guards[0].y, place.x - s.guards[0].x);
    s.guards[0].suspicion = 1;
    s.guards[0].mode = 'chase';
    if (s.guards[1]) {
      s.guards[1].suspicion = 0.8;
      s.guards[1].mode = 'hunt';
      s.guards[1].lastSeen = { x: place.x, y: place.y };
    }
    s.smoke.push({ x: place.x - 40, y: place.y + 90, r: 90, t: 3 });
  } else if (name === 'vault') {
    // At the Star: the thief is about to lift it, camera sweeping overhead.
    s.player.x = s.target.x - 60;
    s.player.y = s.target.y + 70;
    s.player.facing = Math.atan2(s.target.y - s.player.y, s.target.x - s.player.x);
    s.loot[0].taken = true;
    s.loot[1].taken = true;
    s.score = 1200;
    if (s.cameras[0]) s.cameras[0].angle = Math.PI / 2;
  } else if (name === 'patrol') {
    // Between patrols: two cones sweeping past the thief's cover.
    s.guards[0].x = 500;
    s.guards[0].y = 240;
    s.guards[0].facing = Math.PI / 2;
    if (s.guards[1]) {
      s.guards[1].x = 900;
      s.guards[1].y = 560;
      s.guards[1].facing = Math.PI;
    }
    s.loot[0].taken = true;
    s.score = 100;
  } else {
    // cover: the opening frame, thief at the door, guards on patrol.
    s.guards[0].x = 500;
    s.guards[0].y = 200;
    s.guards[0].facing = 0;
    if (s.guards[1]) {
      s.guards[1].x = 700;
      s.guards[1].y = 560;
      s.guards[1].facing = Math.PI;
    }
  }

  // Freeze the guards' patrol drift so the staged frame is stable.
  for (const g of s.guards) {
    if (g.mode === 'patrol') g.mode = 'wait';
    g.wait = 999;
  }
  void GUARD;
  return { screen: 'play', best: 0 };
}
