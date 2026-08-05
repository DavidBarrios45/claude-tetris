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

const SKIN_PALETTES = {
  retro: COLORS,
  neon: [null, '#00e5ff', '#ffee00', '#e040fb', '#00e676', '#ff1744', '#2979ff', '#ff9100', '#eeeeee'],
  pastel: [null, '#a8dadc', '#ffe8a3', '#d8bfd8', '#b5e8b0', '#f7b2b7', '#b3d1f0', '#ffd1a8', '#d6d6e0'],
  pixel: COLORS,
};

const SKIN_STORAGE_KEY = 'tetris-skin';

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
const overlayStats = document.getElementById('overlay-stats');
const newRecordForm = document.getElementById('new-record-form');
const playerNameInput = document.getElementById('player-name-input');
const saveScoreBtn = document.getElementById('save-score-btn');
const overlayScoreboard = document.getElementById('overlay-scoreboard');
const scoreboardList = document.getElementById('scoreboard-list');
const bestComboValueEl = document.getElementById('best-combo-value');
const maxLinesValueEl = document.getElementById('max-lines-value');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const gameoverBox = document.getElementById('gameover-box');
const pauseBox = document.getElementById('pause-box');
const pauseViewMain = document.getElementById('pause-view-main');
const pauseViewControls = document.getElementById('pause-view-controls');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const showControlsBtn = document.getElementById('show-controls-btn');
const backBtn = document.getElementById('back-btn');
const startLevelSelect = document.getElementById('start-level-select');

const THEME_STORAGE_KEY = 'tetris-theme';
const SCORES_STORAGE_KEY = 'tetris-highscores';
const STATS_STORAGE_KEY = 'tetris-stats';
const MAX_SCORES = 5;
const START_LEVEL_STORAGE_KEY = 'tetris-start-level';

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let gridColor;
let currentSkin = 'retro';
let combo, bestCombo;
let startLevel = 1;

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
    combo++;
    if (combo > bestCombo) bestCombo = combo;
    updateHUD();
  } else {
    combo = 0;
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

function getPalette() {
  return SKIN_PALETTES[currentSkin] || COLORS;
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const clamp = v => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + Math.round(2.55 * percent));
  const g = clamp(((num >> 8) & 0xff) + Math.round(2.55 * percent));
  const b = clamp((num & 0xff) + Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

function roundedRectPath(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.arcTo(x + w, y, x + w, y + r, r);
  context.lineTo(x + w, y + h - r);
  context.arcTo(x + w, y + h, x + w - r, y + h, r);
  context.lineTo(x + r, y + h);
  context.arcTo(x, y + h, x, y + h - r, r);
  context.lineTo(x, y + r);
  context.arcTo(x, y, x + r, y, r);
  context.closePath();
}

function drawBlockRetro(context, px, py, size, color) {
  context.fillStyle = color;
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(px + 1, py + 1, size - 2, 4);
}

function drawBlockNeon(context, px, py, size, color) {
  context.save();
  context.shadowColor = color;
  context.shadowBlur = size * 0.5;
  context.fillStyle = color;
  context.fillRect(px + 3, py + 3, size - 6, size - 6);
  context.lineWidth = 1.5;
  context.strokeStyle = color;
  context.shadowBlur = size * 0.8;
  context.strokeRect(px + 1, py + 1, size - 2, size - 2);
  context.restore();
}

function drawBlockPastel(context, px, py, size, color) {
  const r = size * 0.22;
  roundedRectPath(context, px + 2, py + 2, size - 4, size - 4, r);
  context.fillStyle = color;
  context.fill();
  context.fillStyle = 'rgba(255,255,255,0.35)';
  roundedRectPath(context, px + 3, py + 3, size - 6, (size - 6) * 0.4, r * 0.6);
  context.fill();
}

function drawBlockPixel(context, px, py, size, color) {
  context.fillStyle = color;
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  const step = Math.max(3, Math.floor(size / 6));
  const light = shadeColor(color, 22);
  const dark = shadeColor(color, -22);
  context.save();
  context.beginPath();
  context.rect(px + 1, py + 1, size - 2, size - 2);
  context.clip();
  for (let yy = py + 1, ry = 0; yy < py + size - 1; yy += step, ry++) {
    for (let xx = px + 1, rx = 0; xx < px + size - 1; xx += step, rx++) {
      context.fillStyle = (rx + ry) % 2 === 0 ? light : dark;
      context.fillRect(xx, yy, step, step);
    }
  }
  context.restore();
  context.strokeStyle = 'rgba(0,0,0,0.3)';
  context.lineWidth = 1;
  context.strokeRect(px + 1, py + 1, size - 2, size - 2);
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = getPalette()[colorIndex];
  const px = x * size, py = y * size;
  context.globalAlpha = alpha ?? 1;
  switch (currentSkin) {
    case 'neon':
      drawBlockNeon(context, px, py, size, color);
      break;
    case 'pastel':
      drawBlockPastel(context, px, py, size, color);
      break;
    case 'pixel':
      drawBlockPixel(context, px, py, size, color);
      break;
    default:
      drawBlockRetro(context, px, py, size, color);
  }
  context.globalAlpha = 1;
}

function drawNutHole(context, x, y, size, alpha) {
  const color = getPalette()[NUT_TYPE];
  context.globalAlpha = alpha ?? 1;
  context.save();
  if (currentSkin === 'neon') {
    context.shadowColor = color;
    context.shadowBlur = size * 0.5;
  }
  context.strokeStyle = color;
  context.lineWidth = Math.max(2, size * 0.09);
  context.beginPath();
  context.arc(x * size + size / 2, y * size + size / 2, size * 0.34, 0, Math.PI * 2);
  context.stroke();
  context.restore();
  context.globalAlpha = 1;
}

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  themeToggle.checked = theme === 'light';
  gridColor = getComputedStyle(document.body).getPropertyValue('--grid-color').trim();
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applySkin(skin) {
  currentSkin = SKIN_PALETTES[skin] ? skin : 'retro';
  document.body.classList.remove('skin-retro', 'skin-neon', 'skin-pastel', 'skin-pixel');
  document.body.classList.add(`skin-${currentSkin}`);
  if (skinSelect) skinSelect.value = currentSkin;
  localStorage.setItem(SKIN_STORAGE_KEY, currentSkin);
  if (current) {
    draw();
    drawNext();
  }
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
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

function loadScores() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCORES_STORAGE_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveScores(list) {
  localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(list));
}

function loadStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY));
    return { bestCombo: raw?.bestCombo || 0, maxLines: raw?.maxLines || 0 };
  } catch {
    return { bestCombo: 0, maxLines: 0 };
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
}

