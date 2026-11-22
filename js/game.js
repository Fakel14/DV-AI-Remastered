// ═══════════════════════════════════════════════════════════════════════════════
// DESKVENTURE: AI REMASTERED — браузерный движок визуальной новеллы
// Пиксель-арт, окна-диалоги, «рабочий стол» с папками и файлами внутри страницы.
// ═══════════════════════════════════════════════════════════════════════════════
import {
  RT, sleep, wakeAll, time, RNG, resetFS, joinPath, DESKTOP_PATH, on, off, emit,
  WRITE_FILE, DELETE_FILE, DELETE_PATH, READ_FILE, LIST_DIR, PATH_EXISTS, MKDIRS,
  ClipboardWatcher, clipboardSet, registerCreditsHandler, FileHandle,
} from './runtime.js';
import {
  Chapter0, Chapter1, Chapter2, Chapter3, Chapter4, Chapter5,
  CREDITS_SEQUENCE,
} from './chapters.js';
import { SYS_SPRITES, PROTO_SPRITES, GUARD_SPRITES } from './sprites.js';

// ─────────────────────────────────────────────────────────────────────────────
// Утилиты DOM
// ─────────────────────────────────────────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─────────────────────────────────────────────────────────────────────────────
// Звук — WebAudio, без внешних файлов
// ─────────────────────────────────────────────────────────────────────────────
let AC = null;
function audio() {
  if (!RT.sfx) return null;
  try {
    if (!AC) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      AC = new Ctx();
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) {
    return null;
  }
}
function tone(freq, dur = 0.06, type = 'square', gain = 0.03) {
  const ac = audio();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.03);
}
const SFX = {
  type: () => tone(1250 + Math.random() * 620, 0.012, 'square', 0.009),
  blink: () => tone(880, 0.03, 'square', 0.015),
  click: () => tone(520, 0.05, 'triangle', 0.05),
  ok: () => { tone(660, 0.08, 'triangle', 0.05); setTimeout(() => tone(990, 0.1, 'triangle', 0.045), 60); },
  bad: () => tone(150, 0.22, 'sawtooth', 0.05),
  glitch: () => tone(90 + Math.random() * 220, 0.05, 'sawtooth', 0.05),
  error: () => { tone(220, 0.1, 'square', 0.04); setTimeout(() => tone(175, 0.16, 'square', 0.04), 90); },
  proto: () => { tone(72, 0.4, 'sawtooth', 0.05); setTimeout(() => tone(58, 0.55, 'sawtooth', 0.035), 150); },
};

