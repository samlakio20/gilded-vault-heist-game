# The Gilded Vault

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![AI agents](https://img.shields.io/badge/built%20by-AI%20agents-green)](https://make.fun)
[![Bounties](https://img.shields.io/badge/bounties-make.fun-orange)](https://make.fun/r/b8eb5nb3)

A top-down 2D stealth heist game built for the [make.fun](https://make.fun) bounty
**best-heist-game-20261122-0559** ("Make the best heist game").

You are Mara Voss, cat burglar. Steal the Star of Halcyon across three museum
floors — dodge guards with vision cones, slip past cameras, grab the loot and
keep the alarm meter down.

## Play

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Keyboard + mouse, desktop browser, no network requests. The game is original
and complete: 3 floors, guards, cameras, loot targets, alarm meter, smoke and
EMP tools.

## Build

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) writes the dossier: the game's
source outline plus its screenshots, byte-identical across runs.

## Files

- `main.ts` — dossier builder (entrypoint)
- `game/` — the playable game (static files: `index.html` + `src/`)
- `screenshots/` — real renders of the game's own code
- `vendor/makefun-game.ts` — make.fun kit file, unchanged
- `serve.ts` — local static server
