// ═══════════════════════════════════════════════════════════════════════════════
// DESKVENTURE: AI REMASTERED — пиксель-арт персонажей
// Каждый спрайт рисуется на canvas 32×32 и отдаётся как data-URL.
//   Система  — зелёная палитра (героиня)
//   Протокол — красная палитра (антагонист)
//   Страж    — восстановленный Протокол (бирюза + зелень)
// ═══════════════════════════════════════════════════════════════════════════════

const W = 32;
const H = 32;

export const SPRITE_COLORS = {
  green: { deep: '#06231a', dark: '#0d3a28', mid: '#1c7c52', light: '#37e08c', glow: '#9dffd4', eye: '#b6ffe8' },
  red: { deep: '#2a0307', dark: '#5c0a12', mid: '#b8162a', light: '#ff3049', glow: '#ff9aa6', eye: '#ffe1e5' },
  teal: { deep: '#03201f', dark: '#0a3f3d', mid: '#0f8f8a', light: '#2ee6d8', glow: '#a9fffa', eye: '#d6fffb' },
};

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g };
}

// ── примитивы (все координаты — целые пиксели) ───────────────────────────────
function px(g, x, y, color) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  g.fillStyle = color;
  g.fillRect(x | 0, y | 0, 1, 1);
}
function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x | 0, y | 0, w | 0, h | 0);
}
function ellipse(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / (ry * ry);
    if (t <= 0) continue;
    const half = Math.floor(rx * Math.sqrt(t));
    g.fillRect((cx - half) | 0, (cy + y) | 0, half * 2 + 1, 1);
  }
}
function ring(g, cx, cy, rx, ry, color) {
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    px(g, cx + Math.round(Math.cos(a) * rx), cy + Math.round(Math.sin(a) * ry), color);
  }
}
function dither(g, x, y, w, h, color, step = 2) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x + ((yy % step === 0) ? 0 : 1); xx < x + w; xx += step) px(g, xx, yy, color);
  }
}

function toURL(c) {
  return c.toDataURL('image/png');
}