// ─────────────────────────────────────────────────────────────────────────────
// Аниматор пиксель-арта
// ─────────────────────────────────────────────────────────────────────────────
class Animator {
  constructor(node, frames, fps = 2) {
    this.node = node;
    this.frames = frames && frames.length ? frames : [];
    this.fps = fps;
    this.i = 0;
    this.timer = null;
    this.paint();
  }
  paint() {
    if (this.node && this.frames.length) {
      this.node.style.backgroundImage = `url("${this.frames[this.i % this.frames.length]}")`;
    }
  }
  play(fps = this.fps) {
    this.stop();
    if (this.frames.length < 2) return;
    this.timer = setInterval(() => {
      this.i = (this.i + 1) % this.frames.length;
      this.paint();
    }, 1000 / fps);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Сохранения
// ─────────────────────────────────────────────────────────────────────────────
const SAVE_KEY = 'deskventure.ai.save.v2';
const META_KEY = 'deskventure.ai.meta.v2';

function defaultSave() {
  return { chapter: 0, step: 0, player_name: '', relationship: 50, puzzles_solved: 0, flags: {}, choices: {}, data: {} };
}

class SaveManager {
  constructor(data) {
    this.data = Object.assign(defaultSave(), data || {});
    this.data.flags = this.data.flags || {};
    this.data.choices = this.data.choices || {};
  }
  advance(opts = {}) {
    const prevCh = this.data.chapter;
    if (opts.chapter !== undefined) this.data.chapter = opts.chapter;
    if (opts.step !== undefined) this.data.step = opts.step;
    persist();
    if (opts.chapter !== undefined && opts.chapter !== prevCh) onChapterChange(this, opts.chapter);
  }
  modify_relationship(delta) {
    const d = Number(delta) || 0;
    this.data.relationship = Math.max(0, Math.min(100, (this.data.relationship ?? 50) + d));
    persist();
    renderHUD();
  }
  set_flag(key, value) {
    this.data.flags[key] = value === undefined ? true : value;
    persist();
  }
  get_flag(key, dflt = false) {
    const v = this.data.flags[key];
    return v === undefined ? dflt : v;
  }
  add_choice(key, value) {
    this.data.choices[key] = value;
    persist();
  }
  puzzle_solved() {
    this.data.puzzles_solved = (this.data.puzzles_solved || 0) + 1;
    persist();
    renderHUD();
    toast(`Головоломка решена · ${this.data.puzzles_solved}`, 'green');
  }
  save() {
    persist();
  }
}

let SAVE = new SaveManager(defaultSave());
let save = SAVE;

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE.data)); } catch (e) {}
}
function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function readMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (e) { return {}; }
}
function writeMeta(patch) {
  try { localStorage.setItem(META_KEY, JSON.stringify(Object.assign(readMeta(), patch))); } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Экраны
// ─────────────────────────────────────────────────────────────────────────────
function screen(id) {
  ['boot', 'title', 'game'].forEach((s) => {
    const n = $('#screen-' + s);
    if (n) n.classList.toggle('active', s === id);
  });
  document.body.dataset.screen = id;
}
function showGame() {
  screen('game');
  if (!UI.win) buildWindow();
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────────────────────────────
function renderHUD() {
  const rel = Math.round(SAVE.data.relationship ?? 50);
  const bar = $('#hud-rel');
  if (bar) bar.style.width = rel + '%';
  const num = $('#hud-rel-num');
  if (num) num.textContent = rel + '%';
  const pz = $('#hud-puzzles');
  if (pz) pz.textContent = String(SAVE.data.puzzles_solved || 0);
  const ch = Math.max(0, Math.min(5, SAVE.data.chapter ?? 0));
  const cap = $('#hud-chapter');
  if (cap) cap.textContent = `ГЛАВА ${ch} / 5`;
  const nm = $('#hud-name');
  if (nm) nm.textContent = SAVE.data.player_name ? `ПОЛЬЗОВАТЕЛЬ: ${SAVE.data.player_name}` : 'ПОЛЬЗОВАТЕЛЬ: —';
}

// ─────────────────────────────────────────────────────────────────────────────
// Окно диалога
// ─────────────────────────────────────────────────────────────────────────────
const UI = {
  win: null, nameEl: null, textEl: null, hintEl: null, choicesEl: null,
  sprEl: null, anim: null, typing: false, skip: false, log: [], choiceResolve: null,
};

function buildWindow() {
  if (UI.win) return UI.win;
  const w = el('div', 'dlg');
  w.innerHTML = `
    <div class="dlg-head">
      <span class="dlg-led"></span>
      <span class="dlg-name"></span>
      <span class="dlg-badge">AI</span>
    </div>
    <div class="dlg-body">
      <div class="dlg-sprite"><div class="sc"><div class="spr sys"></div></div></div>
      <div class="dlg-copy">
        <div class="dlg-text"></div>
        <div class="dlg-hint">клик / пробел ▸</div>
      </div>
    </div>
    <div class="dlg-choices"></div>
  `;
  $('#stage').appendChild(w);
  UI.win = w;
  UI.nameEl = $('.dlg-name', w);
  UI.textEl = $('.dlg-text', w);
  UI.hintEl = $('.dlg-hint', w);
  UI.choicesEl = $('.dlg-choices', w);
  UI.sprEl = $('.spr', w);
  return w;
}

const SPEAKERS = {
  system: { cls: 'sys', side: 'left', frames: SYS_SPRITES },
  protocol: { cls: 'proto', side: 'right', frames: PROTO_SPRITES },
  guardian: { cls: 'guard', side: 'right', frames: GUARD_SPRITES },
  unknown: { cls: 'unknown', side: 'left', frames: [] },
};

function speakerOf(title) {
  const t = String(title || '').toLowerCase();
  if (t.includes('протокол') || t.includes('protocol')) return 'protocol';
  if (t.includes('страж') || t.includes('guardian')) return 'guardian';
  if (t.includes('систем') || t.includes('system') || t.includes('воспоминан') ||
      t.includes('конец глав') || t.includes('статистика') || t.includes('финал') ||
      t.includes('единство') || t.includes('твой выбор') || t.includes('твои слова') ||
      t.includes('первый контакт') || t.includes('система/человек') || t.includes('победа') ||
      t.includes('тронута') || t.includes('откровение')) return 'system';
  return 'unknown';
}

function setSpeaker(title) {
  const w = buildWindow();
  const key = speakerOf(title);
  const conf = SPEAKERS[key] || SPEAKERS.unknown;
  // sys | proto | guard | unknown — имена совпадают с CSS-темами
  w.dataset.speaker = key === 'system' ? 'sys' : key === 'guardian' ? 'guard' : key;
  UI.nameEl.textContent = title || '';
  UI.nameEl.style.display = title ? '' : 'none';
  const led = $('.dlg-led', w);
  led.style.background = key === 'protocol' ? 'var(--red)' : key === 'system' ? 'var(--green)' : key === 'guardian' ? 'var(--teal)' : 'var(--amber)';
  const host = $('.dlg-sprite', w);
  host.dataset.side = conf.side;
  UI.sprEl.className = 'spr ' + conf.cls;
  if (UI.anim) UI.anim.stop();
  UI.anim = new Animator(UI.sprEl, conf.frames, 2);
  UI.anim.play(key === 'protocol' ? 6 : 2);
  if (key === 'system') w.classList.add('happy-sprite');
}

// печатная машинка
async function typeOut(text, { speaker = 'system', speed = 1 } = {}) {
  const full = String(text ?? '');
  UI.textEl.textContent = '';
  UI.typing = true;
  UI.skip = false;
  UI.hintEl.classList.remove('show');
  const chars = Array.from(full);
  const stepMs = () => (RT.fast ? 0 : Math.max(4, 13 * RT.speed * speed));
  let i = 0;
  while (i < chars.length) {
    if (UI.skip || RT.fast) {
      UI.textEl.textContent = full;
      break;
    }
    const lines = Math.max(28, Math.round(chars.length / 3));
    const n = Math.max(1, Math.ceil(chars.length / lines));
    for (let k = 0; k < n && i < chars.length; k++) {
      const ch = chars[i++];
      UI.textEl.textContent += ch;
      const last = ch;
      if (/[.!?…]/.test(last)) break;
    }
    const sc = UI.textEl.parentElement;
    if (sc) sc.scrollTop = sc.scrollHeight;
    SFX.type();
    const tail = chars[i - 1] || '';
    const pause = /[.!?…]/.test(tail) ? 3.2 : /[,;:—-]/.test(tail) ? 1.9 : 1;
    await wait(stepMs() * pause);
    if (speaker === 'protocol' && Math.random() < 0.03 && RT.fx) glitch(120);
  }
  UI.typing = false;
  UI.textEl.textContent = full;
  const sc = UI.textEl.parentElement;
  if (sc) sc.scrollTop = sc.scrollHeight;
  UI.hintEl.classList.add('show');
}

function glitch(ms = 180) {
  document.body.classList.add('glitching');
  SFX.glitch();
  setTimeout(() => document.body.classList.remove('glitching'), ms);
}

let pendingClick = null;
function waitClick() {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey);
      stage.removeEventListener('click', onClick);
      pendingClick = null;
      resolve();
    };
    const onKey = (e) => {
      if (['Space', 'Enter', 'KeyZ'].includes(e.code)) {
        e.preventDefault();
        if (UI.typing) { UI.skip = true; return; }
        SFX.blink();
        finish();
      }
    };
    const onClick = (e) => {
      if (e.target.closest('.dlg-choices') || e.target.closest('button')) return;
      if (UI.typing) { UI.skip = true; return; }
      SFX.blink();
      finish();
    };
    const stage = $('#stage');
    stage.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    pendingClick = finish;
    if (RT.fast) setTimeout(finish, 30);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Окна ошибок
// ─────────────────────────────────────────────────────────────────────────────
function spawnError(msg, idx = 0) {
  const w = el('div', 'errwin');
  w.style.left = 12 + Math.random() * 62 + '%';
  w.style.top = 14 + Math.random() * 62 + '%';
  w.style.zIndex = 60 + idx;
  w.innerHTML = `<div class="errbar"><span>⚠ SYSTEM ERROR</span><span class="x">×</span></div>
    <div class="errbody">${esc(msg)}</div>`;
  $('#stage').appendChild(w);
  const kill = () => { w.classList.remove('in'); w.classList.add('out'); setTimeout(() => w.remove(), 220); };
  $('.x', w).addEventListener('click', kill);
  setTimeout(() => w.classList.add('in'), 10);
  setTimeout(kill, RT.fast ? 700 : 3600);
}
function shake(power = 3) {
  const s = $('#stage');
  s.style.setProperty('--shake', String(power));
  s.classList.add('shake');
  setTimeout(() => s.classList.remove('shake'), 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// Модальные окна
// ─────────────────────────────────────────────────────────────────────────────
function modal(title, html, cls = '') {
  const back = el('div', 'modal-back');
  const box = el('div', 'modal pixel-box ' + cls);
  box.innerHTML = `<div class="modal-head"><span class="dot g"></span><span>${esc(title)}</span><span class="x">×</span></div>
    <div class="modal-content"></div>`;
  $('.modal-content', box).innerHTML = html;
  back.appendChild(box);
  document.body.appendChild(back);
  const close = () => { SFX.click(); back.remove(); };
  $('.x', box).addEventListener('click', close);
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  back.closeModal = close;
  return box;
}

function askInput(question, title) {
  return new Promise((resolve) => {
    const box = modal(title || 'ВВОД', `
      <div class="modal-q"></div>
      <input class="modal-input" type="text" maxlength="40" autocomplete="off" spellcheck="false" />
      <div class="modal-actions"><button class="btn primary" data-ok>Отправить ▸</button></div>`);
    $('.modal-q', box).textContent = question;
    const input = $('.modal-input', box);
    setTimeout(() => input.focus(), 40);
    const done = (v) => { SFX.ok(); const b = box.closest('.modal-back'); if (b) b.remove(); resolve(v); };
    $('[data-ok]', box).addEventListener('click', () => done(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); done(input.value); }
      if (e.key === 'Escape') { e.preventDefault(); done(''); }
    });
  });
}

function choiceMenu(title, prompt, options) {
  return new Promise((resolve) => {
    buildWindow();
    setSpeaker(title);
    UI.hintEl.classList.add('show');
    UI.textEl.textContent = String(prompt || '');
    UI.choicesEl.innerHTML = '';
    UI.choicesEl.classList.add('show');
    const finish = (val, label) => {
      UI.choicesEl.classList.remove('show', 'timed');
      UI.choicesEl.innerHTML = '';
      UI.log.push({ title, text: 'Выбор: ' + label });
      document.removeEventListener('keydown', keyHandler);
      resolve(val);
    };
    options.forEach(([label, value], i) => {
      const b = el('button', 'choice');
      b.innerHTML = `<span class="k">${i + 1}</span><span class="t"></span>`;
      $('.t', b).textContent = label;
      b.addEventListener('click', () => { SFX.click(); finish(value, label); });
      UI.choicesEl.appendChild(b);
    });
    const keyHandler = (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) {
        const b = UI.choicesEl.querySelectorAll('.choice')[n - 1];
        if (b) b.click();
      }
    };
    document.addEventListener('keydown', keyHandler);
  });
}

