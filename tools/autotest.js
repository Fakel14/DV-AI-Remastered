// Автоматический прогон игры в jsdom — проверка сценария от начала до концовки.
// Запуск: node tools/autotest.js [--chapter N] [--choices first|last|random] [--name Имя]
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('/tmp/t/node_modules/jsdom');

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : d;
};
const START_CHAPTER = Number(opt('chapter', 0));
const MODE = opt('choices', 'first');
const NAME = opt('name', 'Тестер');
const MAX_MS = Number(opt('max', 180000));

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const vc = new VirtualConsole();
const errors = [];
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.stack || e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('warn', () => {});

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
global.window = window;
global.document = window.document;

// полифиллы
window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AA==';
window.HTMLCanvasElement.prototype.getContext = function () {
  const c = this;
  return {
    imageSmoothingEnabled: false,
    fillStyle: '#000',
    fillRect() {},
    clearRect() {},
    toDataURL: () => 'data:image/png;base64,',
  };
};
window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
// Тихий AudioContext: пути звукового движка действительно исполняются,
// но ни один сэмпл не считается (в jsdom нет WebAudio).
function param(v) {
  return {
    value: v,
    setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {},
    setTargetAtTime() {}, cancelScheduledValues() {},
  };
}
function SilentCtx() {
  this.state = 'running';
  this.sampleRate = 44100;
  this._t = 0;
  this.destination = { connect() {} };
}
SilentCtx.prototype = {
  get currentTime() { this._t += 0.001; return this._t; },
  resume() { this.state = 'running'; return Promise.resolve(); },
  createGain() { return { gain: param(1), connect() {} }; },
  createOscillator() { return { type: 'sine', frequency: param(440), connect() {}, start() {}, stop() {} }; },
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
  createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {} }; },
  createBiquadFilter() { return { type: 'lowpass', frequency: param(1000), Q: param(1), connect() {} }; },
  createDynamicsCompressor() {
    return { threshold: param(0), knee: param(0), ratio: param(1), attack: param(0), release: param(0), connect() {} };
  },
};
window.AudioContext = SilentCtx;
window.webkitAudioContext = undefined;
window.performance = window.performance || { now: () => Date.now() };
window.navigator.clipboard = { readText: async () => 'привет из буфера' };
window.scrollTo = () => {};
window.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 4);

const log = [];
const origLog = console.log;

function $(sel) { return window.document.querySelector(sel); }
function $$(sel) { return Array.from(window.document.querySelectorAll(sel)); }
function click(node) {
  if (!node) return false;
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  return true;
}
function key(code, k) {
  const ev = new window.KeyboardEvent('keydown', { code, key: k || code, bubbles: true, cancelable: true });
  window.document.dispatchEvent(ev);
}

// снимок диалога
let lastText = '';
function currentText() {
  const t = $('.dlg-text');
  return t ? t.textContent : '';
}

