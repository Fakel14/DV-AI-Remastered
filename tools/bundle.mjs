// Сборка игры в один классический скрипт (js/bundle.js).
// Нужно, чтобы index.html открывался двойным кликом (file://), где ES-модули
// браузер блокирует из-за CORS. Порядок: runtime → sprites → chapters → game.
import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const strip = (src) => src
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm, '')
  .replace(/^import\s+['"][^'"]+['"];?[ \t]*$/gm, '')
  .replace(/^export\s+(?=(const|let|var|class|function|async function)\b)/gm, '');

const parts = [
  ['runtime', read('js/runtime.js')],
  ['sprites', read('js/sprites.js')],
  ['chapters', read('js/chapters.js')],
  ['game', read('js/game.js')],
];

const body = parts.map(([name, src]) =>
  `\n// ═══════════════════════════════════════════════════════════════════════════\n` +
  `// ${name}.js\n` +
  `// ═══════════════════════════════════════════════════════════════════════════\n` +
  strip(src)
).join('\n');

const out = `/* DESKVENTURE: AI REMASTERED — собрано автоматически (node tools/bundle.mjs).
   Исходники: js/runtime.js, js/sprites.js, js/chapters.js, js/game.js
   Сценарий: chapters.txt (сгенерированный код: js/chapters.js через tools/transpile.py) */
(function () {
'use strict';
${body}
const RTClipboard = ClipboardWatcher;
})();
`;

fs.writeFileSync(path.join(root, 'js/bundle.js'), out);
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log(`js/bundle.js — ${kb} КБ`);
