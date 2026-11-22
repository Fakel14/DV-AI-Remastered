/* ═══════════════════════════════════════════════════════════════════════════
   DESKVENTURE: AI REMASTERED — звук и музыка (всё в одном файле)

   Подключение — одна строка в index.html, сразу после бандла игры:

       <script src="js/bundle.js" defer></script>
       <script src="js/audio.js"  defer></script>

   Больше НИЧЕГО править не нужно: скрипт сам находит игру, перехватывает
   нужные вызовы и рисует кнопку звука в верхней панели.

   ── что внутри ──────────────────────────────────────────────────────────────
   • 77 РАЗНЫХ звуков (у каждого действия — свой): клик, наведение, печать текста, листание реплики,
     выбор варианта, верно/неверно, таймер, ввод текста, открытие/закрытие окон,
     создание и удаление файла, папка, чтение, пазл (плитка/успех/провал),
     QTE (старт/попадание/промах/успех/провал), голоса Системы / Протокола /
     Стража, глитч, ошибка, тревога, рост и падение связи, конец главы,
     достижение, финал, титры, уведомления, пропуск, mute.
   • 8 МУЗЫКАЛЬНЫХ ТРЕКОВ (генеративные секвенсоры, бесшовные):
     boot, menu, system, protocol, mystery, battle, finale, ending.
     Переключаются сами: меню → глава → по настроению → финал → титры.
   • Громкости (общая / эффекты / музыка), MUTE, панель настроек, клавиша M.
     Настройки переживают перезагрузку (localStorage: deskventure.audio.v1).
   • Всё синтезируется на лету через WebAudio — ни одного mp3/ogg,
     поэтому работает даже если index.html открыт двойным кликом (file://).
   • Старый встроенный «бипер» игры автоматически приглушается, чтобы звуки
     не дублировались: этим тоже занимается только этот файл.
   • Консольный доступ: DVAudio.play('glitch'), DVAudio.music.start('battle'),
     DVAudio.sounds(), DVAudio.openPanel().
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.DVAudio) return;                 // не подключаемся дважды

  var LS = 'deskventure.audio.v1';

  // ── настройки ──────────────────────────────────────────────────────────────
  var CFG = { master: 0.85, sfx: 0.9, music: 0.5, muted: false };
  try { Object.assign(CFG, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
  function saveCfg() { try { localStorage.setItem(LS, JSON.stringify(CFG)); } catch (e) {} }

  // ── старый движок игры умел только 8 писков — приглушаем его,
  //    чтобы не было «двойных» звуков: наш синтезатор играет всё сам.
  var RealCtx = window.AudioContext || window.webkitAudioContext || null;
  (function muteLegacy() {
    if (!RealCtx) return;
    var desc = null;
    try { desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(RealCtx.prototype), 'destination'); } catch (e) {}
    function Soft(fadeTo) {
      return function LegacyGain() {
        var real = new RealCtx();
        try {
          if (desc && desc.get) {
            var dest = desc.get.call(real);
            var g = real.createGain();
            g.gain.value = fadeTo;
            g.connect(dest);
            Object.defineProperty(real, 'destination', { get: function () { return g; }, configurable: true });
          }
        } catch (e) {}
        return real;
      };
    }
    var SoftCtx = Soft(0.01);
    SoftCtx.prototype = RealCtx.prototype;
    try { window.AudioContext = SoftCtx; window.webkitAudioContext = SoftCtx; } catch (e) {}
  })();

  // ── аудиограф ──────────────────────────────────────────────────────────────
  var ctx = null, master = null, busSfx = null, busMusic = null, ready = false;

  function graph() {
    if (!RealCtx) return false;
    try { ctx = new RealCtx(); } catch (e) { return false; }
    master = ctx.createGain();
    busSfx = ctx.createGain();
    busMusic = ctx.createGain();
    busSfx.connect(master);
    busMusic.connect(master);
    var comp = null;
    try {
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 20;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.22;
    } catch (e) { comp = null; }
    if (comp) { master.connect(comp); comp.connect(ctx.destination); }
    else master.connect(ctx.destination);
    vol();
    ready = true;
    return true;
  }

  function vol() {
    if (!ctx) return;
    var m = CFG.muted ? 0 : 1;
    master.gain.setTargetAtTime(CFG.master * m, ctx.currentTime, 0.04);
    busSfx.gain.setTargetAtTime(CFG.sfx, ctx.currentTime, 0.04);
    busMusic.gain.setTargetAtTime(CFG.music, ctx.currentTime, 0.06);
  }

  // первый жест пользователя разблокирует звук (так требуют браузеры)
  function unlock() {
    if (ready && ctx && ctx.state === 'running' && !pending.length) return;   // уже всё
    if (!ctx && !graph()) return;
    if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} }
    var q = pending.splice(0);
    q.forEach(function (fn) { try { fn(); } catch (e) {} });
    if (!music.name) music.start(document.body.dataset.screen === 'game' ? 'system' : 'menu', 600);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, unlock, { passive: true });
  });
  var pending = [];

  // ── примитивы синтеза ──────────────────────────────────────────────────────
  var LAT = { C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4, 'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2 };
  function hz(name) {                          // 'A4' → герцы
    var m = /^([A-G]#?)(-?\d)$/.exec(String(name));
    if (!m) return 440;
    var semi = LAT[m[1]] + (Number(m[2]) - 4) * 12;
    return 440 * Math.pow(2, semi / 12);
  }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function tone(type, freq, t0, dur, gain, dest, glideTo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0008, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0009, gain), t0 + Math.min(0.015, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g);
    g.connect(dest || busSfx);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
    return o;
  }
  function noise(t0, dur, gain, ftype, freq, dest, q) {
    var len = Math.max(2, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = ftype || 'bandpass';
    f.frequency.value = freq || 1800;
    f.Q.value = q || 0.9;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    src.connect(f); f.connect(g); g.connect(dest || busSfx);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }
  function bell(name, t0, dur, gain, dest, type) {
    var f = hz(name);
    tone(type || 'sine', f, t0, dur, gain, dest);
    tone('sine', f * 2.004, t0, dur * 0.6, gain * 0.34, dest);
    tone('triangle', f * 3.01, t0, dur * 0.32, gain * 0.1, dest);
  }
  function seq(notes, t0, step, dur, gain, dest, type) {
    notes.forEach(function (n, i) {
      tone(type || 'square', hz(n), t0 + i * step, dur, gain, dest);
    });
  }

  // ── КАТАЛОГ ЗВУКОВ: одно действие = один свой звук ─────────────────────────
  var SND = {
    // ─ системы и загрузка
    boot: function () {
      var t = ctx.currentTime;
      seq(['C3', 'G3', 'C4', 'E4'], t, 0.085, 0.11, 0.05);
      bell('C5', t + 0.34, 0.9, 0.055);
    },
    logo: function () {
      var t = ctx.currentTime;
      bell('C4', t, 1.1, 0.06);
      bell('G4', t + 0.11, 1.0, 0.05);
      bell('C5', t + 0.22, 1.3, 0.045);
    },
    load: function () { tone('sine', 900, ctx.currentTime, 0.05, 0.03); },

    // ─ интерфейс
    hover: function () { tone('sine', 1680, ctx.currentTime, 0.03, 0.016); },
    click: function () {
      var t = ctx.currentTime;
      tone('triangle', 700, t, 0.045, 0.055);
      tone('sine', 1060, t + 0.012, 0.035, 0.028);
    },
    back: function () { seq(['A5', 'E5', 'C5'], ctx.currentTime, 0.035, 0.06, 0.04, null, 'triangle'); },
    open: function () {
      var t = ctx.currentTime;
      tone('sine', 420, t, 0.14, 0.05, null, 1080);
      noise(t, 0.09, 0.018, 'highpass', 2600);
    },
    close: function () { tone('sine', 900, ctx.currentTime, 0.12, 0.045, null, 380); },
    toggle: function () {
      var t = ctx.currentTime;
      tone('square', 1180, t, 0.02, 0.038);
      tone('square', 1580, t + 0.03, 0.02, 0.032);
    },
    tab: function () {
      var t = ctx.currentTime;
      tone('triangle', 980, t, 0.04, 0.034);
      tone('triangle', 1320, t + 0.05, 0.05, 0.028);
    },
    focus: function () { tone('sine', 2400, ctx.currentTime, 0.02, 0.012); },

    // ─ диалоги
    type: function () { tone('square', rnd(1250, 1870), ctx.currentTime, 0.011, 0.012); },
    typeProto: function () { tone('sawtooth', rnd(120, 190), ctx.currentTime, 0.03, 0.014); },
    typeGuard: function () { tone('sine', rnd(900, 1200), ctx.currentTime, 0.02, 0.012); },
    advance: function () { tone('sine', 1320, ctx.currentTime, 0.05, 0.028, null, 1660); },
    skipText: function () {
      var t = ctx.currentTime;
      noise(t, 0.12, 0.02, 'highpass', 3400);
      tone('square', 1800, t, 0.04, 0.02, null, 900);
    },
    choiceHover: function () { tone('triangle', 1240, ctx.currentTime, 0.025, 0.018); },
    choicePick: function () {
      var t = ctx.currentTime;
      tone('triangle', 620, t, 0.05, 0.048);
      tone('triangle', 930, t + 0.06, 0.09, 0.042);
    },
    correct: function () {
      var t = ctx.currentTime;
      seq(['E5', 'G5', 'B5', 'E6'], t, 0.07, 0.16, 0.042, null, 'triangle');
    },
    wrong: function () {
      var t = ctx.currentTime;
      tone('sawtooth', 190, t, 0.28, 0.048, null, 92);
      tone('square', 96, t + 0.04, 0.22, 0.028);
    },
    neutral: function () { tone('triangle', 520, ctx.currentTime, 0.07, 0.03); },
    timer: function () { tone('square', 1480, ctx.currentTime, 0.045, 0.042); },
    timerLow: function () { tone('square', 1080, ctx.currentTime, 0.06, 0.052); },
    timeout: function () { seq(['C5', 'A4', 'F4'], ctx.currentTime, 0.09, 0.16, 0.042, null, 'sawtooth'); },
    inputOpen: function () {
      var t = ctx.currentTime;
      tone('sine', 520, t, 0.1, 0.032, null, 900);
      bell('E5', t + 0.05, 0.45, 0.022);
    },
    keypress: function () { tone('square', rnd(900, 1500), ctx.currentTime, 0.012, 0.014); },
    inputSubmit: function () {
      var t = ctx.currentTime;
      tone('triangle', 880, t, 0.06, 0.048);
      tone('triangle', 1320, t + 0.05, 0.1, 0.038);
    },
    inputEmpty: function () { tone('square', 300, ctx.currentTime, 0.14, 0.042, null, 200); },
    inputClose: function () { tone('sine', 640, ctx.currentTime, 0.08, 0.03, null, 320); },

    // ─ задания и файлы
    taskOpen: function () {
      var t = ctx.currentTime;
      tone('sine', 300, t, 0.18, 0.042, null, 620);
      bell('A4', t + 0.12, 0.5, 0.028);
    },
    taskDone: function () {
      var t = ctx.currentTime;
      seq(['A4', 'C#5', 'E5'], t, 0.06, 0.14, 0.04, null, 'triangle');
    },
    fileCreate: function () {
      var t = ctx.currentTime;
      noise(t, 0.06, 0.028, 'highpass', 3000);
      bell('B5', t + 0.05, 0.42, 0.042);
    },
    fileDelete: function () {
      var t = ctx.currentTime;
      noise(t, 0.2, 0.04, 'lowpass', 1400);
      tone('sawtooth', 320, t, 0.14, 0.028, null, 120);
    },
    folderCreate: function () {
      var t = ctx.currentTime;
      tone('triangle', 470, t, 0.07, 0.038);
      tone('triangle', 710, t + 0.06, 0.1, 0.032);
      noise(t, 0.05, 0.016, 'bandpass', 2000);
    },
    folderOpen: function () {
      var t = ctx.currentTime;
      tone('triangle', 620, t, 0.05, 0.03);
      tone('triangle', 930, t + 0.07, 0.09, 0.026);
    },
    fileRead: function () {
      var t = ctx.currentTime;
      [0, 0.055, 0.11].forEach(function (d) { tone('sine', 1500, t + d, 0.03, 0.017); });
    },
    fileWrite: function () {
      var t = ctx.currentTime;
      noise(t, 0.14, 0.02, 'bandpass', 2600);
      [0, 0.07].forEach(function (d) { tone('square', 1400, t + d, 0.02, 0.016); });
    },
    clipboard: function () {
      var t = ctx.currentTime;
      tone('square', 880, t, 0.03, 0.03);
      tone('square', 1240, t + 0.06, 0.05, 0.026);
    },

    // ─ головоломки
    puzzleTile: function () { tone('square', rnd(680, 900), ctx.currentTime, 0.03, 0.032); },
    puzzleSlot: function () { tone('triangle', rnd(380, 520), ctx.currentTime, 0.045, 0.03); },
    puzzleReset: function () {
      var t = ctx.currentTime;
      noise(t, 0.14, 0.026, 'bandpass', 1200);
      tone('sawtooth', 400, t, 0.1, 0.026, null, 700);
    },
    puzzleSolved: function () {
      var t = ctx.currentTime;
      seq(['C5', 'E5', 'G5', 'C6', 'E6'], t, 0.072, 0.19, 0.038, null, 'triangle');
      bell('C6', t + 0.36, 0.9, 0.036);
    },
    puzzleFail: function () { seq(['E4', 'D4', 'C4', 'B3'], ctx.currentTime, 0.1, 0.18, 0.038, null, 'sawtooth'); },

    // ─ QTE
    qteStart: function () {
      var t = ctx.currentTime;
      tone('sawtooth', 260, t, 0.1, 0.042, null, 520);
      tone('sawtooth', 520, t + 0.1, 0.12, 0.032, null, 260);
    },
    qteHit: function () {
      var t = ctx.currentTime;
      tone('square', rnd(760, 900), t, 0.045, 0.05);
      noise(t, 0.035, 0.014, 'highpass', 3200);
    },
    qteMiss: function () {
      var t = ctx.currentTime;
      tone('square', 190, t, 0.12, 0.048, null, 140);
      noise(t, 0.1, 0.026, 'lowpass', 800);
    },
    qteSuccess: function () {
      var t = ctx.currentTime;
      seq(['G4', 'B4', 'D5', 'G5'], t, 0.06, 0.18, 0.045, null, 'square');
      bell('G5', t + 0.3, 0.8, 0.038);
    },
    qteFail: function () {
      var t = ctx.currentTime;
      tone('sawtooth', 220, t, 0.4, 0.045, null, 70);
      noise(t, 0.3, 0.028, 'lowpass', 600);
    },
    guessCorrect: function () { seq(['D5', 'F#5', 'A5', 'D6'], ctx.currentTime, 0.06, 0.16, 0.042, null, 'triangle'); },
    guessWrong: function () { tone('triangle', 400, ctx.currentTime, 0.12, 0.032, null, 300); },

    // ─ персонажи
    systemSpeak: function () {
      var t = ctx.currentTime;
      tone('sine', hz('E5'), t, 0.09, 0.018);
      tone('sine', hz('B5'), t + 0.03, 0.09, 0.013);
    },
    protocolSpeak: function () {
      var t = ctx.currentTime;
      tone('sawtooth', 68, t, 0.4, 0.042);
      tone('sawtooth', 52, t + 0.12, 0.5, 0.032);
      noise(t, 0.25, 0.018, 'bandpass', 320);
    },
    guardianSpeak: function () {
      var t = ctx.currentTime;
      bell('A4', t, 0.8, 0.04);
      bell('E5', t + 0.1, 0.7, 0.026);
    },
    narrator: function () { tone('sine', 320, ctx.currentTime, 0.1, 0.02); },

    // ─ события и атмосфера
    glitch: function () {
      var t = ctx.currentTime;
      for (var i = 0; i < 5; i++) tone('square', rnd(80, 980), t + i * 0.022, 0.03, 0.032);
      noise(t, 0.16, 0.04, 'bandpass', 2400);
    },
    error: function () {
      var t = ctx.currentTime;
      tone('square', 240, t, 0.12, 0.038);
      tone('square', 180, t + 0.14, 0.18, 0.038);
    },
    errorWindow: function () {
      var t = ctx.currentTime;
      noise(t, 0.05, 0.028, 'highpass', 2500);
      tone('square', 330, t + 0.03, 0.09, 0.032, null, 220);
    },
    warning: function () {
      var t = ctx.currentTime;
      for (var i = 0; i < 3; i++) tone('triangle', 880, t + i * 0.16, 0.09, 0.036);
    },
    alarm: function () {
      var t = ctx.currentTime;
      for (var i = 0; i < 4; i++) tone('sawtooth', i % 2 ? 620 : 880, t + i * 0.14, 0.12, 0.032);
    },
    relationshipUp: function () { seq(['A4', 'C#5', 'E5'], ctx.currentTime, 0.05, 0.13, 0.032, null, 'sine'); },
    relationshipDown: function () { seq(['E4', 'C4', 'A3'], ctx.currentTime, 0.06, 0.15, 0.032, null, 'sine'); },
    chapterEnd: function () {
      var t = ctx.currentTime;
      seq(['C4', 'E4', 'G4', 'C5', 'E5'], t, 0.12, 0.38, 0.045, null, 'triangle');
      bell('C5', t + 0.6, 1.5, 0.045);
    },
    chapterStart: function () {
      var t = ctx.currentTime;
      noise(t, 0.3, 0.02, 'bandpass', 1600);
      bell('G4', t + 0.1, 1.1, 0.04);
    },
    achievement: function () {
      var t = ctx.currentTime;
      seq(['E5', 'A5', 'C#6'], t, 0.06, 0.16, 0.036, null, 'triangle');
      bell('E6', t + 0.2, 0.7, 0.026);
    },
    ending: function () {
      var t = ctx.currentTime;
      seq(['C4', 'G4', 'C5', 'E5', 'G5', 'C6'], t, 0.16, 0.7, 0.045, null, 'sine');
      bell('C6', t + 1.05, 2.4, 0.045);
    },
    credits: function () {
      var t = ctx.currentTime;
      tone('sine', hz('A3'), t, 2.2, 0.028);
      bell('E4', t + 0.3, 1.8, 0.022);
    },
    toast: function () { tone('sine', 1180, ctx.currentTime, 0.06, 0.022); },
    toastRed: function () {
      var t = ctx.currentTime;
      tone('triangle', 760, t, 0.06, 0.03);
      tone('triangle', 560, t + 0.07, 0.1, 0.028);
    },
    save: function () {
      var t = ctx.currentTime;
      noise(t, 0.05, 0.02, 'highpass', 2800);
      seq(['G5', 'D6'], t + 0.04, 0.06, 0.1, 0.026, null, 'sine');
    },
    mute: function () {
      var t = ctx.currentTime;
      tone('square', 660, t, 0.05, 0.028);
      tone('square', 330, t + 0.055, 0.08, 0.028);
    },
    unmute: function () {
      var t = ctx.currentTime;
      tone('square', 330, t, 0.05, 0.028);
      tone('square', 660, t + 0.055, 0.08, 0.028);
    },
    skipOn: function () { seq(['G4', 'C5', 'E5'], ctx.currentTime, 0.035, 0.05, 0.032, null, 'square'); },
    skipOff: function () { seq(['E5', 'C5', 'G4'], ctx.currentTime, 0.035, 0.05, 0.032, null, 'square'); },
    menuOpen: function () {
      var t = ctx.currentTime;
      tone('triangle', 420, t, 0.09, 0.035, null, 700);
      tone('triangle', 700, t + 0.07, 0.12, 0.028, null, 1050);
    },
    windowDrag: function () { noise(ctx.currentTime, 0.04, 0.012, 'bandpass', 900); },
    shield: function () {
      var t = ctx.currentTime;
      bell('D5', t, 0.9, 0.035, null, 'triangle');
      bell('A5', t + 0.06, 0.7, 0.024, null, 'triangle');
    },
    heartbeat: function () {
      var t = ctx.currentTime;
      tone('sine', 62, t, 0.14, 0.06);
      tone('sine', 54, t + 0.2, 0.18, 0.045);
    },
  };

  // история звуков (для отладки: DVAudio.log())
  var HISTORY = [];

  function play(name, delay) {
    if (!name || CFG.muted || !RealCtx) return;
    if (HISTORY.length > 400) HISTORY.shift();
    HISTORY.push(name);
    var fn = function () {
      if (!SND[name] || !ctx || ctx.state !== 'running') return;
      try { SND[name](); } catch (e) {}
    };
    if (!ctx) {
      pending.push(fn);
      if (pending.length > 60) pending.shift();
      return;
    }
    if (!ready) return;
    if (delay) setTimeout(fn, delay);
    else fn();
  }

  // ── МУЗЫКА ─────────────────────────────────────────────────────────────────
  var music = (function () {
    var cur = null, timer = null, step = 0, out = null, token = 0, queuedTrack = null;

    var SCALE = {
      minor: [0, 2, 3, 5, 7, 8, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      major: [0, 2, 4, 5, 7, 9, 11],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
    };

    // bpm · тоника (MIDI) · лад · басовая фраза · арпеджио · «воздух» · ударные ·
    // аккордовая сетка (ступени лада) · мелодия
    var TRACKS = {
      boot: {
        bpm: 84, root: 45, scale: 'minor', bass: [0, 0, 0, 0, 5, 5, 3, 3],
        arp: 3, arpType: 'triangle', pad: 'sine', air: 0.55, drums: 0.1,
        chords: [0, 5, 3, 4], mel: [0, 4, 2, 0],
      },
      menu: {
        bpm: 96, root: 52, scale: 'dorian', bass: [0, 0, 7, 7, 5, 5, 3, 3],
        arp: 2, arpType: 'triangle', pad: 'sine', air: 0.9, drums: 0.26,
        chords: [0, 5, 3, 6], mel: [0, 2, 4, 2],
      },
      system: {
        bpm: 100, root: 55, scale: 'lydian', bass: [0, 7, 0, 5, 0, 7, 3, 5],
        arp: 2, arpType: 'sine', pad: 'triangle', air: 0.95, drums: 0.16,
        chords: [0, 4, 5, 3], mel: [0, 4, 6, 4],
      },
      protocol: {
        bpm: 116, root: 41, scale: 'phrygian', bass: [0, 0, 1, 1, 0, 0, 6, 1],
        arp: 4, arpType: 'sawtooth', pad: 'sawtooth', air: 0.35, drums: 0.55,
        chords: [0, 1, 0, 6],
      },
      mystery: {
        bpm: 72, root: 48, scale: 'minor', bass: [0, 3, 5, 3, 0, 3, 5, 7],
        arp: 3, arpType: 'sine', pad: 'sine', air: 0.75, drums: 0.05,
        chords: [0, 3, 5, 1], mel: [0, 2, 1, 0],
      },
      battle: {
        bpm: 148, root: 43, scale: 'phrygian', bass: [0, 0, 0, 1, 0, 0, 3, 1],
        arp: 4, arpType: 'square', pad: 'sawtooth', air: 0.3, drums: 0.8,
        chords: [0, 1, 5, 1],
      },
      finale: {
        bpm: 88, root: 50, scale: 'minor', bass: [0, 0, 5, 5, 3, 3, 7, 7],
        arp: 3, arpType: 'triangle', pad: 'sine', air: 1, drums: 0.2,
        chords: [0, 5, 6, 4], mel: [0, 2, 4, 6],
      },
      ending: {
        bpm: 76, root: 53, scale: 'major', bass: [0, 5, 7, 5, 0, 5, 3, 7],
        arp: 2, arpType: 'sine', pad: 'sine', air: 1, drums: 0.08,
        chords: [0, 4, 5, 3], mel: [0, 4, 2, 5],
      },
    };

    function bus() {
      if (out) return out;
      out = ctx.createGain();
      out.gain.value = 0.0008;
      out.connect(busMusic);
      return out;
    }

    // один «воздушный» голос пэда
    function padVoice(type, freq, t, attack, hold, gain, dst) {
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1500;
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0008, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t + attack);
      g.gain.exponentialRampToValueAtTime(0.0008, t + hold);
      o.connect(f); f.connect(g); g.connect(dst);
      o.start(t); o.stop(t + hold + 0.05);
    }

    function schedule() {
      var cfg = TRACKS[cur];
      if (!cfg) return;
      var mine = token;
      var dt = 60 / cfg.bpm / 4;                     // 1/16
      var t = ctx.currentTime + 0.04;
      var sc = SCALE[cfg.scale] || SCALE.minor;
      var dst = bus();
      var bar = Math.floor(step / 16);               // такт внутри 4-тактовой петли
      var chord = cfg.chords[bar % cfg.chords.length] || 0;

      // бас
      if (step % 4 === 0) {
        var bd = cfg.bass[(step / 4) % cfg.bass.length];
        tone('triangle', midi(cfg.root - 12 + bd), t, dt * 3.4, 0.075, dst);
      }

      // аккорд-пэд: трезвучие из лада на каждый такт
      if (step % 16 === 0) {
        [0, 2, 4].forEach(function (k, i) {
          var deg = sc[(chord + k) % sc.length];
          var n = midi(cfg.root + 12 + deg + (cfg.root + 12 + deg >= 84 ? -12 : 0));
          padVoice(cfg.pad, n, t, 0.35 + i * 0.04, dt * 15, 0.019 * cfg.air, dst);
        });
      }

      // арпеджио по текущему аккорду
      if (cfg.arp && step % cfg.arp === 0) {
        var ai = Math.floor(step / cfg.arp);
        var adeg = sc[(chord + (ai % 3) * 2) % sc.length];
        var oct = (ai % 8 === 6) ? 24 : 12;
        tone(cfg.arpType, midi(cfg.root + oct + adeg), t, dt * 1.7, 0.015, dst);
      }

      // мелодия — простая фраза на 2 такта (только у спокойных треков)
      if (cfg.mel && step % 32 === 0) {
        cfg.mel.forEach(function (k, i) {
          var deg2 = sc[(chord + k) % sc.length];
          tone('sine', midi(cfg.root + 24 + deg2), t + i * dt * 6, dt * 4.5, 0.014, dst);
        });
      }

      // ударные
      if (cfg.drums > 0) {
        if (step % 8 === 0) noise(t, 0.09, 0.05 * cfg.drums, 'lowpass', 160, dst);
        if (step % 8 === 4) noise(t, 0.055, 0.02 * cfg.drums, 'highpass', 4200, dst);
        if (step % 2 === 1) noise(t, 0.018, 0.007 * cfg.drums, 'highpass', 8000, dst);
      }

      step = (step + 1) % 64;
      timer = setTimeout(function () {
        if (mine !== token || !cur) return;
        schedule();
      }, dt * 1000);
    }

    return {
      tracks: Object.keys(TRACKS),
      get name() { return cur; },
      start: function (name, fade) {
        if (!TRACKS[name] || !RealCtx) return;
        if (!ctx) {
          if (queuedTrack) return;
          queuedTrack = name;
          pending.push(function () { var n = queuedTrack; queuedTrack = null; if (n) music.start(n, fade); });
          return;
        }
        if (cur === name && timer) return;
        cur = name;
        token += 1;
        step = 0;
        if (timer) clearTimeout(timer);
        var g = bus();
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setTargetAtTime(0.9, ctx.currentTime, Math.max(0.05, (fade || 900) / 3000));
        setTimeout(function () { if (cur === name) schedule(); }, Math.min(320, fade || 900));
      },
      stop: function (fade) {
        cur = null;
        token += 1;
        if (timer) clearTimeout(timer);
        timer = null;
        if (out && ctx) {
          out.gain.cancelScheduledValues(ctx.currentTime);
          out.gain.setTargetAtTime(0.0008, ctx.currentTime, Math.max(0.05, (fade || 700) / 3000));
        }
      },
      duck: function (on) {
        if (!out || !ctx) return;
        out.gain.setTargetAtTime(on ? 0.35 : 0.9, ctx.currentTime, 0.15);
      },
    };
  })();

  // ── ПЕРЕХВАТЫ ИГРЫ (всё здесь, файлы игры не трогаем) ──────────────────────
  var patched = false;

  function hookVoice(v) {
    if (!v) return;
    var wrap = function (fn, before, after) {
      if (typeof fn !== 'function') return fn;
      return function () {
        try { before && before.apply(this, arguments); } catch (e) {}
        var args = arguments, self = this;
        var r = fn.apply(self, args);
        if (r && typeof r.then === 'function') {
          return r.then(function (val) {
            try { after && after(val); } catch (e) {}
            return val;
          });
        }
        try { after && after(r); } catch (e) {}
        return r;
      };
    };

    // говорящий по имени окна
    var speakerOfTitle = function (title) {
      var t = String(title || '').toLowerCase();
      if (t.indexOf('протокол') >= 0 || t.indexOf('protocol') >= 0) return 'protocol';
      if (t.indexOf('страж') >= 0 || t.indexOf('guardian') >= 0) return 'guardian';
      if (t.indexOf('систем') >= 0 || t.indexOf('system') >= 0) return 'system';
      return 'unknown';
    };

    v.typewriter_window = (function (tw) {
      if (typeof tw !== 'function') return tw;
      return function (text, opts) {
        var who = speakerOfTitle(opts && opts.title);
        if (who === 'protocol') play('protocolSpeak');
        else if (who === 'guardian') play('guardianSpeak');
        else if (who === 'system') play('systemSpeak');
        else play('narrator');
        // «печать» идёт своим ритмом, пока текст набирается
        var tick = who === 'protocol' ? 'typeProto' : who === 'guardian' ? 'typeGuard' : 'type';
        var timer = setInterval(function () { play(tick); }, who === 'protocol' ? 110 : 78);
        var stop = function () { clearInterval(timer); };
        var r = tw.apply(this, arguments);
        if (r && typeof r.then === 'function') return r.then(function (v) { stop(); return v; }, function (e) { stop(); throw e; });
        stop();
        return r;
      };
    })(v.typewriter_window);

    // реплики Протокола и Стража — свои голоса
    v.protocol_window = wrap(v.protocol_window, function () { play('protocolSpeak'); }, null);
    v.glitch_message = wrap(v.glitch_message, function () { play('glitch'); }, null);
    v.fake_error_cascade = wrap(v.fake_error_cascade, function () { play('alarm'); }, null);
    v.dramatic_pause = wrap(v.dramatic_pause, function () {
      play('heartbeat');
      music.start('mystery', 600);
      music.duck(true);
    }, function () { music.duck(false); });

    v.ask_input = wrap(v.ask_input, function () { play('inputOpen'); }, function (val) {
      play(val && String(val).trim() ? 'inputSubmit' : 'inputEmpty');
    });
  }

  function attachChoiceSounds() {
    var host = document.querySelector('.dlg-choices.show');
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.choice'), function (b) {
      if (b.dataset.sndHooked) return;
      b.dataset.sndHooked = '1';
      b.addEventListener('pointerenter', function () { play('choiceHover'); });
      b.addEventListener('focus', function () { play('choiceHover'); });
    });
  }

  function hookIx(ix) {
    if (!ix || ix.__audioHooked) return;
    ix.__audioHooked = true;

    var choice = ix.choice_menu;
    ix.choice_menu = function () {
      var r = choice.apply(this, arguments);
      play('menuOpen');
      setTimeout(attachChoiceSounds, 30);
      setTimeout(attachChoiceSounds, 200);
      return r;
    };

    var timed = ix.timed_choice;
    ix.timed_choice = function (title, prompt, options, opts) {
      var limit = Number((opts && opts.timeout) || 10);
      play('timer');
      setTimeout(attachChoiceSounds, 30);
      var left = limit;
      var tick = setInterval(function () {
        left -= 1;
        if (left <= 0) { clearInterval(tick); return; }
        play(left <= 3 ? 'timerLow' : 'timer');
      }, 1000);
      var r = timed.apply(this, arguments);
      return r.then(function (val) {
        clearInterval(tick);
        if (!val) play('timeout');
        return val;
      });
    };

    var qte = ix.quick_time_event;
    ix.quick_time_event = function () {
      play('qteStart');
      var onKey = function (e) {
        if (e.key === 'Escape') { play('qteFail'); return; }
        var node = document.querySelector('.qkey.miss') || document.querySelector('.qkey:not(.hit)');
        var missed = !!document.querySelector('.qkey.miss');
        play(missed ? 'qteMiss' : 'qteHit');
      };
      document.addEventListener('keydown', onKey, true);
      var timer = setTimeout(function () {
        document.querySelectorAll('.qkey').forEach(function (k) {
          if (k.dataset.sndHooked) return;
          k.dataset.sndHooked = '1';
          var mo = new MutationObserver(function () {
            if (k.classList.contains('hit')) play('qteHit');
          });
          mo.observe(k, { attributes: true, attributeFilter: ['class'] });
        });
      }, 40);
      return qte.apply(this, arguments).then(function (ok) {
        clearTimeout(timer);
        document.removeEventListener('keydown', onKey, true);
        play(ok ? 'qteSuccess' : 'qteFail');
        return ok;
      });
    };

    var puzzle = ix.drag_and_drop_puzzle;
    ix.drag_and_drop_puzzle = function () {
      play('taskOpen');
      setTimeout(function () {
        document.querySelectorAll('.puzzle .chip').forEach(function (c) {
          if (c.dataset.sndHooked) return;
          c.dataset.sndHooked = '1';
          c.addEventListener('click', function () { play('puzzleTile'); });
        });
        document.querySelectorAll('.puzzle .slot').forEach(function (s) {
          if (s.dataset.sndHooked) return;
          s.dataset.sndHooked = '1';
          s.addEventListener('click', function () { play('puzzleSlot'); });
        });
      }, 60);
      return puzzle.apply(this, arguments).then(function (ok) {
        play(ok ? 'puzzleSolved' : 'puzzleFail');
        return ok;
      });
    };
  }

  function hookDesktop(d) {
    if (!d || d.__audioHooked) return;
    d.__audioHooked = true;
    var wrap = function (name, snd) {
      var fn = d[name];
      if (typeof fn !== 'function') return;
      d[name] = function () {
        play(snd);
        return fn.apply(this, arguments);
      };
    };
    wrap('open_browser', 'open');
    wrap('create_file_on_desktop', 'fileCreate');
    wrap('delete_file_on_desktop', 'fileDelete');
    wrap('shake_window', 'warning');
  }

  function hookFx(f) {
    if (!f || f.__audioHooked) return;
    f.__audioHooked = true;
    var ascii = f.ascii_art_window;
    if (typeof ascii === 'function') {
      f.ascii_art_window = function (text, opts) {
        var body = String(text || '');
        var title = String((opts && opts.title) || '');
        if (/КОНЕЦ|ФИНАЛ|КОНЦОВКА|ТИТР/i.test(title + body)) { play('ending'); music.start('ending', 900); }
        else if (/ГЛАВА/i.test(title)) { play('chapterEnd'); }
        else if (/ПРОТОКОЛ/i.test(title + body)) { play('shield'); }
        else play('open');
        return ascii.apply(this, arguments);
      };
    }
  }

  function hookSave(sm) {
    if (!sm) return;
    var targets = [sm];
    try { if (sm.constructor && sm.constructor.prototype) targets.push(sm.constructor.prototype); } catch (e) {}
    targets.forEach(function (obj) {
      if (obj.__audioHooked) return;
      obj.__audioHooked = true;
      var rel = obj.modify_relationship;
      if (typeof rel === 'function') {
        obj.modify_relationship = function () {
          var before = this.data ? this.data.relationship : 0;
          var out = rel.apply(this, arguments);
          var after = this.data ? this.data.relationship : 0;
          if (after > before) play('relationshipUp');
          else if (after < before) play('relationshipDown');
          return out;
        };
      }
      var pz = obj.puzzle_solved;
      if (typeof pz === 'function') {
        obj.puzzle_solved = function () {
          play('puzzleSolved');
          return pz.apply(this, arguments);
        };
      }
      var sv = obj.save;
      if (typeof sv === 'function' && !obj.__audioSaveHooked) {
        obj.__audioSaveHooked = true;
        obj.save = function () { play('save'); return sv.apply(this, arguments); };
      }
    });
  }

  function tryPatch() {
    var dv = window.__dv;
    if (!dv) return false;
    if (!patched) {
      patched = true;
      hookVoice(dv.voice);
      hookIx(dv.ix);
      hookDesktop(dv.desktop);
      hookFx(dv.fx);
      hookSave(dv.save);
      // внутренние функции звука движка — пусть «молчат», звук наш
      if (window.__dv.__setLegacySfxMuted) window.__dv.__setLegacySfxMuted(true);
    }
    return true;
  }

  // ── музыка по сюжету ───────────────────────────────────────────────────────
  var lastChapter = -1, lastScreen = '';
  var CHAPTER_TRACK = ['system', 'system', 'protocol', 'mystery', 'mystery', 'battle', 'finale'];

  function tick() {
    // флажок «Звук и эффекты» в родных настройках игры должен совпадать с нашим
    try {
      var dvRef = window.__dv;
      if (dvRef && dvRef.RT) dvRef.RT.sfx = !CFG.muted;
    } catch (e) {}
    if (!ctx || ctx.state !== 'running') return;
    var scr = document.body.dataset.screen || '';
    var dv = window.__dv;

    if (scr !== lastScreen) {
      lastScreen = scr;
      if (scr === 'title') {
        lastChapter = -1;
        if (music.name !== 'ending') music.start('menu', 1200);
      }
    }

    if (scr === 'game' && dv && dv.save) {
      hookSave(dv.save);
      var ch = Number(dv.save.data.chapter || 0);
      if (ch !== lastChapter) {
        var first = lastChapter < 0;
        lastChapter = ch;
        if (ch >= 6) music.start('ending', 1200);
        else {
          if (!first) play('chapterStart');
          music.start(CHAPTER_TRACK[ch] || 'system', 1400);
        }
      }
      // тревожные моменты: Протокол на сцене → другой трек
      var mode = document.querySelector('#stage.protocol-mode');
      if (mode && music.name !== 'battle' && ch >= 2) music.start('battle', 900);
      else if (!mode && ch === 5 && music.name === 'battle') music.start('finale', 1200);
    }

    if (scr === 'game' && !dv) music.start('system', 1000);

    // титры — отдельный трек
    if (document.querySelector('.credits, .credit-roll, .credits-roll') && music.name !== 'ending') {
      music.start('ending', 800);
    }
  }

  // стили панели живут прямо здесь же — файл остаётся единственным,
  // а index.html не нужно править вообще (кроме одной строки <script>)
  (function injectStyles() {
  var STYLE = [
    '/* ═══════════════════════════════════════════════════════════════════════════',
    '   DESKVENTURE: AI REMASTERED — стили звука (подключаются вместе с js/audio.js)',
    '   ═══════════════════════════════════════════════════════════════════════════ */',
    '',
    '/* кнопка звука в главном меню */',
    '#btn-audio-menu { letter-spacing: 1px; }',
    '',
    '#audio-btn { font-size: 12px; line-height: 1; }',
    '#audio-btn:hover { color: var(--green); }',
    '',
    '/* ── панель настроек звука ─────────────────────────────────────────────── */',
    '#audio-panel {',
    '  position: fixed;',
    '  right: 22px;',
    '  top: 64px;',
    '  z-index: 120;',
    '  width: 330px;',
    '  padding: 0 0 12px;',
    '  background: linear-gradient(180deg, #071a16, #04100d);',
    '  border: 2px solid var(--green-dark);',
    '  box-shadow: 0 0 0 2px #04100d, 0 10px 34px rgba(0, 0, 0, 0.7), 0 0 22px rgba(55, 224, 140, 0.12);',
    '  font-family: var(--font);',
    '  font-size: 12px;',
    '  color: var(--text);',
    '  animation: audio-panel-in 0.16s steps(3);',
    '}',
    '@keyframes audio-panel-in {',
    '  from { opacity: 0; transform: translateY(-6px); }',
    '  to { opacity: 1; transform: none; }',
    '}',
    '',
    '#audio-panel .ap-head {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  padding: 7px 10px;',
    '  font-size: 11px;',
    '  letter-spacing: 2px;',
    '  color: var(--green);',
    '  background: var(--green-deep);',
    '  border-bottom: 2px solid var(--green-dark);',
    '}',
    '#audio-panel .ap-x {',
    '  cursor: pointer;',
    '  color: var(--text-dim);',
    '  font-size: 15px;',
    '  line-height: 1;',
    '  padding: 0 4px;',
    '}',
    '#audio-panel .ap-x:hover { color: var(--red); }',
    '',
    '#audio-panel .ap-row {',
    '  display: grid;',
    '  grid-template-columns: 1fr 108px 34px;',
    '  align-items: center;',
    '  gap: 6px;',
    '  padding: 6px 10px 0;',
    '  color: var(--text-dim);',
    '}',
    '#audio-panel .ap-row b {',
    '  color: var(--green);',
    '  font-weight: normal;',
    '  font-size: 11px;',
    '  text-align: right;',
    '}',
    '#audio-panel .ap-row input[type="range"] {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  width: 100%;',
    '  height: 10px;',
    '  background: repeating-linear-gradient(90deg, var(--green-dark) 0 4px, transparent 4px 6px);',
    '  border: 1px solid var(--green-dark);',
    '  cursor: pointer;',
    '}',
    '#audio-panel .ap-row input[type="range"]::-webkit-slider-thumb {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  width: 10px;',
    '  height: 14px;',
    '  background: var(--green);',
    '  border: 0;',
    '  box-shadow: 0 0 8px rgba(55, 224, 140, 0.6);',
    '}',
    '#audio-panel .ap-row input[type="range"]::-moz-range-thumb {',
    '  width: 10px;',
    '  height: 14px;',
    '  background: var(--green);',
    '  border: 0;',
    '}',
    '#audio-panel .ap-check { grid-template-columns: 1fr auto; }',
    '#audio-panel .ap-check input { accent-color: var(--green); cursor: pointer; }',
    '',
    '#audio-panel .ap-sec {',
    '  padding: 10px 10px 4px;',
    '  font-size: 10px;',
    '  letter-spacing: 1px;',
    '  color: var(--text-dim);',
    '  text-transform: uppercase;',
    '  opacity: 0.8;',
    '}',
    '#audio-panel .ap-tracks {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 4px;',
    '  padding: 0 10px;',
    '}',
    '#audio-panel .ap-tr {',
    '  background: rgba(13, 58, 40, 0.6);',
    '  border: 1px solid var(--green-dark);',
    '  color: var(--text-dim);',
    '  font-family: var(--font);',
    '  font-size: 10px;',
    '  padding: 3px 6px;',
    '  cursor: pointer;',
    '}',
    '#audio-panel .ap-tr:hover { border-color: var(--green); color: var(--green); }',
    '#audio-panel .ap-tr.on {',
    '  background: var(--green);',
    '  color: var(--ink);',
    '  border-color: var(--green);',
    '}',
    '#audio-panel .ap-test {',
    '  margin: 8px 10px 0;',
    '  width: calc(100% - 20px);',
    '  font-size: 11px;',
    '}',
    '#audio-panel .ap-note {',
    '  padding: 8px 10px 0;',
    '  font-size: 10px;',
    '  color: var(--text-dim);',
    '  opacity: 0.65;',
    '  line-height: 1.5;',
    '}',
    '',
    '@media (max-width: 640px) {',
    '  #audio-panel { right: 8px; left: 8px; width: auto; top: 56px; }',
    '}',
    '',
  ].join('\n');

    try {
      if (!document.getElementById('dv-audio-style')) {
        var st = document.createElement('style');
        st.id = 'dv-audio-style';
        st.textContent = STYLE;
        (document.head || document.documentElement).appendChild(st);
      }
    } catch (e) {}
  })();

  // ── интерфейс: кнопка + панель ─────────────────────────────────────────────
  function icon() { return CFG.muted ? '🔇' : '🔊'; }

  function buildUI() {
    // кнопка в верхней панели игры
    var right = document.querySelector('.os-right');
    if (right && !document.getElementById('audio-btn')) {
      var b = document.createElement('button');
      b.className = 'os-btn';
      b.id = 'audio-btn';
      b.title = 'Звук и музыка (M)';
      b.textContent = icon();
      b.addEventListener('click', function (e) {
        // ловим до игры: панель не должна открывать меню или закрываться кликом по сцене
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        toggleMute();
      });
      right.insertBefore(b, right.firstChild);
    }

  }

  // галочка в окне «Настройки» + пункт «Звук и музыка» в меню игры
  function syncSettings() {
    var legacy = document.querySelector('.modal-content #set-sfx');
    if (legacy) {
      if (legacy.checked !== !CFG.muted) legacy.checked = !CFG.muted;
      if (!legacy.__sndHooked) {
        legacy.__sndHooked = '1';
        legacy.addEventListener('change', function (e) {
          CFG.muted = !e.target.checked;
          saveCfg();
          if (ctx) vol();
          play(CFG.muted ? 'mute' : 'unmute');
          refreshBtns();
        });
      }
    }
    // у окна «Настройки» дописываем кнопку открытия полной панели
    var host = legacy && legacy.closest('.set-row');
    if (host && !host.querySelector('.audio-set-btn')) {
      var open = document.createElement('button');
      open.className = 'btn audio-set-btn';
      open.style.marginTop = '8px';
      open.textContent = icon() + ' открыть настройки звука';
      open.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPanel();
      });
      host.appendChild(open);
    }
    // главное меню игры: пункт «Звук и музыка» рядом с «Об игре»
    var nav = document.querySelector('.menu-nav') ||
      (document.getElementById('btn-about') || {}).parentElement ||
      document.querySelector('.title-nav') ||
      document.querySelector('nav.menu');
    if (nav && !document.getElementById('btn-audio-menu')) {
      var mb = document.createElement('button');
      mb.className = 'menu-btn';
      mb.id = 'btn-audio-menu';
      mb.innerHTML = '<span class="b-key">▸</span><span class="t"> ' + icon() + ' Звук</span>';
      mb.addEventListener('click', function (e) {
        e.stopPropagation();
        openPanel();
      });
      nav.appendChild(mb);
    }
  }

  function refreshBtns() {
    var i = icon();
    var a = document.getElementById('audio-btn');
    if (a && a.textContent !== i) a.textContent = i;
    var m = document.getElementById('btn-audio-menu');
    if (m) {
      var label = i + ' Звук';
      var sp = m.querySelector('span.t');
      if (sp) { if (sp.textContent !== label) sp.textContent = label; }
    }
  }

  function toggleMute() {
    CFG.muted = !CFG.muted;
    saveCfg();
    if (ctx) vol();
    play(CFG.muted ? 'mute' : 'unmute');
    refreshBtns();
    try {
      if (window.__dv && window.__dv.RT) window.__dv.RT.sfx = !CFG.muted;
      var legacy = document.querySelector('.modal-content #set-sfx');
      if (legacy) legacy.checked = !CFG.muted;
      } catch (e) {}
  }

  function openPanel() {
    var old = document.getElementById('audio-panel');
    if (old) { old.remove(); return; }
    play('open');
    var box = document.createElement('div');
    box.id = 'audio-panel';
    box.innerHTML =
      '<div class="ap-head"><span>🎵 ЗВУК И МУЗЫКА</span><span class="ap-x">×</span></div>' +
      '<label class="ap-row"><span>общая громкость</span><input type="range" id="ap-master" min="0" max="1" step="0.05" value="' + CFG.master + '"><b></b></label>' +
      '<label class="ap-row"><span>эффекты</span><input type="range" id="ap-sfx" min="0" max="1" step="0.05" value="' + CFG.sfx + '"><b></b></label>' +
      '<label class="ap-row"><span>музыка</span><input type="range" id="ap-music" min="0" max="1" step="0.05" value="' + CFG.music + '"><b></b></label>' +
      '<label class="ap-row ap-check"><span>без звука (M)</span><input type="checkbox" id="ap-mute"' + (CFG.muted ? ' checked' : '') + '></label>' +
      '<div class="ap-sec">треки — нажми, чтобы послушать:</div>' +
      '<div class="ap-tracks">' + music.tracks.map(function (t) {
        return '<button class="ap-tr" data-track="' + t + '">' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="ap-sec">все эффекты по одному:</div>' +
      '<button class="btn ap-test" id="ap-test">▶ проиграть все звуки</button>' +
      '<div class="ap-note">звук собран кодом прямо в браузере — никаких внешних файлов</div>';
    document.body.appendChild(box);
    box.querySelector('.ap-x').addEventListener('click', function () { play('close'); box.remove(); });

    ['master', 'sfx', 'music'].forEach(function (kind) {
      var inp = box.querySelector('#ap-' + kind);
      var out = inp.parentElement.querySelector('b');
      out.textContent = Math.round(CFG[kind] * 100) + '%';
      inp.addEventListener('input', function () {
        CFG[kind] = Number(inp.value);
        out.textContent = Math.round(CFG[kind] * 100) + '%';
        saveCfg();
        if (ctx) vol();
      });
      inp.addEventListener('change', function () { play('click'); });
    });

    box.querySelector('#ap-mute').addEventListener('change', function (e) {
      CFG.muted = e.target.checked;
      saveCfg();
      if (ctx) vol();
      play(CFG.muted ? 'mute' : 'unmute');
      refreshBtns();
    });

    Array.prototype.forEach.call(box.querySelectorAll('.ap-tr'), function (b) {
      b.addEventListener('click', function () {
        var n = b.dataset.track;
        music.start(n, 300);
        play('click');
        Array.prototype.forEach.call(box.querySelectorAll('.ap-tr'), function (x) {
          x.classList.toggle('on', x === b);
        });
      });
    });

    box.querySelector('#ap-test').addEventListener('click', function () {
      var order = ['boot', 'logo', 'hover', 'click', 'back', 'open', 'close', 'toggle', 'tab',
        'type', 'advance', 'skipText', 'choiceHover', 'choicePick', 'correct', 'wrong', 'neutral',
        'timer', 'timerLow', 'timeout', 'inputOpen', 'keypress', 'inputSubmit', 'inputEmpty',
        'taskOpen', 'taskDone', 'fileCreate', 'fileRead', 'fileWrite', 'fileDelete',
        'folderCreate', 'folderOpen', 'clipboard', 'puzzleTile', 'puzzleSlot', 'puzzleReset',
        'puzzleSolved', 'puzzleFail', 'qteStart', 'qteHit', 'qteMiss', 'qteSuccess', 'qteFail',
        'guessCorrect', 'guessWrong', 'systemSpeak', 'protocolSpeak', 'guardianSpeak',
        'glitch', 'error', 'errorWindow', 'warning', 'alarm', 'relationshipUp',
        'relationshipDown', 'chapterStart', 'chapterEnd', 'achievement', 'ending', 'credits',
        'toast', 'toastRed', 'save', 'shield', 'heartbeat', 'menuOpen', 'skipOn', 'skipOff',
        'mute', 'unmute'];
      order.forEach(function (n, i) { play(n, i * 380); });
    });
  }

  // ── глобальные «уши»: любые действия игрока тоже звучат ────────────────────
  // Один обработчик + таблица правил: у каждого действия ровно ОДИН звук.
  var CLICKS = [
    ['.ex-new', 'fileCreate'],
    ['.ex-mk', 'folderCreate'],
    ['.ex-row', 'fileRead'],
    ['[data-reset]', 'puzzleReset'],
    ['[data-done]', 'taskDone'],
    ['[data-make]', 'fileCreate'],
    ['.chip', 'puzzleTile'],
    ['.slot', 'puzzleSlot'],
    ['.modal-head .x, .term-head .x, .ex-head .x, .ascii-head .x', 'close'],
    ['.dt-icon', 'folderOpen'],
    ['.os-btn:not(#audio-btn)', 'toggle'],
    ['.menu-btn', 'click'],
    ['.chap-row', 'click'],
    ['.dlg-choices .choice', 'choicePick'],
    ['.qp', 'choicePick'],
    ['.qte-tip', 'qteFail'],
    ['.btn, .choice', 'click'],
    ['.rel-bar, .end-row span', 'focus'],
    ['.dlg-hint', 'advance'],
    ['#stage', 'advance'],
  ];
  var ENTERS = '.menu-btn, .chap-row, .dlg-choices .choice, .btn, .os-btn:not(#audio-btn)';

  // «я ищу (я — лист)»: elementFromPoint гарантирует, что сработает ТОЛЬКО
  // самое глубокое правило, иначе клик по кнопке внутри #stage дал бы два звука
  function matchRule(target) {
    for (var i = 0; i < CLICKS.length; i++) {
      if (target.closest(CLICKS[i][0])) return CLICKS[i][1];
    }
    return null;
  }

  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#audio-panel') || t.closest('#audio-btn')) return;
      var deep = t;
      if (typeof t.getBoundingClientRect === 'function' && document.elementFromPoint) {
        try {
          var r = t.getBoundingClientRect();
          if (r && r.width && r.height) {
            var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            if (top) deep = top;
          }
        } catch (err) {}
      }
      var snd = matchRule(deep) || matchRule(t);
      if (snd) play(snd);
    }, true);

    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (!t.closest(ENTERS)) return;
      var last = t.closest(ENTERS);
      if (last.__sndOn) return;
      last.__sndOn = true;
      setTimeout(function () { last.__sndOn = false; }, 400);
      play(last.closest('.dlg-choices') ? 'choiceHover' : 'hover');
    }, true);

    // поле ввода: стук клавиш и отправка
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && /INPUT|TEXTAREA/.test(t.tagName || '')) {
        if (e.key === 'Enter') play('inputSubmit');
        else if (e.key.length === 1 || e.key === 'Backspace') play('keypress');
        return;
      }
      if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey) { toggleMute(); return; }
      else if (e.code === 'Escape') play('back');
      else if (e.code === 'Tab') play('focus');
      else if (e.code === 'Space' || e.code === 'Enter') play('advance');
      else if (/^Digit[1-9]$/.test(e.code) &&
               document.querySelector('.dlg-choices.show')) play('choiceHover');
    }, true);

    // новые варианты выбора / пазл / окна / уведомления.
    // Специально НЕ MutationObserver: в «печатной машинке» текст меняется
    // десятки раз в секунду, и наблюдение за деревом дорого стоит.
    // Дешёвый опрос раз в 250 мс — и никаких лишних тормозов в игре.
    window.__dvAudioScan = function () {
      attachChoiceSounds();
      var pz = document.querySelector('.puzzle');
      if (pz && pz.dataset.sndHooked !== '1') {
        pz.dataset.sndHooked = '1';
        pz.querySelectorAll('.chip').forEach(function (c) {
          c.addEventListener('click', function () { play('puzzleTile'); });
        });
        pz.querySelectorAll('.slot').forEach(function (s) {
          s.addEventListener('click', function () { play('puzzleSlot'); });
        });
      }
      var modal = document.querySelector('.modal-back, .explorer, .termwin');
      if (modal && modal.dataset.sndSeen !== '1') {
        modal.dataset.sndSeen = '1';
        play(modal.classList.contains('termwin') ? 'taskOpen' : 'open');
      }
      var toasts = document.querySelectorAll('#toasts .toast');
      for (var ti = 0; ti < toasts.length; ti++) {
        var tn = toasts[ti];
        if (tn.dataset.sndSeen === '1') continue;
        tn.dataset.sndSeen = '1';
        var text = (tn.textContent || '').toLowerCase();
        var snd = 'toast';
        if (tn.classList.contains('red')) snd = 'toastRed';
        else if (/головоломк|решена|решён/.test(text)) snd = 'puzzleSolved';
        else if (/файл создан|папка создана/.test(text)) snd = 'fileCreate';
        else if (/файл удал/.test(text)) snd = 'fileDelete';
        else if (/концовк|финал/.test(text)) snd = 'ending';
        else if (/головоломок|достижен|получено/.test(text)) snd = 'achievement';
        play(snd);
      }
      var ascii = document.querySelector('.ascii-back');
      if (ascii && ascii.dataset.sndSeen !== '1') {
        ascii.dataset.sndSeen = '1';
        play('credits');
      }
    };
  }

  // ── запуск ─────────────────────────────────────────────────────────────────
  function boot() {
    buildUI();
    bindGlobal();
    // как только появится игра — цепляемся
    var tries = 0;
    var wait = setInterval(function () {
      if (tryPatch() || ++tries > 120) clearInterval(wait);
      buildUI();
    }, 250);
    // музыка играет сразу, но «просыпается» после первого клика
    pending.push(function () { play('boot'); });
    pending.push(function () { music.start(document.body.dataset.screen === 'game' ? 'system' : 'menu', 500); });
    setInterval(tick, 1000);
    // кнопки в интерфейсе нужны сразу, даже до первого клика (и без WebAudio)
    setInterval(function () {
      try { buildUI(); syncSettings(); } catch (e) {}
    }, 600);
    // звуковая часть опроса — только когда аудио уже живо
    setInterval(function () {
      if (!ctx) return;
      try { window.__dvAudioScan && window.__dvAudioScan(); } catch (e) {}
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // публичный доступ (консоль / тесты)
  window.DVAudio = {
    play: play,
    music: music,
    cfg: CFG,
    mute: function (v) { CFG.muted = !!v; saveCfg(); if (ctx) vol(); refreshBtns(); },
    openPanel: openPanel,
    sounds: function () { return Object.keys(SND); },
    log: function () { return HISTORY.slice(); },
    isReady: function () { return !!ctx && ctx.state === 'running'; },
  };
})();