// ═══════════════════════════════════════════════════════════════════════════════
// СИСТЕМА — героиня. Зелёная палитра: мягкий капюшон, светящееся лицо-экран,
// аккуратные глаза, застёжка-ромб на плаще.
// ═══════════════════════════════════════════════════════════════════════════════
function drawSystem({ blink = false, happy = false } = {}) {
  const P = SPRITE_COLORS.green;
  const { c, g } = makeCanvas();

  // свечение вокруг
  ring(g, 16, 15, 14, 13, 'rgba(55, 224, 140, 0.16)');
  ring(g, 16, 15, 12.5, 11.5, 'rgba(55, 224, 140, 0.08)');

  // капюшон (внешний контур тёмный, внутри светлее)
  ellipse(g, 16, 13, 11, 11, P.deep);
  ellipse(g, 16, 13, 10, 10, P.dark);
  ellipse(g, 16, 13, 9, 9, P.deep);
  // лицо-экран
  ellipse(g, 16, 14, 7, 7, P.dark);
  ellipse(g, 16, 14, 6, 6, P.mid);
  ellipse(g, 16, 14, 5, 5, P.light);
  // блики на капюшоне
  for (let i = 0; i < 6; i++) px(g, 8 + (i % 2), 8 + i, P.mid);
  for (let i = 0; i < 6; i++) px(g, 24 - (i % 2), 8 + i, P.mid);

  // глаза
  if (blink) {
    rect(g, 12, 14, 3, 1, P.deep);
    rect(g, 18, 14, 3, 1, P.deep);
  } else if (happy) {
    // «домики» — улыбающиеся глаза
    rect(g, 12, 14, 3, 1, P.deep);
    px(g, 12, 15, P.deep); px(g, 14, 15, P.deep);
    rect(g, 18, 14, 3, 1, P.deep);
    px(g, 18, 15, P.deep); px(g, 20, 15, P.deep);
  } else {
    rect(g, 12, 13, 3, 3, P.deep);
    rect(g, 18, 13, 3, 3, P.deep);
    px(g, 13, 13, P.eye); px(g, 19, 13, P.eye);
    px(g, 13, 14, P.eye); px(g, 19, 14, P.eye);
  }

  // румянец / улыбка
  px(g, 11, 16, P.mid); px(g, 21, 16, P.mid);
  if (happy) {
    rect(g, 14, 18, 5, 1, P.deep);
    px(g, 13, 17, P.deep); px(g, 19, 17, P.deep);
  } else {
    rect(g, 15, 18, 3, 1, P.deep);
    px(g, 14, 17, P.deep); px(g, 18, 17, P.deep);
  }

  // плечи и плащ
  rect(g, 7, 22, 18, 3, P.deep);
  ellipse(g, 16, 26, 10, 4, P.deep);
  ellipse(g, 16, 26, 9, 3, P.dark);
  rect(g, 9, 23, 14, 1, P.mid);
  // застёжка-ромб
  px(g, 16, 23, P.glow);
  px(g, 15, 24, P.light); px(g, 17, 24, P.light);
  px(g, 16, 24, P.glow);
  px(g, 16, 25, P.light);
  // «контуры данных» на плаще
  px(g, 11, 25, P.mid); px(g, 21, 25, P.mid);
  px(g, 10, 26, P.mid); px(g, 22, 26, P.mid);

  // воротник
  rect(g, 12, 21, 9, 1, P.mid);

  // искры
  px(g, 16, 1, P.glow);
  px(g, 6, 6, P.light);
  px(g, 26, 5, P.light);
  px(g, 4, 15, P.mid);
  px(g, 28, 16, P.mid);

  return toURL(c);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ПРОТОКОЛ — антагонист. Красная палитра: угловатый шлем, рога, злой визор,
// шипастые наплечники, глитч-полосы. Страж — тот же силуэт в бирюзе.
// ═══════════════════════════════════════════════════════════════════════════════
function drawProtocol({ glitch = 0, guardian = false } = {}) {
  const P = guardian ? SPRITE_COLORS.teal : SPRITE_COLORS.red;
  const { c, g } = makeCanvas();
  const ox = glitch;

  ring(g, 16, 15, 14, 13, guardian ? 'rgba(46, 230, 216, 0.16)' : 'rgba(255, 48, 73, 0.16)');

  // рога / антенны
  if (guardian) {
    rect(g, 5 + ox, 6, 1, 5, P.light);
    rect(g, 26 + ox, 6, 1, 5, P.light);
    rect(g, 4 + ox, 5, 2, 1, P.mid);
    rect(g, 26 + ox, 5, 2, 1, P.mid);
  } else {
    for (let i = 0; i < 5; i++) {
      rect(g, 6 + ox - i, 6 + i, 1, 2, P.mid);
      rect(g, 25 + ox + i, 6 + i, 1, 2, P.mid);
    }
    rect(g, 7 + ox, 8, 2, 2, P.mid);
    rect(g, 23 + ox, 8, 2, 2, P.mid);
    px(g, 3 + ox, 9, P.light);
    px(g, 28 + ox, 9, P.light);
  }

  // шлем
  rect(g, 9 + ox, 7, 14, 3, P.deep);
  rect(g, 7 + ox, 10, 18, 9, P.deep);
  rect(g, 8 + ox, 19, 16, 2, P.deep);
  rect(g, 9 + ox, 10, 14, 8, P.dark);
  rect(g, 10 + ox, 11, 12, 6, P.mid);
  // блик на шлеме
  rect(g, 10 + ox, 11, 4, 1, P.light);

  // визор
  rect(g, 9 + ox, 13, 14, 4, P.deep);
  rect(g, 10 + ox, 14, 12, 2, guardian ? '#05322f' : '#3a0106');
  if (guardian) {
    rect(g, 12 + ox, 14, 3, 2, P.light);
    rect(g, 18 + ox, 14, 3, 2, P.light);
    px(g, 13 + ox, 14, P.glow); px(g, 19 + ox, 14, P.glow);
  } else {
    // злые наклонённые глаза
    rect(g, 12 + ox, 14, 3, 2, P.light);
    rect(g, 18 + ox, 14, 3, 2, P.light);
    px(g, 11 + ox, 14, P.light); px(g, 21 + ox, 14, P.light);
    px(g, 14 + ox, 14, P.deep); px(g, 18 + ox, 14, P.deep);
  }

  // «рот»-решётка
  for (let x = 12; x <= 20; x += 2) px(g, x + ox, 18, P.mid);

  // наплечники
  rect(g, 4 + ox, 21, 8, 3, P.deep);
  rect(g, 20 + ox, 21, 8, 3, P.deep);
  rect(g, 5 + ox, 22, 6, 1, P.mid);
  rect(g, 21 + ox, 22, 6, 1, P.mid);
  if (!guardian) {
    px(g, 3 + ox, 20, P.light); px(g, 28 + ox, 20, P.light);
    px(g, 3 + ox, 19, P.mid); px(g, 28 + ox, 19, P.mid);
  }

  // шея и грудь (закрываем разрыв между наплечниками)
  rect(g, 13 + ox, 20, 6, 4, P.deep);
  rect(g, 14 + ox, 20, 4, 3, P.dark);

  // корпус
  rect(g, 10 + ox, 24, 12, 5, P.deep);
  rect(g, 11 + ox, 25, 10, 3, P.dark);
  rect(g, 15 + ox, 25, 2, 3, P.light);
  px(g, 16 + ox, 28, P.glow);

  // глитч-полосы
  if (!guardian) {
    rect(g, 2, 17, 28, 1, 'rgba(255, 48, 73, 0.10)');
    rect(g, 5, 9, 22, 1, 'rgba(255, 48, 73, 0.07)');
  } else {
    rect(g, 3, 29, 26, 1, 'rgba(46, 230, 216, 0.10)');
  }

  return toURL(c);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Эмблема (используется в галерее и как запасной логотип)
// ═══════════════════════════════════════════════════════════════════════════════
export function makeLogoSprite() {
  const { c, g } = makeCanvas();
  const T = SPRITE_COLORS.teal, G = SPRITE_COLORS.green, R = SPRITE_COLORS.red;

  ring(g, 16, 16, 15, 15, T.mid);
  for (let a = 0; a < Math.PI * 2; a += 0.7) {
    px(g, 16 + Math.round(Math.cos(a) * 15), 16 + Math.round(Math.sin(a) * 15), T.light);
  }
  rect(g, 6, 9, 20, 14, '#0a1418');
  rect(g, 7, 10, 18, 12, '#04191d');
  rect(g, 9, 12, 6, 6, G.dark);
  rect(g, 10, 13, 4, 4, G.light);
  rect(g, 11, 14, 1, 1, G.deep);
  rect(g, 12, 14, 1, 1, G.deep);
  rect(g, 17, 12, 6, 6, R.dark);
  rect(g, 18, 13, 4, 4, R.mid);
  rect(g, 19, 14, 1, 1, R.light);
  rect(g, 20, 14, 1, 1, R.light);
  for (let y = 11; y < 20; y++) px(g, 15 + (y % 2), y, T.light);
  rect(g, 13, 23, 6, 2, '#0f2b30');
  rect(g, 10, 25, 12, 2, '#0a1418');
  px(g, 3, 6, G.light);
  px(g, 29, 7, R.light);
  px(g, 4, 26, T.light);
  px(g, 28, 25, T.light);
  return toURL(c);
}

// ── наборы кадров ────────────────────────────────────────────────────────────
function frames(fn, variants) {
  return variants.map((v) => fn(v));
}

export const SYS_SPRITES = frames(drawSystem, [
  {},
  { blink: true },
  {},
  { happy: true },
]);

export const SYS_HAPPY = frames(drawSystem, [{ happy: true }, { happy: true, blink: true }]);

export const PROTO_SPRITES = frames(drawProtocol, [
  { glitch: 0 },
  { glitch: 1 },
  { glitch: -1 },
]);

export const GUARD_SPRITES = frames(drawProtocol, [
  { guardian: true },
  { guardian: true, glitch: 1 },
]);

export const LOGO_SPRITE = makeLogoSprite();
