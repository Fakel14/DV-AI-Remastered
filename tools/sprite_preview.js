// Превью пиксель-арта в консоли (без браузера): node tools/sprite_preview.js
const fs = require('fs');
const path = require('path');
const W = 32, H = 32;
let grid = Array.from({ length: H }, () => Array(W).fill(null));
let curColor = '#000';
global.document = {
  createElement() {
    return {
      width: W, height: H,
      getContext() {
        return {
          imageSmoothingEnabled: false,
          set fillStyle(v) { curColor = v; },
          get fillStyle() { return curColor; },
          fillRect(x, y, w, h) {
            for (let yy = Math.round(y); yy < Math.round(y + h); yy++) {
              for (let xx = Math.round(x); xx < Math.round(x + w); xx++) {
                if (xx >= 0 && yy >= 0 && xx < W && yy < H && grid[yy]) grid[yy][xx] = curColor;
              }
            }
          },
        };
      },
      toDataURL() { return 'DATA'; },
    };
  },
};
const src = fs.readFileSync(path.resolve(__dirname, '../js/sprites.js'), 'utf8')
  .replace(/^export\s+/gm, '')
  .replace(/^import[\s\S]*?;$/gm, '');
const api = new Function(src + '; return { drawSystem, drawProtocol, makeLogoSprite };')();

const map = {
  '#06231a': '#', '#0d3a28': '+', '#1c7c52': '*', '#37e08c': '@', '#9dffd4': '.', '#b6ffe8': "'",
  '#2a0307': '#', '#5c0a12': '+', '#b8162a': '*', '#ff3049': '@', '#ff9aa6': '.', '#ffe1e5': "'",
  '#03201f': '#', '#0a3f3d': '+', '#0f8f8a': '*', '#2ee6d8': '@', '#a9fffa': '.', '#d6fffb': "'",
  '#3a0106': 'X', '#04191d': 'o', '#0a1418': 'o', '#0f2b30': 'o', '#1d454b': 'o', '#100406': 'o',
};
function show(title, fn) {
  grid = Array.from({ length: H }, () => Array(W).fill(null));
  fn();
  console.log('\n=== ' + title + ' ===');
  for (let y = 0; y < H; y++) {
    let line = '';
    for (let x = 0; x < W; x++) {
      const c = grid[y][x];
      if (!c) line += '·';
      else if (String(c).startsWith('rgba')) line += ' ';
      else line += map[c] || '?';
    }
    console.log(line.replace(/·+$/, ''));
  }
}
show('СИСТЕМА', () => api.drawSystem({}));
show('ПРОТОКОЛ', () => api.drawProtocol({}));
show('СТРАЖ', () => api.drawProtocol({ guardian: true }));
