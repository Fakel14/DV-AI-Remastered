// ═══════════════════════════════════════════════════════════════════════════════
// DESKVENTURE: AI REMASTERED — runtime
// Мост между транспилированным сценарием и браузером:
// виртуальная файловая система, тайминги, «буфер обмена», помощники.
// ═══════════════════════════════════════════════════════════════════════════════

// ── глобальное состояние движка ───────────────────────────────────────────────
export const RT = {
  speed: 0.5,          // wall-секунд на одну «сценарную» секунду
  fast: false,         // режим «пропуск»: реплики летят
  fx: true,            // эффекты/звук
  sfx: true,
  busy: false,
  listeners: {},
};

export function emit(name, payload) {
  (RT.listeners[name] || []).forEach((fn) => fn(payload));
}
export function on(name, fn) {
  (RT.listeners[name] = RT.listeners[name] || []).push(fn);
}
export function off(name, fn) {
  RT.listeners[name] = (RT.listeners[name] || []).filter((f) => f !== fn);
}

const T0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
function realNow() {
  return ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - T0) / 1000;
}

// ── виртуальное время и сон ──────────────────────────────────────────────────
export function virtualNow() {
  return realNow() / Math.max(0.02, RT.speed);
}

export function sleep(sec) {
  const s = Number(sec) || 0;
  if (RT.fast) return new Promise((r) => setTimeout(r, 25));
  const ms = Math.min(8000, Math.max(0, s * 1000 * RT.speed));
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve();
    };
    const t = setTimeout(finish, ms);
    // «пропуск» на лету
    const key = 'wake';
    if (!RT.listeners[key]) RT.listeners[key] = [];
    const prev = RT.listeners[key];
    RT.listeners[key] = prev.concat([finish]);
    setTimeout(() => {
      RT.listeners[key] = RT.listeners[key].filter((f) => f !== finish);
    }, ms + 50);
  });
}

export function wakeAll() {
  (RT.listeners['wake'] || []).forEach((fn) => fn());
  RT.listeners['wake'] = [];
}

export const time = { time: virtualNow, sleep };

// ── случайность ──────────────────────────────────────────────────────────────
export const RNG = {
  randint(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  },
  choice(arr) {
    if (!arr || !arr.length) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  },
  random() {
    return Math.random();
  },
};

// ── виртуальная файловая система ─────────────────────────────────────────────
export const DESKTOP_PATH = '/Рабочий стол';
export const DESKTOP = DESKTOP_PATH;
const FS = {
  files: new Map(), // путь -> содержимое
  dirs: new Set(['/', DESKTOP]),
  order: [],
};

export function resetFS() {
  FS.files.clear();
  FS.dirs = new Set(['/', DESKTOP]);
  FS.order = [];
  emit('fs', null);
}

export function joinPath(...parts) {
  const out = [];
  parts.forEach((p) => {
    if (p === undefined || p === null) return;
    const s = String(p);
    if (!s) return;
    out.push(s);
  });
  let path = out.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
  if (path.length > 1) path = path.replace(/\/$/, '');
  return path;
}

export function PATH_EXISTS(p) {
  const path = joinPath(p);
  return FS.files.has(path) || FS.dirs.has(path);
}

export function MKDIRS(p) {
  let path = joinPath(p);
  const parts = path.split('/').filter(Boolean);
  let cur = '';
  FS.dirs.add('/');
  for (const part of parts) {
    cur += '/' + part;
    FS.dirs.add(cur);
  }
  emit('fs', null);
}

export function WRITE_FILE(p, content) {
  const path = joinPath(p);
  const isNew = !FS.files.has(path);
  FS.files.set(path, content == null ? '' : String(content));
  if (isNew) FS.order.push(path);
  emit('fs', { path, created: isNew, content: FS.files.get(path) });
}

