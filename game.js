'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - azul pálido
  '#ffb74d', // L - orange
  '#b0bec5', // Tuerca - gris metálico
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // Tuerca (hueco central)
];

const NUT_TYPE = 8;

const LINE_SCORES = [0, 100, 300, 500, 800];

// ---- Skins visuales ----
// Cada skin define su propia paleta de colores y sus funciones de dibujo
// para el bloque relleno y el agujero de la pieza "Tuerca".
const SKINS = {
  retro: {
    colors: [
      null,
      '#4dd0e1', // I - cyan
      '#ffd54f', // O - yellow
      '#ba68c8', // T - purple
      '#81c784', // S - green
      '#e57373', // Z - red
      '#90caf9', // J - azul pálido
      '#ffb74d', // L - orange
      '#b0bec5', // Tuerca - gris metálico
    ],
    gridColor: null, // usa el color de rejilla del tema claro/oscuro
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // highlight
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
    drawNutHole(context, x, y, size, alpha) {
      context.globalAlpha = alpha ?? 1;
      context.strokeStyle = this.colors[NUT_TYPE];
      context.lineWidth = Math.max(2, size * 0.09);
      context.beginPath();
      context.arc(x * size + size / 2, y * size + size / 2, size * 0.34, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    },
  },
  neon: {
    colors: [
      null,
      '#00e5ff', // I
      '#ffea00', // O
      '#e040fb', // T
      '#00e676', // S
      '#ff1744', // Z
      '#40c4ff', // J
      '#ff9100', // L
      '#eeeeee', // Tuerca
    ],
    gridColor: '#151522',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.shadowBlur = 12;
      context.shadowColor = color;
      context.fillStyle = color;
      context.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
      // resetear el glow para que no contamine el resto del canvas
      context.shadowBlur = 0;
      context.globalAlpha = 1;
    },
    drawNutHole(context, x, y, size, alpha) {
      context.globalAlpha = alpha ?? 1;
      const color = this.colors[NUT_TYPE];
      context.shadowBlur = 10;
      context.shadowColor = color;
      context.strokeStyle = color;
      context.lineWidth = Math.max(2, size * 0.09);
      context.beginPath();
      context.arc(x * size + size / 2, y * size + size / 2, size * 0.34, 0, Math.PI * 2);
      context.stroke();
      context.shadowBlur = 0;
      context.globalAlpha = 1;
    },
  },
  pastel: {
    colors: [
      null,
      '#a8e6ec', // I
      '#fff3b0', // O
      '#d9b8e6', // T
      '#c1e8c1', // S
      '#f4b8b8', // Z
      '#c3dffc', // J
      '#ffd9b3', // L
      '#dde3e8', // Tuerca
    ],
    gridColor: null,
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      const px = x * size + 1;
      const py = y * size + 1;
      const w = size - 2;
      const h = size - 2;
      const r = size * 0.22;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.beginPath();
      if (typeof context.roundRect === 'function') {
        context.roundRect(px, py, w, h, r);
      } else {
        context.rect(px, py, w, h);
      }
      context.fill();
      context.globalAlpha = 1;
    },
    drawNutHole(context, x, y, size, alpha) {
      context.globalAlpha = alpha ?? 1;
      context.strokeStyle = this.colors[NUT_TYPE];
      context.lineWidth = Math.max(2, size * 0.09);
      context.beginPath();
      context.arc(x * size + size / 2, y * size + size / 2, size * 0.34, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    },
  },
  pixel: {
    colors: [
      null,
      '#4dd0e1', // I
      '#ffd54f', // O
      '#ba68c8', // T
      '#81c784', // S
      '#e57373', // Z
      '#90caf9', // J
      '#ffb74d', // L
      '#b0bec5', // Tuerca
    ],
    gridColor: null,
    drawBlock(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      const px = x * size + 1;
      const py = y * size + 1;
      const w = size - 2;
      const h = size - 2;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(px, py, w, h);
      // textura de píxeles: sub-cuadrícula alternando tonos claros/oscuros
      const sub = Math.max(2, Math.floor(size / 6));
      for (let sy = 0; sy < h; sy += sub) {
        for (let sx = 0; sx < w; sx += sub) {
          const light = (Math.floor(sx / sub) + Math.floor(sy / sub)) % 2 === 0;
          context.fillStyle = light ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
          context.fillRect(px + sx, py + sy, Math.min(sub, w - sx), Math.min(sub, h - sy));
        }
      }
      context.globalAlpha = 1;
    },
    drawNutHole(context, x, y, size, alpha) {
      context.globalAlpha = alpha ?? 1;
      context.strokeStyle = this.colors[NUT_TYPE];
      context.lineWidth = Math.max(2, size * 0.09);
      context.beginPath();
      context.arc(x * size + size / 2, y * size + size / 2, size * 0.34, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    },
  },
};

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');
const skinSelect = document.getElementById('skin-select');

const THEME_STORAGE_KEY = 'tetris-theme';
const SKIN_STORAGE_KEY = 'tetris-skin';

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let gridColor;
let currentSkin;

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  drawNext();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  currentSkin.drawBlock(context, x, y, colorIndex, size, alpha);
}

function drawNutHole(context, x, y, size, alpha) {
  currentSkin.drawNutHole(context, x, y, size, alpha);
}

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  themeToggle.checked = theme === 'light';
  gridColor = getComputedStyle(document.body).getPropertyValue('--grid-color').trim();
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applySkin(skin) {
  currentSkin = SKINS[skin] || SKINS.retro;
  document.body.classList.toggle('skin-neon', currentSkin === SKINS.neon);
  skinSelect.value = skin;
  localStorage.setItem(SKIN_STORAGE_KEY, skin);
}

function drawGrid() {
  ctx.strokeStyle = currentSkin.gridColor || gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);
  if (current.type === NUT_TYPE) drawNutHole(ctx, current.x + 1, gy + 1, BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
  if (current.type === NUT_TYPE) drawNutHole(ctx, current.x + 1, current.y + 1, BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
  if (next.type === NUT_TYPE) drawNutHole(nextCtx, offX + 1, offY + 1, NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  if (gameOver || paused) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  if (gameOver) return;
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

themeToggle.addEventListener('change', () => {
  applyTheme(themeToggle.checked ? 'light' : 'dark');
});

skinSelect.addEventListener('change', () => {
  applySkin(skinSelect.value);
  draw();
  drawNext();
});

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark');
applySkin(localStorage.getItem(SKIN_STORAGE_KEY) || 'retro');
init();
