// Paints the museum, the cones, the crew and the HUD on one canvas. The
// playfield is the fixed 1280x720 logical area from config.js, scaled to the
// window; every rule in world.js is in that space, so the picture and the
// simulation always agree.

import { ALARM, CAMERA, COLORS, FIELD, GUARD, TOOLS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_LEVEL = 'level';
export const SCREEN_OVER = 'over';
export const SCREEN_WON = 'won';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.round(FIELD.width * scale);
    canvas.height = Math.round(FIELD.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function wedge(x, y, facing, fov, range, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, facing - fov, facing + fov);
    ctx.closePath();
    ctx.fill();
  }

  function rect(r, fill, edge) {
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    }
  }

  function drawFloor(level) {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Checkerboard tiles, faint, so the room reads at a glance.
    ctx.fillStyle = COLORS.floorAlt;
    const tile = 80;
    for (let y = 0; y < FIELD.height / tile; y++) {
      for (let x = 0; x < FIELD.width / tile; x++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
      }
    }
    // A carpet runner down the middle of each level's main hall.
    ctx.fillStyle = COLORS.carpet;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, FIELD.height / 2 - 30, FIELD.width, 60);
    ctx.globalAlpha = 1;
    void level;
  }

  function drawCones(world) {
    const s = world.state;
    for (const c of s.cameras) {
      if (s.emp > 0) continue;
      const hot = c.suspicion > 0.4;
      wedge(c.x, c.y, c.angle, CAMERA.fov, c.range, hot ? 'rgba(255, 90, 50, 0.30)' : COLORS.cameraCone);
    }
    for (const g of s.guards) {
      const hot = g.suspicion > 0.4 || s.loud > 0;
      wedge(g.x, g.y, g.facing, GUARD.fov, GUARD.range, hot ? COLORS.coneHot : COLORS.cone);
    }
  }

  function drawStatic(world) {
    const s = world.state;
    const def = s.level;
    for (const w of def.walls) rect(w, COLORS.wall, COLORS.wallEdge);
    for (const c of def.cover) {
      rect(c, COLORS.cover, COLORS.coverEdge);
      // Glass top on each display case.
      ctx.fillStyle = 'rgba(160, 220, 255, 0.25)';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
    }
    // The exit: a green doorway with the getaway van waiting beyond it.
    const e = s.exit;
    ctx.fillStyle = s.hasDiamond ? COLORS.exit : '#3a5a44';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = s.hasDiamond ? '#b8ffd6' : '#56705e';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x + 1.5, e.y + 1.5, e.w - 3, e.h - 3);
    ctx.fillStyle = s.hasDiamond ? '#0d2b18' : '#9db8a6';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.hasDiamond ? 'VAN — GO!' : 'VAN (LOCKED)', e.x + e.w / 2, e.y + e.h / 2 + 5);
  }

  function drawLoot(world, time) {
    const s = world.state;
    for (const l of s.loot) {
      if (l.taken) continue;
      const pulse = 1 + Math.sin(time * 4 + l.x) * 0.15;
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.arc(l.x, l.y, (l.kind === 'big' ? 11 : 8) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5c00';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(l.kind === 'big' ? '$' : '•', l.x, l.y + 4);
    }
    if (!s.target.taken) {
      const t = s.target;
      const pulse = 1 + Math.sin(time * 5) * 0.2;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(Math.PI / 4);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = COLORS.diamond;
      ctx.fillRect(-11, -11, 22, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(-11, -11, 22, 6);
      ctx.restore();
      ctx.fillStyle = COLORS.diamond;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ THE STAR ★', t.x, t.y - 26);
    }
  }

  function drawGuards(world) {
    const s = world.state;
    for (const g of s.guards) {
      ctx.fillStyle = COLORS.guardDark;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.guard;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      // Facing tick and a tiny torch dot.
      ctx.strokeStyle = '#ffd9d9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.facing) * (g.radius + 8), g.y + Math.sin(g.facing) * (g.radius + 8));
      ctx.stroke();
      if (g.suspicion > 0.15 || s.loud > 0) {
        ctx.fillStyle = g.suspicion > 0.55 || s.loud > 0 ? '#ff5347' : '#ffb347';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.suspicion > 0.55 || s.loud > 0 ? '!' : '?', g.x, g.y - g.radius - 8);
      }
    }
    for (const c of s.cameras) {
      ctx.fillStyle = s.emp > 0 ? '#555' : '#c96a1e';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd9a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(c.angle) * 16, c.y + Math.sin(c.angle) * 16);
      ctx.stroke();
      if (s.emp > 0) {
        ctx.fillStyle = '#9db8ff';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMP', c.x, c.y - 14);
      }
    }
  }

  function drawSmoke(world) {
    for (const s of world.state.smoke) {
      ctx.fillStyle = COLORS.smoke;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(world, time) {
    const p = world.state.player;
    ctx.fillStyle = COLORS.playerDark;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    // Hood point showing the direction the thief faces.
    ctx.fillStyle = '#3a2f05';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 8, p.y + Math.sin(p.facing) * 8, 5, 0, Math.PI * 2);
    ctx.fill();
    if (p.sprinting) {
      ctx.strokeStyle = 'rgba(232, 193, 90, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 6 + Math.sin(time * 12) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawHud(world) {
    const s = world.state;
    const W = FIELD.width;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.82)';
    ctx.fillRect(0, 0, W, 46);
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.level.name, 14, 29);
    // Alarm meter.
    const ax = 330;
    ctx.fillStyle = '#8a8f9e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('ALARM', ax, 29);
    ctx.fillStyle = '#22242e';
    ctx.fillRect(ax + 62, 14, 220, 18);
    const frac = s.alarm / ALARM.trigger;
    ctx.fillStyle = s.loud > 0 ? COLORS.alarm : frac > 0.6 ? '#ff9a3d' : COLORS.safe;
    ctx.fillRect(ax + 62, 14, 220 * frac, 18);
    ctx.strokeStyle = '#565d78';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax + 62.5, 14.5, 220, 18);
    if (s.loud > 0) {
      ctx.fillStyle = COLORS.alarm;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('LOUD!', ax + 292, 29);
    }
    // Right-hand cluster: score, loot, tools, lives, time.
    const lootGot = s.loot.filter((l) => l.taken).length;
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 15px system-ui, sans-serif';
    const mins = Math.floor(s.levelTime / 60);
    const secs = Math.floor(s.levelTime % 60).toString().padStart(2, '0');
    ctx.fillText(
      `$${s.score}   ◆ ${lootGot}/${s.loot.length}${s.hasDiamond ? ' ★' : ''}   ◐ ${s.smokeLeft}   ⚡ ${s.empLeft}   ♥ ${s.lives}   ${mins}:${secs}`,
      W - 14,
      29,
    );
    // Objective reminder while the Star is still in the room.
    if (!s.hasDiamond) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232, 230, 223, 0.75)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Steal the Star, then reach the green van.', W / 2, FIELD.height - 12);
    }
  }

  function drawVignette(world) {
    const s = world.state;
    if (s.loud <= 0 && s.alarm < 40) return;
    const a = s.loud > 0 ? 0.28 + Math.sin(performance.now() / 120) * 0.08 : (s.alarm / 100) * 0.18;
    const grad = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.35,
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.75,
    );
    grad.addColorStop(0, 'rgba(255, 40, 30, 0)');
    grad.addColorStop(1, `rgba(255, 40, 30, ${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(title, lines, hint) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.hud;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(title, FIELD.width / 2, 240);
    ctx.font = '19px system-ui, sans-serif';
    let y = 300;
    for (const line of lines) {
      ctx.fillText(line, FIELD.width / 2, y);
      y += 30;
    }
    if (hint) {
      ctx.fillStyle = '#b9bcc9';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(hint, FIELD.width / 2, y + 30);
    }
  }

  return {
    fit,
    draw(world, screen, time) {
      fit();
      const s = world.state;
      drawFloor(s.level);
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_BUSTED) {
        drawCones(world);
        drawStatic(world);
        drawLoot(world, time);
        drawGuards(world);
        drawSmoke(world);
        drawPlayer(world, time);
        drawVignette(world);
        drawHud(world);
      }
      if (screen === SCREEN_TITLE) {
        drawCones(world);
        drawStatic(world);
        drawLoot(world, time);
        drawGuards(world);
        drawPlayer(world, time);
        panel(
          'THE GILDED VAULT',
          [
            'Mara Voss has one night to lift the Star of Halcyon.',
            'Cross the room, read the cones, grab the Star, reach the van.',
            '',
            'WASD / arrows — move    Shift — sprint (loud!)    Q — smoke bomb    F — EMP pulse',
            'Dodge the guards’ vision cones and the sweeping cameras.',
            'If the alarm fills, run: a guard that catches you ends the night.',
          ],
          'Press Enter to start the job',
        );
      } else if (screen === SCREEN_PAUSED) {
        panel('PAUSED', ['The crew waits in the dark.'], 'Press P to keep moving');
      } else if (screen === SCREEN_BUSTED) {
        panel(
          'BUSTED!',
          [
            `A guard grabbed Mara. ${s.lives} ${s.lives === 1 ? 'life' : 'lives'} left.`,
            `Score so far: $${s.score}`,
          ],
          'Press R to try the floor again',
        );
      } else if (screen === SCREEN_LEVEL) {
        panel(
          'CLEAN GETAWAY',
          [
            `${s.level.name} cleared.`,
            `Score: $${s.score}`,
            'The next floor is tighter, faster, and better watched.',
          ],
          'Press Enter for the next floor',
        );
      } else if (screen === SCREEN_OVER) {
        panel(
          'THE JOB IS BLOWN',
          [
            'Three strikes and the crew is in cuffs.',
            `Final score: $${s.score}`,
          ],
          'Press Enter to plan the job again',
        );
      } else if (screen === SCREEN_WON) {
        panel(
          'THE STAR IS YOURS',
          [
            'Three floors, one diamond, and a van that never waited.',
            `Final score: $${s.score} in ${Math.floor(s.totalTime / 60)}:${Math.floor(s.totalTime % 60).toString().padStart(2, '0')}`,
            'Mara Voss retires rich. The museum hires better guards.',
          ],
          'Press Enter to run it again',
        );
      }
    },
  };
}