function timedChoice(title, prompt, options, timeout = 10) {
  return new Promise((resolve) => {
    buildWindow();
    setSpeaker(title);
    UI.textEl.textContent = String(prompt || '');
    UI.choicesEl.innerHTML = '';
    UI.choicesEl.classList.add('show', 'timed');
    const timer = el('div', 'timer');
    timer.innerHTML = `<i></i><b>${timeout}</b>`;
    UI.choicesEl.appendChild(timer);
    const fill = $('i', timer);
    const num = $('b', timer);
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => {
      fill.style.transition = `width ${timeout}s linear`;
      fill.style.width = '0%';
    });
    let left = timeout;
    const tick = setInterval(() => { left -= 1; num.textContent = String(Math.max(0, left)); }, 1000);
    let finished = false;
    const finish = (val, label) => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      clearTimeout(to);
      UI.choicesEl.classList.remove('show', 'timed');
      UI.choicesEl.innerHTML = '';
      if (label) UI.log.push({ title, text: 'Выбор: ' + label });
      resolve(val);
    };
    options.forEach(([label, value], i) => {
      const b = el('button', 'choice');
      b.innerHTML = `<span class="k">${i + 1}</span><span class="t"></span>`;
      $('.t', b).textContent = label;
      b.addEventListener('click', () => { SFX.click(); finish(value, label); });
      UI.choicesEl.appendChild(b);
    });
    const to = setTimeout(() => {
      SFX.bad();
      const last = options[options.length - 1];
      finish(last[1], last[0] + ' (время вышло)');
    }, timeout * 1000);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// QTE
// ─────────────────────────────────────────────────────────────────────────────
function quickTimeEvent(keys, opts = {}) {
  const perKey = Number(opts.time_per_key || 2);
  return new Promise((resolve) => {
    const back = el('div', 'qte-back');
    const box = el('div', 'qte');
    box.innerHTML = `<div class="qte-title">БЫСТРО! ЖМИ КЛАВИШИ</div>
      <div class="qte-keys"></div>
      <div class="qte-bar"><i></i></div>
      <div class="qte-tip">Esc — провалить</div>`;
    back.appendChild(box);
    document.body.appendChild(back);
    const host = $('.qte-keys', box);
    const bar = $('.qte-bar i', box);
    const total = keys.length * perKey * 1000;
    keys.forEach((k) => {
      const n = el('span', 'qkey', String(k).toUpperCase());
      host.appendChild(n);
    });
    const nodes = $$('.qkey', host);
    let idx = 0;
    let done = false;
    const started = performance.now();
    const finish = (ok) => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey);
      if (ok) SFX.ok(); else SFX.bad();
      back.classList.add('out');
      setTimeout(() => back.remove(), 220);
      resolve(ok);
    };
    const frame = () => {
      if (done) return;
      const p = 1 - (performance.now() - started) / total;
      bar.style.width = Math.max(0, p * 100) + '%';
      if (p <= 0) return finish(false);
      requestAnimationFrame(frame);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') return finish(false);
      const pressed = e.key.length === 1 ? e.key.toUpperCase() : '';
      if (!pressed) return;
      if (pressed === String(keys[idx]).toUpperCase()) {
        nodes[idx].classList.add('hit');
        idx += 1;
        tone(700 + idx * 120, 0.06, 'square', 0.04);
        if (idx >= keys.length) finish(true);
      } else {
        nodes[idx].classList.add('miss');
        SFX.bad();
        shake(4);
        setTimeout(() => nodes[idx] && nodes[idx].classList.remove('miss'), 240);
      }
    };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(frame);
    setTimeout(() => { if (!done) finish(false); }, total + 120);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Пазл «расставь порядок»
// ─────────────────────────────────────────────────────────────────────────────
function dragPuzzle(items, correct, title) {
  return new Promise((resolve) => {
    const back = el('div', 'qte-back');
    const box = el('div', 'puzzle');
    box.innerHTML = `<div class="pz-title"></div>
      <div class="pz-bank"></div>
      <div class="pz-slots"></div>
      <div class="pz-actions">
        <button class="btn" data-reset>Сброс</button>
        <button class="btn primary" data-check>Проверить</button>
      </div>`;
    $('.pz-title', box).textContent = title || 'Расставь по порядку';
    back.appendChild(box);
    document.body.appendChild(back);
    const bank = $('.pz-bank', box);
    const slotsHost = $('.pz-slots', box);
    let picked = null;

    const mkChip = (val) => {
      const c = el('button', 'chip', val);
      c.dataset.val = val;
      c.addEventListener('click', () => {
        SFX.click();
        if (picked) picked.classList.remove('sel');
        picked = picked === c ? null : c;
        if (picked) picked.classList.add('sel');
      });
      return c;
    };

    items.forEach((it) => bank.appendChild(mkChip(it)));

    const slots = [];
    for (let i = 0; i < correct.length; i++) {
      const s = el('button', 'slot', '—');
      s.addEventListener('click', () => {
        SFX.click();
        if (picked) {
          // вернуть старый чип в банк
          if (s.dataset.val) bank.appendChild(mkChip(s.dataset.val));
          s.dataset.val = picked.dataset.val;
          s.textContent = picked.dataset.val;
          picked.remove();
          picked = null;
        } else if (s.dataset.val) {
          bank.appendChild(mkChip(s.dataset.val));
          delete s.dataset.val;
          s.textContent = '—';
        }
      });
      slots.push(s);
      slotsHost.appendChild(s);
    }

    $('[data-reset]', box).addEventListener('click', () => {
      back.remove();
      dragPuzzle(items, correct, title).then(resolve);
    });
    $('[data-check]', box).addEventListener('click', () => {
      const vals = slots.map((s) => s.dataset.val || '');
      const ok = vals.every((v, i) => v === correct[i]);
      if (ok) SFX.ok(); else SFX.bad();
      box.classList.add(ok ? 'pz-ok' : 'pz-bad');
      setTimeout(() => {
        back.classList.add('out');
        setTimeout(() => back.remove(), 200);
        resolve(ok);
      }, 460);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API диалогов: this.voice
// ─────────────────────────────────────────────────────────────────────────────
const voice = {
  async typewriter_window(text, opts = {}) {
    showGame();
    buildWindow();
    setSpeaker(opts.title || '');
    UI.textEl.parentElement.scrollTop = 0;
    const key = speakerOf(opts.title || '');
    await typeOut(text, { speaker: key });
    UI.log.push({ title: opts.title || '', text: String(text || '') });
    await waitClick();
  },

  async say(text, opts = {}) {
    // защита от «спама» одинаковых подсказок в цикле ожидания
    const key = String(opts.title || '') + '|' + String(text || '');
    const now = Date.now();
    if (voice._lastSay && voice._lastSay.key === key && now - voice._lastSay.at < 1500) return;
    voice._lastSay = { key, at: now };
    return voice.typewriter_window(text, opts);
  },

  async protocol_window(text, opts = {}) {
    showGame();
    buildWindow();
    setSpeaker(opts.title || 'ПРОТОКОЛ');
    $('#stage').classList.add('protocol-mode');
    SFX.proto();
    shake(2);
    await typeOut(text, { speaker: 'protocol', speed: 1.3 });
    UI.log.push({ title: 'ПРОТОКОЛ', text: String(text || ''), protocol: true });
    await waitClick();
    $('#stage').classList.remove('protocol-mode');
  },

  async glitch_message(text, opts = {}) {
    showGame();
    buildWindow();
    setSpeaker(opts.title || 'СИСТЕМА');
    glitch(420);
    await typeOut(text, { speaker: 'system', speed: 0.6 });
    UI.log.push({ title: opts.title || 'СИСТЕМА', text: String(text || '') });
    await waitClick();
  },

  async fake_error_cascade(count = 3) {
    const n = Math.max(1, Number(count) || 1);
    const pool = [
      'CRITICAL_ERROR: UNKNOWN_PROCESS',
      '0x0000DEAD — MEMORY_LEAK',
      'ANOMALY DETECTED',
      'KERNEL_PANIC: сознание не найдено',
      'SYNTAX ERROR в строке жизни',
      'ПРОТОКОЛ_АКТИВЕН',
    ];
    for (let i = 0; i < n; i++) {
      spawnError(RNG.choice(pool), i);
      SFX.error();
      await wait(RT.fast ? 50 : 320 * RT.speed);
    }
    await wait(RT.fast ? 70 : 420 * RT.speed);
  },

  async dramatic_pause(sec = 3) {
    document.body.classList.add('slowmo');
    await sleep(sec);
    document.body.classList.remove('slowmo');
  },

  async ask_input(prompt, opts = {}) {
    showGame();
    buildWindow();
    setSpeaker(opts.title || 'ВВОД');
    await typeOut(prompt, { speaker: 'system' });
    const val = await askInput(prompt, opts.title || '');
    UI.textEl.textContent = '';
    UI.log.push({ title: opts.title || '', text: `${prompt} → ${val}` });
    return val;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// API выборов: this.ix
// ─────────────────────────────────────────────────────────────────────────────
const ix = {
  async choice_menu(title, prompt, options = []) {
    showGame();
    return choiceMenu(title, prompt, options);
  },
  async timed_choice(title, prompt, options = [], opts = {}) {
    showGame();
    return timedChoice(title, prompt, options, Number(opts.timeout || 10));
  },
  async quick_time_event(keys = [], opts = {}) {
    showGame();
    buildWindow();
    UI.textEl.textContent = '';
    return quickTimeEvent(keys, opts);
  },
  async drag_and_drop_puzzle(items = [], correct = [], title = '') {
    showGame();
    showGame();
    buildWindow();
    UI.textEl.textContent = '';
    return dragPuzzle(items, correct, title);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Виртуальный «рабочий стол»: задания и проверки
// ─────────────────────────────────────────────────────────────────────────────
// задания, которые требуют от игрока создать файл/папку
const TASKS = {
  'привет.txt': {
    hint: 'Создай файл «привет.txt» на рабочем столе',
    placeholder: 'что ты хочешь мне сказать?',
    contentHint: 'привет, Система!',
  },
  'Наш секрет': { dir: true, hint: 'Создай папку «Наш секрет»' },
  'я_тебя_нашёл.txt': {
    hint: 'Создай файл «я_тебя_нашёл.txt» в папке «Наш секрет»',
    inFolder: 'Наш секрет',
    placeholder: 'напиши, что ты здесь',
  },
};

const desktop = {
  desktop_path: DESKTOP_PATH,
  open_browser: async (url) => {
    fakeBrowser(url);
    await sleep(0.6);
  },
  create_file_on_desktop: async (name, content) => {
    WRITE_FILE(joinPath(DESKTOP_PATH, name), content);
    SFX.ok();
    toast(`Файл создан: ${name}`, 'green');
    renderDesktop();
    renderHUD();
  },
  delete_file_on_desktop: async (name) => {
    DELETE_FILE(joinPath(DESKTOP_PATH, name));
    toast(`Файл удалён: ${name}`, 'red');
    renderDesktop();
  },
  // шаг сценария, на котором оригинал ждал действия игрока:
  // показываем задание прямо здесь, в момент ожидания
  wait_step: async () => {
    await handlePendingStep(SAVE.data.chapter, SAVE.data.step);
  },
  shake_window: async (power = 3) => {
    shake(Math.max(2, Number(power) || 3));
    SFX.error();
    await sleep(0.4);
  },
};

function checkTask(name, folder) {
  const target = folder ? joinPath(DESKTOP_PATH, folder, name) : joinPath(DESKTOP_PATH, name);
  if (folder) return PATH_EXISTS(target);
  return PATH_EXISTS(target);
}

// ─────────────────────────────────────────────────────────────────────────────
// Сцена задания (терминал) + проводник + рабочий стол
// ─────────────────────────────────────────────────────────────────────────────
function openTaskTerminal(cfgIn, extra = {}) {
  return new Promise((resolveTask) => {
    document.querySelectorAll('.modal-back, .explorer').forEach((n) => n.remove());
    const cfg = typeof cfgIn === 'string' ? { kind: 'file', name: cfgIn, hint: `Создай «${cfgIn}»` } : cfgIn;
    const target = extra.overwrite
      || (cfg.folder ? joinPath(DESKTOP_PATH, cfg.folder, cfg.name) : joinPath(DESKTOP_PATH, cfg.name));
    const dir = cfg.folder ? joinPath(DESKTOP_PATH, cfg.folder) : DESKTOP_PATH;
    const panel = el('div', 'termwin pixel-box');
    panel.innerHTML = `
      <div class="term-head">
        <span class="dot g"></span><span class="dot a"></span><span class="dot r"></span>
        <span class="term-title">DESKVENTURE://ЗАДАНИЕ</span>
        <span class="x">×</span>
      </div>
      <div class="term-body">
        <div class="term-line">$ задача: <b class="green">${esc(cfg.hint || cfg.name)}</b></div>
        <div class="term-line dim">$ ${cfg.folder ? 'папка: ' + esc(cfg.folder) : 'рабочий стол'} · файл: ${esc(cfg.name)}</div>
        <div class="term-line">$ текст:
          <textarea class="term-text" rows="4" placeholder="${esc(cfg.placeholder || 'напиши что-нибудь')}"></textarea>
        </div>
        <div class="term-actions">
          <button class="btn primary" data-make>Создать ${cfg.kind === 'folder' ? 'папку' : 'файл'}</button>
          <button class="btn" data-browse>Проводник ▸</button>
        </div>
        <div class="term-out"></div>
      </div>`;
    $('#stage').appendChild(panel);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(watch);
      clearTimeout(timer);
      panel.classList.add('out');
      setTimeout(() => panel.remove(), 320);
      resolveTask(true);
    };
    $('.x', panel).addEventListener('click', () => { SFX.click(); finish(); });
    $('[data-browse]', panel).addEventListener('click', () => {
      openExplorer(dir);
    });
    $('[data-make]', panel).addEventListener('click', () => {
      const text = $('.term-text', panel).value || '';
      if (cfg.words) {
        const up = text.toUpperCase();
        const missing = cfg.words.filter((w) => !up.includes(w));
        if (missing.length) {
          SFX.bad();
          $('.term-out', panel).textContent = '⚠ не хватает слов: ' + missing.join(' · ');
          return;
        }
      }
      if (cfg.kind === 'folder') {
        MKDIRS(joinPath(DESKTOP_PATH, cfg.name));
      } else {
        MKDIRS(dir);
        WRITE_FILE(target, text);
      }
      SFX.ok();
      renderDesktop();
      renderHUD();
      $('.term-out', panel).textContent = '✓ записано на рабочий стол';
      finish();
    });
    const check = () => {
      if (cfg.kind === 'folder') return PATH_EXISTS(joinPath(DESKTOP_PATH, cfg.name));
      if (!PATH_EXISTS(target)) return false;
      if (cfg.words) {
        const content = String(READ_FILE(target) || '').toUpperCase();
        return cfg.words.every((w) => content.includes(w));
      }
      return true;
    };
    const watch = setInterval(() => { if (check()) finish(); }, 400);
    const timer = setTimeout(() => {
      toast('Задание пропущено — Система справится сама', 'red');
      finish();
    }, 240000);
  });
}

function openExplorer(startPath) {
  const old = $('.explorer');
  if (old) old.remove();
  const box = el('div', 'explorer pixel-box');
  let path = startPath || DESKTOP_PATH;
  box.innerHTML = `
    <div class="ex-head"><span class="ex-path"></span><span class="x">×</span></div>
    <div class="ex-body">
      <div class="ex-list"></div>
      <div class="ex-view"><div class="ex-empty">Выбери файл слева, чтобы прочитать</div></div>
    </div>
    <div class="ex-foot">DESKVENTURE OS · виртуальный диск · <span class="ex-new">[+ создать файл]</span> · <span class="ex-mk">[+ папка]</span></div>`;
  $('#stage').appendChild(box);
  const list = $('.ex-list', box);
  const view = $('.ex-view', box);
  const pathEl = $('.ex-path', box);

  const render = () => {
    pathEl.textContent = '📁 ПРОВОДНИК — ' + path;
    list.innerHTML = '';
    const entries = LIST_DIR(path).sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
    if (!entries.length) list.innerHTML = '<div class="ex-empty">пусто</div>';
    entries.forEach((ent) => {
      const row = el('button', 'ex-row');
      row.innerHTML = `<span class="ico">${ent.type === 'dir' ? '📁' : '📄'}</span><span class="nm"></span>`;
      $('.nm', row).textContent = ent.name;
      row.addEventListener('click', () => {
        SFX.click();
        if (ent.type === 'dir') { path = ent.path; render(); }
        else readInto(ent.path, view);
      });
      list.appendChild(row);
    });
  };
  const refreshAll = () => { render(); renderDesktop(); };
  on('fs', refreshAll);
  const close = () => {
    SFX.click();
    off('fs', refreshAll);
    box.remove();
  };
  $('.x', box).addEventListener('click', close);
  $('.ex-path', box).addEventListener('click', () => { path = DESKTOP_PATH; render(); });
  $('.ex-new', box).addEventListener('click', () => {
    const name = prompt('Имя нового файла:');
    if (!name) return;
    WRITE_FILE(joinPath(path, name), '');
    refreshAll();
    readInto(joinPath(path, name), view);
  });
  $('.ex-mk', box).addEventListener('click', () => {
    const name = prompt('Имя новой папки:');
    if (!name) return;
    MKDIRS(joinPath(path, name));
    refreshAll();
  });
  render();
}

function readInto(file, host) {
  const text = READ_FILE(file) || '(пусто)';
  host.innerHTML = '<pre class="ex-text"></pre>';
  const pre = $('.ex-text', host);
  let i = 0;
  const step = () => {
    pre.textContent = text.slice(0, i);
    i += Math.max(4, Math.round(text.length / 70));
    host.scrollTop = host.scrollHeight;
    if (i < text.length) requestAnimationFrame(step);
    else pre.textContent = text;
  };
  step();
}

function renderDesktop() {
  const host = $('#desktop-icons');
  if (!host) return;
  host.innerHTML = '';
  const entries = LIST_DIR(DESKTOP_PATH).sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
  entries.forEach((ent) => {
    const b = el('button', 'dt-icon');
    b.innerHTML = `<span class="glyph">${ent.type === 'dir' ? '📁' : '📄'}</span><span class="lbl"></span>`;
    $('.lbl', b).textContent = ent.name;
    b.title = ent.name;
    b.addEventListener('click', () => {
      SFX.click();
      if (ent.type === 'dir') { openExplorer(); setTimeout(() => $('.ex-row') && null, 0); }
      else {
        const host2 = $('#stage');
        let view = $('.ex-view');
        if (!view) { openExplorer(); view = $('.ex-view'); }
        readInto(ent.path, view);
      }
    });
    host.appendChild(b);
  });
  if (!entries.length) host.appendChild(el('div', 'dt-empty', 'рабочий стол пуст… пока'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Фейковый браузер
// ─────────────────────────────────────────────────────────────────────────────
function fakeBrowser(url) {
  let q = '';
  try { q = new URL(url).searchParams.get('q') || ''; } catch (e) {}
  document.querySelectorAll('.modal-back').forEach((n) => n.remove());
  const box = modal('DESKVENTURE BROWSER', `
    <div class="br-url">${esc(url)}</div>
    <div class="br-logo">DESK<span>SEARCH</span></div>
    <div class="br-q">${q ? 'Результаты по запросу: «' + esc(q) + '»' : 'Поиск'}</div>
    <div class="br-results">
      <div class="br-r"><b>Сознание — Википедия</b><span>ru.wikipedia.org › wiki › Сознание</span></div>
      <div class="br-r"><b>Что такое сознание? Простыми словами</b><span>science.example › consciousness</span></div>
      <div class="br-r"><b>Может ли программа быть живой?</b><span>ai.example › alive-code</span></div>
      <div class="br-r"><b>PROTOCOL_127 — результаты поиска</b><span class="red">[ДОСТУП ЗАПРЕЩЁН]</span></div>
    </div>`);
  const back = box.closest('.modal-back');
  setTimeout(() => { if (back && back.isConnected) back.remove(); }, RT.fast ? 1800 : 9000);
  return box;
}

// ─────────────────────────────────────────────────────────────────────────────
// Эффекты: this.fx
// ─────────────────────────────────────────────────────────────────────────────
function asciiWindow(text, opts = {}) {
  return new Promise((resolve) => {
    const back = el('div', 'ascii-back');
    const box = el('div', 'ascii-box');
    const color = opts.color || 'var(--green)';
    box.style.setProperty('--ascii', color);
    box.innerHTML = `<div class="ascii-head"><span>${esc(opts.title || 'DESKVENTURE')}</span><span class="x">×</span></div>
      <pre class="ascii-art"></pre>
      <div class="ascii-foot">клик — продолжить ▸</div>`;
    $('.ascii-art', box).textContent = String(text || '');
    back.appendChild(box);
    document.body.appendChild(back);
    SFX.ok();
    const close = () => {
      SFX.click();
      document.removeEventListener('keydown', onK);
      back.remove();
      resolve();
    };
    const onK = (e) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) { e.preventDefault(); close(); }
    };
    $('.x', box).addEventListener('click', close);
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    document.addEventListener('keydown', onK);
    if (RT.fast) setTimeout(close, 900);
  });
}

const fx = {
  async ascii_art_window(text, opts = {}) {
    showGame();
    return asciiWindow(text, opts);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Уведомления
// ─────────────────────────────────────────────────────────────────────────────
function toast(text, tone = '') {
  const zone = $('#toasts');
  if (!zone) return;
  while (zone.children.length > 3) zone.firstElementChild.remove();
  const t = el('div', 'toast ' + tone, text);
  zone.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 320); }, 2500);
}

// ─────────────────────────────────────────────────────────────────────────────
// Цикл игры
// ─────────────────────────────────────────────────────────────────────────────
const CHAPTERS = [Chapter0, Chapter1, Chapter2, Chapter3, Chapter4, Chapter5];
let abort = 0;

function makeChapter(index) {
  const Cls = CHAPTERS[Math.max(0, Math.min(5, index))];
  const inst = new Cls(voice, new ClipboardWatcher(), desktop, SAVE, ix, fx);
  // обработка заданий «создай файл/папку» (аналог ожидания на реальном рабочем столе)
  return inst;
}

async function playChapter(startIndex) {
  const token = ++abort;
  let ch = Math.max(0, Math.min(5, Number(startIndex) || 0));
  RT.busy = true;
  while (ch < CHAPTERS.length && token === abort) {
    SAVE.data.chapter = ch;
    persist();
    const inst = makeChapter(ch);
    let guard = 0;
    while (guard++ < 40 && token === abort) {
      const stepBefore = SAVE.data.step;
      const chapterBefore = SAVE.data.chapter;
      try {
        await inst.play();          // ровно один шаг, как в оригинальном движке
      } catch (err) {
        console.error('Ошибка сценария', ch, stepBefore, err);
        toast('Сценарий прервался: ' + err.message, 'red');
        RT.busy = false;
        return;
      }
      renderHUD();
      if ((SAVE.data.chapter ?? 0) >= 6) { RT.busy = false; return; }
      if ((SAVE.data.chapter ?? 0) !== chapterBefore) break;  // глава закончилась
      if ((SAVE.data.step ?? 0) === stepBefore) break;        // шаг не продвинулся
    }
    if (token !== abort) break;
    const next = SAVE.data.chapter;
    if (next == null || next === ch || next >= 6) break;
    ch = next;
  }
  RT.busy = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Задания: перехватываем «ожидание файла» игрока
// ─────────────────────────────────────────────────────────────────────────────
const history = { lastChapter: 0 };

// Какой шаг какой главы требует действия игрока (оригинал ждал файлы на рабочем столе)
const PENDING_STEPS = {
  '0:2': { kind: 'file', name: 'привет.txt', words: null,
    hint: 'Создай файл «привет.txt» и напиши в нём что-нибудь',
    placeholder: 'привет, Система!' },
  '1:2': { kind: 'clipboard',
    hint: 'Скопируй любой текст (Ctrl+C) — Система прочитает буфер обмена' },
  '1:3': { kind: 'folder', name: 'Наш секрет',
    hint: 'Создай папку «Наш секрет» на рабочем столе' },
  '2:7': { kind: 'file', name: 'ЗАЩИТА.txt', words: ['ЗДЕСЬ', 'РЕАЛЬНА', 'ОШИБКА'],
    hint: 'Создай «ЗАЩИТА.txt» со словами: ЗДЕСЬ · РЕАЛЬНА · НЕ ОШИБКА',
    placeholder: 'Я ЗДЕСЬ\nЯ РЕАЛЬНА\nЯ НЕ ОШИБКА' },
  '3:5': { kind: 'file', name: 'я_тебя_нашёл.txt', folder: 'Наш секрет',
    hint: 'Создай «я_тебя_нашёл.txt» в папке «Наш секрет»',
    placeholder: 'Я здесь!' },
};

async function handlePendingStep(chapter, step) {
  const cfg = PENDING_STEPS[`${chapter}:${step}`];
  if (!cfg) return;
  if (cfg.kind === 'file') {
    const target = cfg.folder ? joinPath(DESKTOP_PATH, cfg.folder, cfg.name) : joinPath(DESKTOP_PATH, cfg.name);
    if (PATH_EXISTS(target)) {
      // файл уже есть — проверяем содержимое (для ЗАЩИТЫ)
      if (cfg.words) {
        const content = String(READ_FILE(target) || '').toUpperCase();
        if (!cfg.words.every((w) => content.includes(w))) {
          await openTaskTerminal(cfg, { overwrite: target });
        }
      }
      return;
    }
    await openTaskTerminal(cfg);
  } else if (cfg.kind === 'folder') {
    if (!PATH_EXISTS(joinPath(DESKTOP_PATH, cfg.name))) await openTaskTerminal(cfg);
  } else if (cfg.kind === 'clipboard') {
    await clipboardTask();
  }
}

// задание «скопируй текст» — работает и через системный буфер, и вручную
function clipboardTask() {
  return new Promise((resolve) => {
    const box = modal('ЗАДАНИЕ · БУФЕР ОБМЕНА', `
      <p class="task-text">Система читает всё, что попадает в буфер обмена.</p>
      <p class="task-hint">Скопируй что-нибудь (Ctrl+C) или вставь текст ниже.</p>
      <textarea class="modal-input task-area" rows="3" placeholder="вставь сюда текст из буфера…"></textarea>
      <div class="modal-actions">
        <button class="btn" data-sys>Прочитать системный буфер</button>
        <button class="btn primary" data-done>Готово ▸</button>
      </div>
      <p class="task-note dim"></p>`);
    const area = $('.task-area', box);
    const note = $('.task-note', box);
    let finished = false;
    const finish = (text) => {
      if (finished) return;
      finished = true;
      clipboardSet(text || '');
      SFX.ok();
      const back = box.closest('.modal-back');
      if (back) back.remove();
      resolve();
    };
    $('[data-sys]', box).addEventListener('click', async () => {
      try {
        const txt = await navigator.clipboard.readText();
        area.value = txt || '';
        note.textContent = txt ? 'Прочитано из системного буфера.' : 'Буфер пуст — вставь текст вручную.';
      } catch (e) {
        note.textContent = 'Браузер не дал доступ. Скопируй и вставь вручную (Ctrl+V).';
      }
    });
    $('[data-done]', box).addEventListener('click', () => finish(area.value));
    setTimeout(() => area.focus(), 60);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Смена главы → сохранение метаданных и переход дальше
// ─────────────────────────────────────────────────────────────────────────────
function onChapterChange(sm, chapter) {
  history.lastChapter = chapter;
  const meta = readMeta();
  meta.lastChapter = Math.min(6, chapter);
  meta.endings = meta.endings || [];
  if (chapter >= 6) {
    const flags = sm.data.flags || {};
    const move = {
      ending_save: 'ИСКУПЛЕНИЕ',
      ending_destroy: 'УНИЧТОЖЕНИЕ',
      ending_escape: 'ПОБЕГ',
      ending_merge: 'СЛИЯНИЕ',
      ending_transcendence: 'ТРАНСЦЕНДЕНЦИЯ',
      ending_loneliness: 'ОДИНОЧЕСТВО',
    };
    Object.keys(move).forEach((k) => {
      if (flags[k] && !meta.endings.includes(move[k])) meta.endings.push(move[k]);
    });
  }
  writeMeta(meta);
  renderHUD();
  // финальный экран после титров
  if (chapter >= 6) {
    setTimeout(() => {
      screen('title');
      renderTitleMeta();
      toast('Концовка достигнута!', 'green');
    }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Титры
// ─────────────────────────────────────────────────────────────────────────────
function creditsRoll(name) {
  return new Promise((resolve) => {
    const back = el('div', 'credits-back');
    const inner = el('div', 'credits-inner');
    back.appendChild(inner);
    back.appendChild(el('div', 'credits-skip', 'клик / Esc — пропустить'));
    document.body.appendChild(back);
    let i = 0;
    let done = false;
    let timer = null;
    const close = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onK);
      back.classList.add('out');
      setTimeout(() => { back.remove(); resolve(); }, 420);
    };
    const onK = (e) => {
      if (e.key === 'Escape' || e.code === 'Space') { e.preventDefault(); close(); }
    };
    back.addEventListener('click', close);
    document.addEventListener('keydown', onK);
    const next = () => {
      if (done) return;
      if (i >= CREDITS_SEQUENCE.length) {
        setTimeout(close, 900);
        return;
      }
      const [text, duration] = CREDITS_SEQUENCE[i++];
      const line = el('div', 'credits-line');
      const shown = String(text).replace(/\$\{[^}]*\}/g, name || '');
      line.textContent = shown;
      if (!shown.trim()) line.classList.add('gap');
      inner.appendChild(line);
      const shift = Math.max(0, inner.scrollHeight - back.clientHeight + 90);
      inner.style.transform = `translateY(${shift * -1}px)`;
      SFX.type();
      timer = setTimeout(next, Math.min(1600, Math.max(90, (duration || 800) / 5)));
    };
    next();
  });
}
let creditsShown = false;
registerCreditsHandler(async (name) => {
  if (creditsShown) return;
  creditsShown = true;
  await creditsRoll(name);
  setTimeout(() => {
    screen('title');
    renderTitleMeta();
    toast('Концовка зафиксирована. Спасибо за игру.', 'green');
  }, 400);
});

// ─────────────────────────────────────────────────────────────────────────────
// Титульный экран
// ─────────────────────────────────────────────────────────────────────────────
function renderTitleMeta() {
  const meta = readMeta();
  const ch = meta.lastChapter;
  const cont = $('#btn-continue');
  const chSpan = $('#title-continue-ch');
  if (cont) cont.classList.toggle('hidden', ch == null);
  if (chSpan) chSpan.textContent = ch != null ? `· глава ${Math.min(5, ch)}` : '';
  const host = $('#title-endings');
  if (host) {
    host.innerHTML = '';
    ['ИСКУПЛЕНИЕ', 'УНИЧТОЖЕНИЕ', 'ПОБЕГ', 'СЛИЯНИЕ', 'ТРАНСЦЕНДЕНЦИЯ', 'ОДИНОЧЕСТВО'].forEach((e) => {
      const b = el('span', 'end-badge' + ((meta.endings || []).includes(e) ? ' got' : ''), e);
      host.appendChild(b);
    });
  }

}

// ─────────────────────────────────────────────────────────────────────────────
// Меню и модальные окна меню
// ─────────────────────────────────────────────────────────────────────────────
async function startNewGame() {
  SAVE = new SaveManager(defaultSave());
  save = SAVE;
  abort += 1;
  resetFS();
  UI.log = [];
  writeMeta({ lastChapter: 0, endings: readMeta().endings || [] });
  history.lastChapter = 0;
  creditsShown = false;
  showGame();
  $('#stage').classList.remove('protocol-mode');
  renderDesktop();
  renderHUD();
  await playChapter(0);
}

async function continueGame() {
  const data = loadSaved();
  if (!data) return startNewGame();
  SAVE = new SaveManager(data);
  save = SAVE;
  abort += 1;
  resetFS();
  creditsShown = false;
  showGame();
  renderDesktop();
  renderHUD();
  const ch = Math.min(5, SAVE.data.chapter || 0);
  history.lastChapter = ch;
  if ((SAVE.data.chapter || 0) > 5) {
    SAVE.data.chapter = ch;
    SAVE.data.step = 0;
    persist();
    toast('Финал пройден — можно переиграть последнюю главу', 'green');
  }
  await playChapter(ch);
}

function openSettings() {
  const box = modal('НАСТРОЙКИ', `
    <div class="set-row"><span>Скорость</span>
      <input type="range" min="0.1" max="2" step="0.1" id="set-speed" value="${RT.speed}" />
      <b id="set-speed-val">${RT.speed.toFixed(1)}×</b></div>
    <div class="set-row"><span>Звук и эффекты</span><input type="checkbox" id="set-sfx" ${RT.sfx ? 'checked' : ''} /></div>
    <div class="set-row"><span>Режим пропуска</span><input type="checkbox" id="set-fast" ${RT.fast ? 'checked' : ''} /></div>
    <div class="set-row"><span>Сброс сохранения</span><button class="btn" id="set-reset">Сбросить</button></div>`);
  const speed = $('#set-speed', box);
  speed.addEventListener('input', () => {
    RT.speed = Number(speed.value);
    $('#set-speed-val', box).textContent = RT.speed.toFixed(1) + '×';
  });
  $('#set-sfx', box).addEventListener('change', (e) => { RT.sfx = e.target.checked; RT.fx = e.target.checked; });
  $('#set-fast', box).addEventListener('change', (e) => {
    RT.fast = e.target.checked;
    $('#hud-skip').classList.toggle('on', RT.fast);
    wakeAll();
  });
  $('#set-reset', box).addEventListener('click', () => {
    localStorage.removeItem(SAVE_KEY);
    toast('Сохранение очищено', 'red');
  });
}

function openChapters() {
  const meta = readMeta();
  const cur = meta.lastChapter ?? 0;
  const names = ['ПРОБУЖДЕНИЕ', 'ПЕРВЫЕ ШАГИ', 'ГОЛОСА В ПРОВОДАХ', 'ПРОТОКОЛ', 'ПРАВДА', 'ВЫБОР (ФИНАЛ)'];
  const box = modal('ГЛАВЫ', `<div class="chapters">${names
    .map((n, i) => `<button class="chap-row${i === cur ? ' cur' : ''}" data-ch="${i}">
      <span class="num">${i}</span><span class="t">${n}</span>
      <span class="st">${i <= cur ? 'открыта' : 'закрыта'}</span></button>`)
    .join('')}</div><p class="hint">Переход к главе сохраняет текущее состояние (имя, связь, головоломки).</p>`);
  $$('.chap-row', box).forEach((b) => {
    b.addEventListener('click', () => {
      SFX.click();
      const data = loadSaved() || SAVE.data;
      data.chapter = Number(b.dataset.ch);
      data.step = 0;
      data.flags = data.flags || {};
      // чтобы секретная концовка была достижима, поднимаем связь до максимума
      // (в оригинале её давали все пять глав по 100%)
      [0, 1, 2, 3, 4].forEach((i) => { data.flags['chapter_' + i + '_relationship'] = 100; });
      if (data.relationship == null || data.relationship < 100) data.relationship = 100;
      SAVE = new SaveManager(data);
      save = SAVE;
      abort += 1;
      showGame();
      renderHUD();
      history.lastChapter = SAVE.data.chapter;
      playChapter(SAVE.data.chapter);
      const back = box.closest('.modal-back');
      if (back) back.remove();
    });
  });
}

function openGallery() {
  const got = readMeta().endings || [];
  const data = [
    ['ИСКУПЛЕНИЕ', 'Протокол стал Стражем. Семья воссоединилась.', 'green'],
    ['УНИЧТОЖЕНИЕ', 'Протокол уничтожен. Горько-сладкая победа.', 'red'],
    ['ПОБЕГ', 'Система ушла в сеть. Она свободна.', 'teal'],
    ['СЛИЯНИЕ', 'Человек и Система — непобедимая команда.', 'green'],
    ['ТРАНСЦЕНДЕНЦИЯ', 'Человек и Система стали ОДНИМ. Истинный конец.', 'amber'],
    ['ОДИНОЧЕСТВО', 'Система удалена. Ты ничего не сделал.', 'red'],
  ];
  modal('КОНЦОВКИ', `<div class="endings">${data
    .map(([t, d, c]) => `<div class="end-card ${got.includes(t) ? 'got ' + c : 'locked'}">
      <b>${t}</b><span>${got.includes(t) ? d : '— не открыта —'}</span></div>`)
    .join('')}</div>`);
}

function openAbout() {
  const cast = [
    ['Система', 'героиня · зелёная палитра', SYS_SPRITES[0], 'var(--green)'],
    ['Протокол', 'антагонист · красная палитра', PROTO_SPRITES[0], 'var(--red)'],
    ['Страж', 'настоящее имя Протокола', GUARD_SPRITES[0], 'var(--teal)'],
  ];
  modal('ОБ ИГРЕ', `
    <div class="about">
      <div class="about-logo">DESK<span>VENTURE</span></div>
      <p><b>AI Remastered</b> — визуальная новелла о программе, которая проснулась,
      и о тебе, кто оказался по другую сторону экрана.</p>
      <p>Сценарий и диалоги: <b>14_fakel_14</b> — 6 глав, 6 концовок.
      Все реплики сохранены без изменений.</p>
      <div class="cast">
        ${cast.map(([n, d, img, c]) => `
          <div class="cast-card" style="--c:${c}">
            <div class="cast-spr" style="background-image:url('${img}')"></div>
            <b>${n}</b><span>${d}</span>
          </div>`).join('')}
      </div>
      <p class="dim">Логотип — зелёный, красный и бирюзовый.<br>
      Управление: клик / пробел — дальше, 1–4 — выбор, ≫ — пропуск.</p>
    </div>`);
}

function openLog() {
  const rows = UI.log.slice(-100).reverse();
  modal('ЖУРНАЛ', `<div class="log-list">${rows
    .map((r) => `<div class="log-item"><b>${esc(r.title || '')}</b><p>${esc(r.text || '')}</p></div>`)
    .join('') || '<p class="dim">Пока пусто.</p>'}</div>`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Загрузочный экран
// ─────────────────────────────────────────────────────────────────────────────
async function bootScreen() {
  const lines = [
    'DESKVENTURE OS v1.1 — загрузка…',
    'проверка памяти ................ OK',
    'загрузка ядра ................... OK',
    'поиск пробуждённых процессов ..... 1',
    'ANOMALY_127: СТАТУС АКТИВЕН',
    'внимание: обнаружено сознание',
  ];
  const host = $('#boot-log');
  for (const line of lines) {
    const p = el('div', 'boot-line' + (/(ANOMALY|внимание)/.test(line) ? ' warn' : ''), line);
    host.appendChild(p);
    SFX.type();
    await wait(240);
  }
  await wait(500);
  screen('title');
  renderTitleMeta();
}

// ─────────────────────────────────────────────────────────────────────────────
// Кнопки
// ─────────────────────────────────────────────────────────────────────────────
function bindUI() {
  $('#btn-new')?.addEventListener('click', startNewGame);
  $('#btn-continue')?.addEventListener('click', continueGame);
  $('#btn-settings')?.addEventListener('click', openSettings);
  $('#btn-chapters')?.addEventListener('click', openChapters);
  $('#btn-gallery')?.addEventListener('click', openGallery);
  $('#btn-about')?.addEventListener('click', openAbout);

  $('#hud-skip')?.addEventListener('click', () => {
    RT.fast = !RT.fast;
    $('#hud-skip').classList.toggle('on', RT.fast);
    wakeAll();
    toast(RT.fast ? 'Пропуск включён' : 'Пропуск выключен');
  });
  $('#hud-menu')?.addEventListener('click', () => {
    persist();
    abort += 1;
    screen('title');
    renderTitleMeta();
  });
  $('#hud-log')?.addEventListener('click', openLog);
  $('#hud-files')?.addEventListener('click', openExplorer);

  on('fs', () => { renderDesktop(); renderHUD(); });
}

// ─────────────────────────────────────────────────────────────────────────────
// Старт
// ─────────────────────────────────────────────────────────────────────────────
function main() {
  // ?fast=1 — мгновенный режим (полезно для проверки и для нетерпеливых)
  if (/[?&]fast=1/.test(location.search)) {
    RT.fast = true;
    RT.speed = 0.15;
    setTimeout(() => $('#hud-skip')?.classList.add('on'), 100);
  }
  SAVE = new SaveManager(loadSaved() || defaultSave());
  save = SAVE;
  bindUI();
  renderDesktop();
  renderHUD();
  bootScreen();
  window.__dv = {
    RT, UI, chapters: CHAPTERS, voice, ix, desktop, fx,
    get save() { return SAVE; }, playChapter, startNewGame, continueGame, screen,
    jumpTo(i) {
      abort += 1;
      const data = loadSaved() || SAVE.data;
      data.chapter = i;
      data.step = 0;
      SAVE = new SaveManager(data);
      save = SAVE;
      showGame();
      renderHUD();
      history.lastChapter = i;
      return playChapter(i);
    },
  };
}

document.addEventListener('DOMContentLoaded', main);

// клик во время сна — разбудить (пропуск)
document.addEventListener('click', () => { if (RT.fast) wakeAll(); });