// объект-файл (для конструкции `with open(path) as f: f.read()`)
if (typeof String.prototype.read !== 'function') {
  // no-op: используем FileHandle ниже
}
export class FileHandle {
  constructor(path, text) {
    this.path = path;
    this.text = text;
  }
  read() {
    return this.text;
  }
  write(content) {
    WRITE_FILE(this.path, content);
    return content;
  }
}

export function READ_FILE(p) {
  const path = joinPath(p);
  if (!FS.files.has(path)) return null;
  return FS.files.get(path);
}

export function DELETE_FILE(p) {
  const path = joinPath(p);
  const had = FS.files.delete(path) || FS.dirs.delete(path);
  FS.order = FS.order.filter((f) => f !== path);
  if (had) emit('fs', { path, deleted: true });
}

export function DELETE_PATH(p) {
  const path = joinPath(p);
  // удаляем файлы внутри
  Array.from(FS.files.keys()).forEach((f) => {
    if (f === path || f.startsWith(path + '/')) {
      FS.files.delete(f);
      FS.order = FS.order.filter((x) => x !== f);
    }
  });
  Array.from(FS.dirs).forEach((d) => {
    if (d === path || d.startsWith(path + '/')) FS.dirs.delete(d);
  });
  emit('fs', { path, deleted: true });
}

export function LIST_DIR(p) {
  const base = joinPath(p);
  const out = [];
  FS.files.forEach((content, path) => {
    if (path.startsWith(base + '/')) {
      const rel = path.slice(base.length + 1);
      out.push({ path, name: rel.split('/')[0], type: 'file', content });
    }
  });
  FS.dirs.forEach((path) => {
    if (path !== base && path.startsWith(base + '/')) {
      const rel = path.slice(base.length + 1);
      out.push({ path, name: rel.split('/')[0], type: 'dir' });
    }
  });
  // уникальные имена
  const seen = new Set();
  return out.filter((i) => (seen.has(i.name) ? false : seen.add(i.name)));
}

export function allFiles() {
  return Array.from(FS.files.entries()).map(([path, content]) => ({ path, name: path.split('/').pop(), content }));
}

// ── помощники, которых ждёт транспилированный код ────────────────────────────
export function SLICE(x, a, b) {
  const s = x == null ? '' : x;
  return s.slice(a || 0, b === undefined || b === null || b === '' ? undefined : b);
}
export function IN(item, container) {
  if (container == null) return false;
  if (typeof container === 'string') return container.indexOf(item) !== -1;
  if (Array.isArray(container)) return container.indexOf(item) !== -1;
  if (container instanceof Set) return container.has(item);
  if (container instanceof Map) return container.has(item);
  if (typeof container === 'object') return item in container;
  return false;
}
export const ANY = (arr) => (arr || []).some(Boolean);
export const ALL = (arr) => (arr || []).every(Boolean);
export const SUM = (arr) => (arr || []).reduce((a, b) => a + Number(b || 0), 0);
export const LEN = (x) => (x == null ? 0 : x.length !== undefined ? x.length : Object.keys(x).length);
export const RANGE = (a, b, c) => {
  const out = [];
  if (b === undefined) {
    for (let i = 0; i < a; i++) out.push(i);
  } else {
    const step = c === undefined ? 1 : c;
    if (step > 0) for (let i = a; i < b; i += step) out.push(i);
    else for (let i = a; i > b; i += step) out.push(i);
  }
  return out;
};
export const GET = (obj, key, dflt) => {
  if (obj == null) return dflt;
  if (Array.isArray(obj)) {
    // список пар [[k, v], ...]
    const hit = obj.find((p) => Array.isArray(p) && p[0] === key);
    return hit ? hit[1] : dflt;
  }
  if (typeof obj.get === 'function') {
    const v = obj.get(key);
    return v === undefined ? dflt : v;
  }
  const v = obj[key];
  return v === undefined ? dflt : v;
};
export const ITEMS = (obj) => {
  if (obj == null) return [];
  if (Array.isArray(obj)) return obj.slice();
  if (obj instanceof Map) return Array.from(obj.entries());
  return Object.entries(obj);
};
// Python: str * n и n * str
export const MUL = (a, b) => {
  if (typeof a === 'string' && typeof b === 'number') return b > 0 ? a.repeat(Math.floor(b)) : '';
  if (typeof b === 'string' && typeof a === 'number') return a > 0 ? b.repeat(Math.floor(a)) : '';
  return a * b;
};

