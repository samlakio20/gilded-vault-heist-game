# gilded-vault-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/samlakio20/gilded-vault-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/samlakio20/gilded-vault-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Gilded Vault — a 3-floor top-down stealth heist game. You are Mara Voss, cat
burglar: steal the Star of Halcyon across three museum floors, dodge guards with
vision cones, slip past cameras, grab the loot and keep the alarm meter down.

## Run it

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

---

<sub>Entered on [make.fun](https://make.fun/?ref=b8eb5nb3&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
