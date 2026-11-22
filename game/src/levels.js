// The three floors of the Halcyon Museum job. Each level is data only: walls
// and cover (both block movement and sight), guard patrols, cameras, loot,
// the Star of Halcyon target, where the thief starts and where the getaway
// van waits. Coordinates are in the 1280x720 logical field; the field's
// outer edge is always a wall.

export const LEVELS = [
  {
    name: 'Floor 1 — The Gallery',
    brief: 'Slip past the night guards, lift the Star of Halcyon, reach the van.',
    par: 90,
    start: { x: 90, y: 640 },
    exit: { x: 1180, y: 620, w: 84, h: 64 },
    target: { x: 1150, y: 120 },
    walls: [
      { x: 420, y: 0, w: 24, h: 420 },
      { x: 700, y: 430, w: 580, h: 24 },
    ],
    cover: [
      { x: 540, y: 220, w: 90, h: 50 },
      { x: 850, y: 180, w: 90, h: 50 },
      { x: 200, y: 520, w: 90, h: 50 },
      { x: 980, y: 480, w: 90, h: 50 },
    ],
    guards: [
      { path: [[500, 150], [500, 380], [650, 380], [650, 150]], speed: 95 },
      { path: [[250, 600], [1150, 600]], speed: 90 },
    ],
    cameras: [
      { x: 1150, y: 60, base: Math.PI / 2, range: 260 },
    ],
    loot: [
      { x: 300, y: 150, kind: 'small' },
      { x: 620, y: 320, kind: 'small' },
      { x: 1050, y: 120, kind: 'small' },
      { x: 700, y: 600, kind: 'big' },
    ],
  },
  {
    name: 'Floor 2 — The Vault Floor',
    brief: 'Two cameras now, three guards, and the vault door is watched.',
    par: 120,
    start: { x: 80, y: 640 },
    exit: { x: 60, y: 60, w: 84, h: 64 },
    target: { x: 1200, y: 100 },
    walls: [
      { x: 300, y: 0, w: 24, h: 300 },
      { x: 300, y: 480, w: 24, h: 240 },
      { x: 300, y: 360, w: 600, h: 24 },
      { x: 900, y: 360, w: 24, h: 360 },
    ],
    cover: [
      { x: 500, y: 80, w: 90, h: 50 },
      { x: 680, y: 210, w: 90, h: 50 },
      { x: 1100, y: 80, w: 90, h: 50 },
      { x: 500, y: 550, w: 90, h: 50 },
      { x: 1050, y: 520, w: 90, h: 50 },
      { x: 150, y: 500, w: 90, h: 50 },
    ],
    guards: [
      { path: [[450, 150], [800, 150], [800, 300], [450, 300]], speed: 100 },
      { path: [[350, 500], [850, 500]], speed: 95 },
      { path: [[1000, 150], [1000, 600], [1150, 600], [1150, 150]], speed: 100 },
    ],
    cameras: [
      { x: 700, y: 40, base: Math.PI / 2, range: 260 },
      { x: 1150, y: 380, base: Math.PI, range: 260 },
    ],
    loot: [
      { x: 150, y: 150, kind: 'small' },
      { x: 600, y: 100, kind: 'small' },
      { x: 950, y: 250, kind: 'small' },
      { x: 1200, y: 450, kind: 'small' },
      { x: 400, y: 620, kind: 'small' },
      { x: 1000, y: 650, kind: 'big' },
    ],
  },
  {
    name: 'Floor 3 — The Rooftop',
    brief: 'The roof is crawling. Take the Star and run for the van.',
    par: 150,
    start: { x: 640, y: 660 },
    exit: { x: 60, y: 60, w: 84, h: 64 },
    target: { x: 640, y: 80 },
    walls: [
      { x: 0, y: 200, w: 500, h: 24 },
      { x: 700, y: 200, w: 580, h: 24 },
      { x: 700, y: 200, w: 24, h: 300 },
      { x: 300, y: 500, w: 700, h: 24 },
    ],
    cover: [
      { x: 200, y: 300, w: 90, h: 50 },
      { x: 1000, y: 300, w: 90, h: 50 },
      { x: 350, y: 520, w: 90, h: 50 },
      { x: 850, y: 520, w: 90, h: 50 },
      { x: 560, y: 330, w: 60, h: 60 },
    ],
    guards: [
      { path: [[200, 100], [600, 100]], speed: 110 },
      { path: [[800, 100], [1150, 100]], speed: 110 },
      { path: [[200, 600], [1150, 600]], speed: 105 },
      { path: [[640, 260], [640, 470]], speed: 100 },
    ],
    cameras: [
      { x: 640, y: 200, base: Math.PI / 2, range: 260 },
      { x: 100, y: 360, base: 0, range: 260 },
      { x: 1180, y: 360, base: Math.PI, range: 260 },
    ],
    loot: [
      { x: 150, y: 100, kind: 'small' },
      { x: 1150, y: 100, kind: 'small' },
      { x: 150, y: 620, kind: 'small' },
      { x: 1150, y: 620, kind: 'small' },
      { x: 400, y: 400, kind: 'small' },
      { x: 900, y: 400, kind: 'big' },
    ],
  },
];