export const PAD = (str, len, align) => {
  const s = String(str == null ? '' : str);
  const n = Math.max(0, Number(len) || 0);
  if (s.length >= n) return s;
  const pad = n - s.length;
  if (align === 'right') return ' '.repeat(pad) + s;
  if (align === 'left') return s + ' '.repeat(pad);
  const l = Math.floor(pad / 2);
  return ' '.repeat(l) + s + ' '.repeat(pad - l);
};
// Python str.center(): нечётный остаток уходит вправо
export const PAD2 = (str, len) => {
  const s = String(str == null ? '' : str);
  const n = Math.max(0, Number(len) || 0);
  if (s.length >= n) return s;
  const pad = n - s.length;
  const l = Math.floor(pad / 2);
  return ' '.repeat(l) + s + ' '.repeat(pad - l);
};
export const CAPITALIZE = (s) => {
  const str = String(s == null ? '' : s);
  return str ? str[0].toUpperCase() + str.slice(1) : '';
};
const PRINTABLE_RE = /^[^\x00-\x1f\x7f]*$/;
export const ISPRINTABLE = (s) => PRINTABLE_RE.test(String(s == null ? '' : s));
export const ISALPHA = (s) => /[A-Za-z\u0400-\u04FF]/.test(String(s == null ? '' : s));

// ── «буфер обмена» в браузере ────────────────────────────────────────────────
const clip = { text: '', last: '' };

export function clipboardSet(text) {
  clip.text = text == null ? '' : String(text);
  emit('clipboard', clip.text);
}

export class ClipboardWatcher {
  get_clipboard() {
    return clip.text;
  }
  static set(text) {
    clipboardSet(text);
  }
}

// асинхронные обёртки, чтобы сценарий мог вызывать без await
export function ensureDir(p) { MKDIRS(p); return true; }

export async function clipboardRead() {
  try {
    const txt = await navigator.clipboard.readText();
    if (txt) {
      clipboardSet(txt);
      return txt;
    }
  } catch (e) {
    /* браузер запретил — попросим игрока вставить вручную */
  }
  return clip.text;
}

// ── титры (подключаются из screens.js) ───────────────────────────────────────
export let endCreditsHandler = null;
export function registerCreditsHandler(fn) {
  endCreditsHandler = fn;
}
export async function showEndCredits(name) {
  if (endCreditsHandler) await endCreditsHandler(name);
  else await sleep(1);
}

// ── подпись urlencode вместо urllib.parse.quote ──────────────────────────────
export function quote(s) {
  return encodeURIComponent(String(s == null ? '' : s));
}

// ── Python-совместимые методы строк (страховка) ─────────────────────────────
if (typeof String !== 'undefined') {
  const def = (name, fn) => { if (!String.prototype[name]) Object.defineProperty(String.prototype, name, { value: fn, writable: true, configurable: true }); };
  def('strip', function () { return this.trim(); });
  def('lstrip', function () { return this.trimStart(); });
  def('rstrip', function () { return this.trimEnd(); });
  def('upper', function () { return this.toUpperCase(); });
  def('lower', function () { return this.toLowerCase(); });
  def('capitalize', function () { return this.length ? this[0].toUpperCase() + this.slice(1).toLowerCase() : this; });
  def('isprintable', function () { return /^[^\x00-\x1f\x7f]*$/.test(this); });
  def('isalpha', function () { return /[A-Za-z\u0400-\u04FF]/.test(this); });
  def('title', function () { return this.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); });
}