function qualifiesForTop(list, points) {
  return list.length < MAX_SCORES || points > list[list.length - 1].score;
}

function renderScoreboard(target, list, highlightEntry) {
  target.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = 'Sin récords aún';
    target.appendChild(li);
    return;
  }
  list.forEach(entry => {
    const li = document.createElement('li');
    if (highlightEntry && entry === highlightEntry) li.classList.add('highlight');
    const name = document.createElement('span');
    name.className = 'rank-name';
    name.textContent = entry.name;
    const points = document.createElement('span');
    points.textContent = entry.score.toLocaleString();
    li.appendChild(name);
    li.appendChild(points);
    target.appendChild(li);
  });
}

function updateStatsDisplay() {
  const stats = loadStats();
  bestComboValueEl.textContent = stats.bestCombo;
  maxLinesValueEl.textContent = stats.maxLines;
}

function refreshRecordsPanel() {
  renderScoreboard(scoreboardList, loadScores());
  updateStatsDisplay();
}

function resetRecords() {
  saveScores([]);
  saveStats({ bestCombo: 0, maxLines: 0 });
  refreshRecordsPanel();
}

let pendingEntry = null;

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  pauseBox.classList.add('hidden');
  gameoverBox.classList.remove('hidden');
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlayStats.textContent = `Combo: ${bestCombo} · Líneas: ${lines}`;

  const stats = loadStats();
  stats.bestCombo = Math.max(stats.bestCombo, bestCombo);
  stats.maxLines = Math.max(stats.maxLines, lines);
  saveStats(stats);
  updateStatsDisplay();

  const list = loadScores();
  if (score > 0 && qualifiesForTop(list, score)) {
    pendingEntry = { name: 'Jugador', score, lines, combo: bestCombo };
    newRecordForm.classList.remove('hidden');
    playerNameInput.value = '';
    playerNameInput.focus();
    renderScoreboard(overlayScoreboard, list);
  } else {
    pendingEntry = null;
    newRecordForm.classList.add('hidden');
    renderScoreboard(overlayScoreboard, list);
  }

  overlay.classList.remove('hidden');
}

function submitScore() {
  if (!pendingEntry) return;
  const name = playerNameInput.value.trim() || 'Jugador';
  pendingEntry.name = name;
  const list = loadScores();
  list.push(pendingEntry);
  list.sort((a, b) => b.score - a.score);
  list.length = Math.min(list.length, MAX_SCORES);
  saveScores(list);
  renderScoreboard(overlayScoreboard, list, pendingEntry);
  refreshRecordsPanel();
  newRecordForm.classList.add('hidden');
  pendingEntry = null;
}

function showPauseMenu() {
  gameoverBox.classList.add('hidden');
  pauseBox.classList.remove('hidden');
  pauseViewControls.classList.add('hidden');
  pauseViewMain.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function hidePauseMenu() {
  pauseBox.classList.add('hidden');
  overlay.classList.add('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    hidePauseMenu();
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    showPauseMenu();
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
  level = startLevel;
  combo = 0;
  bestCombo = 0;
  paused = false;
  gameOver = false;
  dropInterval = Math.max(100, 1000 - (level - 1) * 90);
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  gameoverBox.classList.remove('hidden');
  pauseBox.classList.add('hidden');
  overlay.classList.add('hidden');
  newRecordForm.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
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

resumeBtn.addEventListener('click', togglePause);

pauseRestartBtn.addEventListener('click', () => {
  init();
});

showControlsBtn.addEventListener('click', () => {
  pauseViewMain.classList.add('hidden');
  pauseViewControls.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
  pauseViewControls.classList.add('hidden');
  pauseViewMain.classList.remove('hidden');
});

startLevelSelect.addEventListener('change', () => {
  startLevel = parseInt(startLevelSelect.value, 10);
  localStorage.setItem(START_LEVEL_STORAGE_KEY, String(startLevel));
});

themeToggle.addEventListener('change', () => {
  applyTheme(themeToggle.checked ? 'light' : 'dark');
});

skinSelect.addEventListener('change', () => {
  applySkin(skinSelect.value);
});

saveScoreBtn.addEventListener('click', submitScore);
playerNameInput.addEventListener('keydown', e => {
  if (e.code === 'Enter') submitScore();
});
resetRecordsBtn.addEventListener('click', () => {
  if (confirm('¿Borrar todos los récords?')) resetRecords();
});

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark');
applySkin(localStorage.getItem(SKIN_STORAGE_KEY) || 'retro');
refreshRecordsPanel();
startLevel = parseInt(localStorage.getItem(START_LEVEL_STORAGE_KEY), 10) || 1;
startLevelSelect.value = String(startLevel);
init();