async function autoPlayer() {
  let actions = 0;
  const started = Date.now();
  let stuckSince = Date.now();
  let lastSnapshot = '';
  let lastChapter = -1;
  let lastStep = -1;
  let choiceCount = 0;

  let lastBeat = 0;
  while (Date.now() - started < MAX_MS) {
    await new Promise((r) => setTimeout(r, 25));
    if (Date.now() - lastBeat > 5000) {
      lastBeat = Date.now();
      const d = window.__dv;
      if (d) origLog(`choices=${$$('.dlg-choices.show .choice').length} modal=${($('.modal-head')||{}).textContent||''} ascii=${!!$('.ascii-back')} term=${!!$('.termwin')} · глава ${d.save.data.chapter} шаг ${d.save.data.step} | реплик ${d.UI.log.length} | выборов ${d.save.data.choices ? Object.keys(d.save.data.choices).length : 0} | ${currentText().slice(0, 40).replace(/\n/g, ' ')}`);
    }
    const dv = window.__dv;
    if (!dv) continue;

    const modalBack = $('.modal-back');
    const modalInput = $('.modal-input');

    // 1) терминал задания (файл/папка)
    const term = $('.termwin');
    if (term) {
      const area = $('.term-text', term);
      if (area) area.value = 'привет, это тест\nя тебя нашёл\nЯ ЗДЕСЬ\nЯ РЕАЛЬНА\nЯ НЕ ОШИБКА';
      click($('[data-make]', term));
      log.push('задание выполнено');
      await new Promise((r) => setTimeout(r, 60));
      continue;
    }

    // 1б) задание с буфером обмена
    const taskArea = $('.task-area');
    if (taskArea) {
      taskArea.value = 'тестовый буфер';
      click($('[data-done]'));
      log.push('буфер обмена');
      await new Promise((r) => setTimeout(r, 40));
      continue;
    }

    // 1в) ввод имени/ответа
    if (modalInput) {
      modalInput.value = NAME + (choiceCount ? '' : '');
      await new Promise((r) => setTimeout(r, 10));
      click($('[data-ok]', $('.modal-back')));
      log.push('ввод: ' + modalInput.value);
      continue;
    }

    // 2) выбор варианта
    const choices = $$('.dlg-choices.show .choice');
    if (choices.length) {
      let pick = choices[0];
      if (MODE === 'last') pick = choices[choices.length - 1];
      if (MODE === 'random') pick = choices[Math.floor(Math.random() * choices.length)];
      const label = pick.textContent.trim();
      click(pick);
      choiceCount += 1;
      log.push(`выбор: ${label}`);
      await new Promise((r) => setTimeout(r, 20));
      continue;
    }

    // 5) QTE
    const qte = $('.qte');
    if (qte) {
      const keys = $$('.qkey', qte).map((n) => n.textContent);
      for (const k of keys) {
        key('Key' + k.toUpperCase(), k.toLowerCase());
        await new Promise((r) => setTimeout(r, 30));
      }
      log.push('QTE: ' + keys.join(''));
      continue;
    }

    // 6) пазл
    const pz = $('.puzzle');
    if (pz) {
      // собираем правильный порядок из подсказки невозможно — подбираем перестановками
      const bank = $$('.pz-bank .chip', pz);
      const slots = $$('.slot', pz);
      if (!pz.dataset.attempt) {
        pz.dataset.attempt = '1';
        const target = ['GUARDIAN', 'PROTECT', 'FRIEND', 'SYSTEM'];
        for (let i = 0; i < slots.length; i++) {
          const chip = bank.find((c) => c.textContent === target[i]);
          if (chip) { click(chip); click(slots[i]); }
        }
      }
      click($('[data-check]', pz));
      log.push('пазл');
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    // 7) ASCII-окно
    const ascii = $('.ascii-back');
    if (ascii) {
      key('Space', ' ');
      log.push('ascii: ' + ($('.ascii-head span') || {}).textContent);
      await new Promise((r) => setTimeout(r, 60));
      continue;
    }

    // 8) титры
    const credits = $('.credits-back');
    if (credits) {
      log.push('ТИТРЫ');
      click(credits);
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    // 9) обычный диалог — кликаем «дальше»
    const dlg = $('.dlg');
    if (dlg) {
      const snapshot = `${dv.save.data.chapter}:${dv.save.data.step}:${currentText().length}`;
      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        stuckSince = Date.now();
      }
      if (currentText().length > 0) {
        click($('#stage'));
        actions += 1;
        await new Promise((r) => setTimeout(r, 8));
        continue;
      }
    }

    // 10) финал?
    if (currentText().includes('КОНЕЦ')) {
      log.push('ЭКРАН КОНЦОВКИ: ' + currentText().slice(0, 90).replace(/\n/g, ' '));
      await new Promise((r) => setTimeout(r, 2500));
      if (window.document.body.dataset.screen === 'title') {
        log.push('возврат в главное меню');
        break;
      }
    }
    if (dv.save.data.chapter >= 6) {
      log.push('ФИНАЛ: глава ' + dv.save.data.chapter);
      break;
    }
    if (Date.now() - stuckSince > 12000) {
      log.push('⚠ ЗАСТРЯЛИ на ' + lastSnapshot + ' — текст: ' + currentText().slice(0, 120));
      break;
    }
  }
  const dv = window.__dv;
  const s = dv ? dv.save.data : {};
  return {
    chapter: s.chapter,
    step: s.step,
    relationship: s.relationship,
    puzzles: s.puzzles_solved,
    flags: s.flags,
    actions,
    choiceCount,
    log,
    errors,
    dialogs: dv ? dv.UI.log.length : 0,
    files: [...window.__dvFiles || []],
  };
}

(async () => {
  // ускоряем: включаем пропуск и максимальную скорость
  await new Promise((r) => setTimeout(r, 200));
  const gameModule = path.join(root, 'js', 'game.js');
  // запускаем модуль вручную (jsdom не грузит type=module)
  window.eval('window.__bootReady = true;');

  // импорт ES-модулей через dynamic import с file:// URL не сработает в jsdom,
  // поэтому грузим собранный бандл (см. tools/bundle.mjs)
  const bundlePath = path.join(root, 'js', 'bundle.js');
  if (!fs.existsSync(bundlePath)) {
    origLog('Сборка бандла…');
    require('child_process').execFileSync(process.execPath, [path.join(root, 'tools', 'bundle.mjs')], { stdio: 'inherit' });
  }
  const bundle = fs.readFileSync(bundlePath, 'utf8');
  window.eval(bundle);

  // звук и музыка — отдельный самодостаточный файл; проверяем, что он не ломает сценарий
  const audioPath = path.join(root, 'js', 'audio.js');
  let audioLoaded = false;
  if (fs.existsSync(audioPath)) {
    try {
      window.eval(fs.readFileSync(audioPath, 'utf8'));
      audioLoaded = !!window.DVAudio;
      window.document.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    } catch (e) {
      errors.push('audio.js: ' + (e && e.stack || e));
    }
  }

  // запускаем игру (DOMContentLoaded уже прошёл до вставки бандла)
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise((r) => setTimeout(r, 120));
  if (!window.__dv) {
    origLog('НЕ ЗАПУСТИЛОСЬ: ' + errors.join(' | '));
    process.exit(3);
  }

  // ускорение
  window.__dv.RT.fast = true;
  window.__dv.RT.speed = 0.05;
  window.__dv.RT.sfx = false;
  window.__dv.RT.fx = false;

  // старт новой игры на нужной главе
  window.__dv.startNewGame();
  if (START_CHAPTER > 0) {
    await new Promise((r) => setTimeout(r, 300));
    window.__dv.jumpTo(START_CHAPTER);
  }

  const res = await autoPlayer();
  if (window.DVAudio) {
    res.audio = {
      loaded: audioLoaded,
      sounds: window.DVAudio.sounds().length,
      tracks: window.DVAudio.music.tracks.length,
      lastTrack: window.DVAudio.music.name,
      ready: window.DVAudio.isReady(),
    };
  }
  origLog(JSON.stringify(res, null, 1));
  process.exit(res.chapter >= 6 || res.errors.length ? 0 : 1);
})();
