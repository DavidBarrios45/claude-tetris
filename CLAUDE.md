# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Classic Tetris, vanilla JavaScript + HTML5 Canvas + CSS. No build tools, no dependencies, no package.json.

## Running / testing

No build/lint/test commands exist. To run:

```bash
start index.html       # Windows: open directly
# or serve locally (recommended for consistent behavior)
python3 -m http.server 8000
npx serve .
```

There is no test suite. Verify changes by opening the game in a browser and playing.

## Architecture

Three files, single global scope (`game.js` is not modular — everything is top-level functions/consts sharing mutable state).

- `index.html` — DOM shell: `#board` canvas (300×600, 10×20 grid @ 30px/cell), `#next-canvas` preview (120×120), HUD spans (`#score`, `#lines`, `#level`), and `#overlay` for pause/game-over.
- `style.css` — dark/retro arcade theme.
- `game.js` — all game logic, ~300 lines, organized around a few core mechanisms:
  - **Board model**: `board` is a `ROWS×COLS` matrix; `0` = empty, `1–7` = piece color index. `PIECES` defines the 7 tetrominoes as square matrices; `COLORS` maps index → hex color.
  - **Rotation**: `rotateCW` transposes + reverses rows. `tryRotate` applies the rotation then attempts wall kicks via offsets `[0, -1, 1, -2, 2]` until one doesn't collide.
  - **Collision**: `collide(shape, ox, oy)` is the single source of truth for both movement and rotation validity — checks bounds and overlap with locked cells.
  - **Game loop**: `loop(ts)` runs on `requestAnimationFrame`, accumulates `dropAccum` and drops the piece one row once it exceeds `dropInterval`; on collision below, calls `lockPiece()` (merge → clearLines → spawn).
  - **Scoring/leveling**: `LINE_SCORES = [0,100,300,500,800]` × `level`; hard drop = 2 pts/cell, soft drop = 1 pt/row. `level` increments every 10 lines; `dropInterval = max(100, 1000 - (level-1)*90)`.
  - **Ghost piece**: `ghostY()` projects `current` straight down via `collide`; drawn at `globalAlpha = 0.2`.
  - Module-level mutable state (`board, current, next, score, lines, level, paused, gameOver, ...`) is reset in `init()` and mutated directly by the input handler and loop — no encapsulation, so any change touching one of these must trace all read/write sites in `game.js`.

Tunable constants live at the top of `game.js`: `COLS`, `ROWS`, `BLOCK`, `COLORS`, `LINE_SCORES`, `dropInterval`. Changing `COLS`/`ROWS`/`BLOCK` requires updating `<canvas id="board">` width/height in `index.html` to match (`COLS×BLOCK` × `ROWS×BLOCK`).

Repo and comments are in Spanish; keep consistent when editing.
