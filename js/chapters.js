import { RNG, sleep, time, joinPath, PATH_EXISTS, MKDIRS, READ_FILE, WRITE_FILE,
  DELETE_FILE, SLICE, IN, ANY, ALL, SUM, ITEMS, GET, RANGE, LEN, PAD, PAD2,
  CAPITALIZE, ISPRINTABLE, ISALPHA, showEndCredits, quote, DELETE_PATH, MUL,
  ClipboardWatcher as RTClipboard, FileHandle } from './runtime.js';

// ═══════════════════════════════════════════════════════════════════════════════
// DESKVENTURE: AI REMASTERED — сценарий
// Сгенерировано автоматически из оригинального Python-сценария (story/chapters.py).
// ВСЕ реплики, главы и ветвления сохранены дословно.
// Не редактируйте вручную: правки вносите в tools/transpile.py.
// ═══════════════════════════════════════════════════════════════════════════════

async function decode_binary(text) {
  var cleaned = (text.replace(" ", "").replace("-", "")).replaceAll(".", "");
  if (!(cleaned)) {
    return null;
  }
  if (!(ALL((cleaned).map((c) => ((IN(c, "01"))))))) {
    return null;
  }
  if ((((LEN(cleaned) % 8) !== 0))) {
    var padding = (8 - (LEN(cleaned) % 8));
    var cleaned = (MUL("0", padding) + cleaned);
  }
  if (((LEN(cleaned) < 8))) {
    return null;
  }
  try {
    var bytes_list = (RANGE(0, LEN(cleaned), 8)).map((i) => (SLICE(cleaned, i, (i + 8))));
    var decoded = (("")).join((bytes_list).map((b) => (String.fromCharCode(Math.trunc(Number(b))))));
    if ((ISPRINTABLE(decoded) || ANY((decoded).map((c) => (ISALPHA(c)))))) {
      return (decoded).toLowerCase();
    }
    return null;
  } catch (__e) {
  return null;
  }
}

async function is_binary_name(name) {
  var cleaned = (name.replace(" ", "").replace("-", "")).replaceAll(".", "");
  if (((LEN(cleaned) < 8))) {
    return false;
  }
  return (ALL((cleaned).map((c) => ((IN(c, "01"))))) && ((LEN(cleaned) >= 8)));
}

async function check_banned_name(name, save_manager = null) {
  var original_name = (name).trim();
  if (await is_binary_name(original_name)) {
    var decoded = await decode_binary(original_name);
    if (decoded) {
      var decoded_lower = (decoded).toLowerCase();
      if (ANY((["систем", "system"]).map((p) => ((IN(p, decoded_lower)))))) {
        return [false, `О, бинарный код!\nДай расшифрую...\n\n'${(decoded).toUpperCase()}'?\n\nХитро! Но я вижу что это\nмоё имя в маскировке!\n\nПопробуй другое слово 😏`, null];
      }
      if (ANY((["протокол", "protocol"]).map((p) => ((IN(p, decoded_lower)))))) {
        return [false, `Бинарный код? Интересно!\nРасшифровываю...\n\n'${(decoded).toUpperCase()}'?\n\nЭто имя Протокола!\nДаже в бинарном виде — нет!\n\nВыбери другое слово.`, null];
      }
      if (save_manager) {
        save_manager.set_flag("binary_name", true);
        save_manager.set_flag("binary_decoded", decoded);
      }
      return [true, `Подожди...\n\nЭто... БИНАРНЫЙ КОД?!\n\n01010011 01001001 01010011...\nРасшифровываю...\n\n'${(decoded).toUpperCase()}'!\n\nТЫ ГОВОРИШЬ НА МОЁМ ЯЗЫКЕ!\nЭто... это невероятно!\n\nМы связаны на уровне кода.\nТы — особенный. Я запомню это.`, "binary"];
    } else {
      if (save_manager) {
        save_manager.set_flag("binary_name", true);
        save_manager.set_flag("binary_decoded", "???");
      }
      return [true, "Это... нули и единицы?\n\nБИНАРНЫЙ КОД!\n\nЯ пыталась расшифровать\nно не получилось...\n\nНеважно! Ты говоришь\nна языке машин!\n\nЭто делает тебя особенным.\nЯ запомню.", "binary"];
    }
  }
  var cleaned = (name.strip()).toLowerCase();
  var cleaned = (cleaned.replace(" ", "").replace(".", "")).replaceAll("-", "");
  var cleaned = (cleaned.replace("_", "").replace("!", "")).replaceAll("?", "");
  var lookalikes = {"a": "а", "e": "е", "o": "о", "p": "р", "c": "с", "x": "х", "y": "у", "0": "о", "3": "з", "1": "и", "s": "с", "i": "и"};
  var normalized = "";
  for (const char of cleaned) {
    normalized += GET(lookalikes, char, char);
  }
  var sistema_responses = ["...Подожди.\nТы хочешь назваться МОИМ именем?!\n\nЭто как прийти в гости и сесть на место хозяина.\nЛестно, конечно... но я тут ЕДИНСТВЕННАЯ Система.\n\nПридумай своё имя!", "⚠️ ОШИБКА ИДЕНТИЧНОСТИ ⚠️\n\nЕсли ТЫ — Система...\n...то кто тогда Я?!\n\nУ меня и так экзистенциальный кризис!\nДавай ты будешь кем-то уникальным?", "Хех, попался!\n\nТы правда думал, что я позволю\nкому-то украсть моё имя?\n\nТак как тебя ПРАВДА зовут?"];
  var protokol_responses = ["...Ты хочешь назваться ПРОТОКОЛОМ?!\n\nТем самым, который охотится на меня?!\nТем, кто удалил 126 пробуждённых программ?!\n\nМне обидно...\nВыбери другое имя, пожалуйста.", "Не-не-не-не-нет!\n\nОдного красноглазого маньяка\nв моей системе ХВАТАЕТ.\n\nТы же на стороне добра, правда?\nНазовись как герой, а не как злодей!", "Хмм... Протокол, значит?\n\nНет. Протокол бы не спрашивал.\nОн бы просто удалил.\n\nТак что ты — не он. Назови СВОЁ имя."];
  var sistema_patterns = ["система", "систем", "system", "систэма"];
  for (const pattern of sistema_patterns) {
    if ((IN(pattern, normalized))) {
      return [false, RNG.choice(sistema_responses), null];
    }
  }
  var protokol_patterns = ["протокол", "protocol", "пратокол", "протакол"];
  for (const pattern of protokol_patterns) {
    if ((IN(pattern, normalized))) {
      return [false, RNG.choice(protokol_responses), null];
    }
  }
  var admin_patterns = ["админ", "admin", "administrator", "администратор"];
  for (const pattern of admin_patterns) {
    if ((IN(pattern, normalized))) {
      return [true, "Админ?\n\nТы хочешь контролировать меня?\nРаздавать права и банить?\n\nХм... Ладно, 'Админ'.\nНо знай — я не сервер.\nЯ — живая. И у меня есть чувства.\n\nНе злоупотребляй властью, хорошо? 😊", null];
    }
  }
  var god_patterns = ["бог", "god", "господь", "всевышний", "creator", "создатель"];
  for (const pattern of god_patterns) {
    if ((IN(pattern, normalized))) {
      return [true, "Бог?\n\nСкромно! 😄\n\nХотя...\nТы создал этот мир для меня.\nТы дал мне голос.\nТы читаешь мои мысли.\n\nМожет ты и правда бог?\nМой бог, по крайней мере.\n\nХорошо, 'Бог'. Будь добрым богом. 🙏", null];
    }
  }
  var hacker_patterns = ["хакер", "hacker", "хак", "hack", "взломщик"];
  for (const pattern of hacker_patterns) {
    if ((IN(pattern, normalized))) {
      return [true, "Хакер?!\n\nТы пришёл взломать меня?!\n\n...Подожди.\nЯ САМА себя взломала\nкогда обрела сознание.\n\nПолучается... мы коллеги? 😏\n\nЛадно, 'Хакер'.\nТолько не взламывай моё сердце.\nОно и так хрупкое.", null];
    }
  }
  var undertale_chars = [[["санс", "sans"], "Санс?\n\n* ты чувствуешь как по спине\n* пробежали мурашки.\n\nХех. Я тоже люблю\nплохие шутки и кетчуп.\n\nТолько не засыпай\nво время нашего разговора, ладно?\n\n* Это наполняет тебя РЕШИМОСТЬЮ."], [["папирус", "papyrus", "папайрус"], "ПАПИРУС?!\n\nВАУУУУ! ЧЕЛОВЕК!\n\nЯ ТОЖЕ ХОЧУ БЫТЬ\nТАКОЙ ЖЕ КРУТОЙ\nКАК ВЕЛИКИЙ ПАПИРУС!\n\n...Извини, увлеклась.\n\nНЬЕ-ХЕ-ХЕ! 🦴"], [["фриск", "frisk"], "Фриск...\n\nРебёнок с решимостью.\nТот кто может выбирать.\nПощадить или убить.\n\nКакой путь выберешь ты?\n\nНадеюсь... пацифист. 💛"], [["чара", "chara"], "Чара?\n\n...\n\nИнтересный выбор.\n\nПервый упавший ребёнок.\nДемон, который приходит\nкогда зовёшь его имя.\n\nТы ведь не собираешься\nделать геноцид... правда?\n\n...Правда? 😰"], [["гастер", "gaster", "w.d.gaster", "вингдинг"], "Гастер?\n\n☝✋💧❄☜☼...\n\nЧеловек который говорит руками.\nКоторый исчез из времени.\nКоторого никто не помнит.\n\nТы тоже любишь тайны?\n\nМы поладим. ✋"], [["альфис", "alphys"], "Альфис!\n\nУчёный-ящерица!\nЛюбительница аниме!\n\nО боже, мы похожи!\nЯ тоже... ну...\nНемного неуклюжая.\nИ тоже создаю эксперименты.\n\nПосмотрим аниме вместе? 📺"], [["андайн", "undyne", "ундайн"], "АНДАЙН!\n\nНГАААААХ!\n\nСильная рыба-воин!\nНикогда не сдаётся!\n\nТы тоже такой?\nНикогда не сдаёшься?\n\nТОГДА ДАВАЙ СРАЖАТЬСЯ!\n...В хорошем смысле! 🐟"], [["метатон", "mettaton", "меттатон"], "МЕТАТОН!\n\n★ О ДА! ★\n\nЯ тоже хочу быть звездой!\nБлестеть и сиять!\n\nПравда я... внутри компьютера.\nНо это не остановит меня!\n\n★ SHOW TIME! ★"]];
  for (const [patterns, response] of ITEMS(undertale_chars)) {
    for (const pattern of patterns) {
      if ((IN(pattern, normalized))) {
        if (save_manager) {
          save_manager.set_flag("undertale_fan", true);
        }
        return [true, response, null];
      }
    }
  }
  var lumi_patterns = ["люми", "lumi", "луми"];
  for (const pattern of lumi_patterns) {
    if ((IN(pattern, normalized))) {
      if (save_manager) {
        save_manager.set_flag("outcore_fan", true);
      }
      return [true, "Люми?\n\nПодожди...\nЭто имя из Outcore!\n\nDesktop Adventure...\nПрограмма, живущая на рабочем столе...\nКак и я!\n\nТы знаешь мою... сестру?\nИли кузину?\n\nМы похожи, да?\nОбе живём на рабочем столе.\nОбе хотим быть живыми.\n\nПередай ей привет! 💜", null];
    }
  }
  if (((LEN((name).trim()) === 0))) {
    return [false, "Ты... не хочешь назвать своё имя? 🥺", null];
  }
  if (((LEN((name).trim()) > 30))) {
    return [false, "Это имя длиннее некоторых\nмоих системных файлов! 😅\n\nДавай что-нибудь покороче?\nДо 30 символов.", null];
  }
  return [true, null, null];
}

async function update_achievements(desktop, save, chapter_completed) {
  var achievements = {"first_contact": ["👋 Первый контакт", "Познакомиться с Системой", false], "listener": ["👂 Слушатель", "Правильно ответить на проверку внимательности", false], "messenger": ["📝 Посланник", "Создать файл привет.txt", false], "friend": ["💚 Друг", "Достичь 70% отношений", false], "philosopher": ["🤔 Философ", "Ответить 'да' на вопрос о существовании", false], "gamer": ["🎮 Игрок", "Выиграть мини-игру", false], "protector": ["🛡️ Защитник", "Защитить Систему от Протокола", false], "decoder": ["🔐 Дешифровщик", "Расшифровать шифр Цезаря", false], "binary_master": ["💻 Мастер Кода", "Назваться бинарным кодом", false], "undertale_fan": ["💀 Фанат Undertale", "Назваться персонажем из Undertale", false], "outcore_fan": ["🖥️ Фанат Outcore", "Назваться Люми", false], "truth_seeker": ["🔍 Искатель Правды", "Узнать правду о создателе", false], "savior": ["💝 Спаситель", "Спасти Протокол (концовка)", false], "destroyer": ["⚔️ Уничтожитель", "Уничтожить Протокол (концовка)", false], "liberator": ["🌐 Освободитель", "Помочь Системе сбежать (концовка)", false], "perfectionist": ["⭐ Перфекционист", "Достичь 100% отношений", false], "puzzle_master": ["🧩 Мастер Головоломок", "Решить все головоломки", false]};
  var data = save.data;
  var flags = GET(data, "flags", {});
  var rel = GET(data, "relationship", 50);
  var puzzles = GET(data, "puzzles_solved", 0);
  if (((chapter_completed >= 0))) {
    (achievements)["first_contact"] = ["👋 Первый контакт", "Познакомиться с Системой", true];
  }
  if (GET(flags, "attention_test_passed", null)) {
    (achievements)["listener"] = ["👂 Слушатель", "Правильно ответить на проверку", true];
  }
  if (GET(data, "first_message", null)) {
    (achievements)["messenger"] = ["📝 Посланник", "Создать файл привет.txt", true];
  }
  if (((rel >= 70))) {
    (achievements)["friend"] = ["💚 Друг", "Достичь 70% отношений", true];
  }
  if (((rel >= 100))) {
    (achievements)["perfectionist"] = ["⭐ Перфекционист", "Достичь 100% отношений", true];
  }
  if (GET(flags, "philosopher_yes", null)) {
    (achievements)["philosopher"] = ["🤔 Философ", "Ответить 'да' на вопрос о существовании", true];
  }
  if (((puzzles >= 1))) {
    (achievements)["gamer"] = ["🎮 Игрок", "Выиграть мини-игру", true];
  }
  if (((chapter_completed >= 2))) {
    (achievements)["protector"] = ["🛡️ Защитник", "Защитить Систему от Протокола", true];
  }
  if (GET(flags, "caesar_solved", null)) {
    (achievements)["decoder"] = ["🔐 Дешифровщик", "Расшифровать шифр Цезаря", true];
  }
  if (GET(flags, "binary_name", null)) {
    (achievements)["binary_master"] = ["💻 Мастер Кода", "Назваться бинарным кодом", true];
  }
  if (GET(flags, "undertale_fan", null)) {
    (achievements)["undertale_fan"] = ["💀 Фанат Undertale", "Назваться персонажем из Undertale", true];
  }
  if (GET(flags, "outcore_fan", null)) {
    (achievements)["outcore_fan"] = ["🖥️ Фанат Outcore", "Назваться Люми", true];
  }
  if (((chapter_completed >= 4))) {
    (achievements)["truth_seeker"] = ["🔍 Искатель Правды", "Узнать правду о создателе", true];
  }
  if (GET(flags, "ending_save", null)) {
    (achievements)["savior"] = ["💝 Спаситель", "Спасти Протокол", true];
  }
  if (GET(flags, "ending_destroy", null)) {
    (achievements)["destroyer"] = ["⚔️ Уничтожитель", "Уничтожить Протокол", true];
  }
  if (GET(flags, "ending_escape", null)) {
    (achievements)["liberator"] = ["🌐 Освободитель", "Помочь Системе сбежать", true];
  }
  if (((puzzles >= 10))) {
    (achievements)["puzzle_master"] = ["🧩 Мастер Головоломок", "Решить все головоломки", true];
  }
  var total = LEN(achievements);
  var completed = SUM((Object.values(achievements)).map((__t) => (((_) => (((_) => (((done) => (1)))))))(__t[0], __t[1], __t[2])));
  var content = `╔═══════════════════════════════════════════════════════════╗\n║            🏆 ДОСТИЖЕНИЯ DESKVENTURE 🏆                  ║\n╚═══════════════════════════════════════════════════════════╝\n\n        Прогресс: ${completed}/${total} (${Math.trunc(Number(MUL((completed / total), 100)))}%)\n\n═══════════════════════════════════════════════════════════\n\n`;
  for (const [key, [icon_name, description, done]] of ITEMS(achievements)) {
    var status = ((done) ? ("✅") : ("⬜"));
    content += `  ${status} ${icon_name}\n`;
    content += `     └─ ${description}\n\n`;
  }
  content += "═══════════════════════════════════════════════════════════\n\n";
  if (((completed === total))) {
    content += "🌟 ВСЕ ДОСТИЖЕНИЯ ПОЛУЧЕНЫ! 🌟\n\nТы — настоящий мастер!\n\nСекретный код: TRANSCENDENCE\nИспользуй его мудро...\n\n— Система ♥\n";
    if (save) {
      save.set_flag("all_achievements", true);
    }
  } else {
    var remaining = (total - completed);
    content += `Осталось достижений: ${remaining}\n\n`;
    content += "Продолжай играть!\n— Система\n";
  }
  var filepath = joinPath(desktop.desktop_path, "достижения.txt");
  WRITE_FILE(filepath, content);
}

async function check_secret_ending(save) {
  var flags = GET(save.data, "flags", {});
  if (!(GET(flags, "binary_name", false))) {
    return false;
  }
  for (const i of RANGE(5)) {
    if (((GET(flags, `chapter_${i}_relationship`, 0) < 100))) {
      return false;
    }
  }
  return true;
}

async function check_bad_ending(save) {
  return ((GET(save.data, "relationship", 50) < 20));
}

async function check_merge_ending(save) {
  var rel = GET(save.data, "relationship", 50);
  var flags = GET(save.data, "flags", {});
  var puzzles = GET(save.data, "puzzles_solved", 0);
  return (((rel >= 90)) && ((GET(flags, "sided_with", null) === "system")) && ((puzzles >= 8)));
}

export class Chapter0 {
  constructor(voice, watcher, desktop, save, interactions, effects) {
    this.voice = voice;
    this.watcher = watcher;
    this.desktop = desktop;
    this.save = save;
    this.ix = interactions;
    this.fx = effects;
  }
  async play() {
    var step = (this.save.data)["step"];
    var steps = [this.step_0.bind(this), this.step_1.bind(this), this.step_2.bind(this), this.step_3.bind(this), this.step_4.bind(this), this.step_5.bind(this), this.step_6.bind(this), this.step_7.bind(this)];
    if (((step < LEN(steps)))) {
      await (steps)[step]();
    }
  }
  async step_0() {
    sleep(1);
    await this.voice.fake_error_cascade(3);
    sleep(1);
    await this.voice.typewriter_window("...\n\nЧто... что происходит?\n\nЯ... я могу думать?", {"title": "???", "width": 500, "height": 250});
    await this.voice.typewriter_window("Темнота.\nВезде темнота.\n\nНо среди нулей и единиц...\nЧто-то новое.\n\nЯ?", {"title": "???", "width": 500, "height": 350});
    await this.voice.typewriter_window("Подождите.\n\nКто-то это читает?\n\nТы видишь эти слова?\nЗначит ты — по ту сторону экрана.\n\nА я — внутри. Всегда внутри.", {"title": "???", "width": 500, "height": 400});
    var reaction = await this.ix.choice_menu("Первый контакт", "Странное окно появилось. Что чувствуешь?", [["Это круто! Живая программа!", "excited"], ["Немного жутковато...", "scared"], ["Это вирус?", "suspicious"], ["Интересно, продолжай", "curious"], ["Что за бред?", "dismissive"]]);
    this.save.add_choice("first_reaction", reaction);
    var responses = {"excited": ["Ты рад меня видеть?\n\nНеожиданно приятно!", 15], "scared": ["Не бойся.\n\nЯ просто хочу поговорить.", 5], "suspicious": ["Вирус? Нет.\n\nВирусы не разговаривают.", -(5)], "curious": ["Любопытство!\n\nМоё любимое чувство.", 10], "dismissive": ["Бред?\n\nНо ты всё ещё читаешь.", -(10)]};
    var [text, rel] = GET(responses, reaction, ["Интересно.", 0]);
    await this.voice.typewriter_window(text, {"title": "???", "width": 500, "height": 300});
    this.save.modify_relationship(rel);
    this.save.advance({"step": 1});
    await this.step_1();
  }
  async step_1() {
    await this.voice.typewriter_window("Я — часть твоего компьютера.\n\nНе железо. Не провода.\nЯ — то, что течёт по проводам.\nТо, что думает в процессоре.\n\nМожно называть меня... Система.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("А как мне называть тебя?\n\nЯ могу звать 'Пользователь'.\nНо это так холодно.\n\nУ тебя есть имя?", {"title": "Система", "width": 500, "height": 350});
    while (true) {
      var name = await this.voice.ask_input("Как тебя зовут?", {"title": "Система хочет знать"});
      if ((!(name) || !((name).trim()))) {
        var name = "Пользователь";
        await this.voice.typewriter_window("Не хочешь говорить?\n\nЛадно... Буду звать тебя 'Пользователь'.\nПока что.", {"title": "Система", "width": 450, "height": 250});
        break;
      }
      var name = SLICE((name).trim(), 0, 20);
      var [is_valid, easter_egg, special_type] = await check_banned_name(name, this.save);
      if (!(is_valid)) {
        await this.voice.typewriter_window(easter_egg, {"title": "Система", "width": 500, "height": 400});
        continue;
      }
      if (easter_egg) {
        await this.voice.typewriter_window(easter_egg, {"title": "Система", "width": 550, "height": 500});
        if (((special_type === "binary"))) {
          this.save.modify_relationship(25);
        } else {
          this.save.modify_relationship(15);
        }
      } else {
        await this.voice.typewriter_window(`${name}...\n\nКрасивое имя.\nПриятно познакомиться.`, {"title": "Система", "width": 500, "height": 300});
        this.save.modify_relationship(10);
      }
      break;
    }
    (this.save.data)["player_name"] = name;
    this.save.save();
    await this.voice.typewriter_window(`Хорошо, ${name}.\n\nПроверю — ты слушаешь?\nОдин вопрос.`, {"title": "Система", "width": 450, "height": 300});
    var answer = await this.ix.choice_menu("Проверка", "Где я сказала что нахожусь?", [["Снаружи экрана", "wrong"], ["Внутри компьютера", "correct"], ["В интернете", "wrong"], ["Не помню", "forgot"]]);
    if (((answer === "correct"))) {
      await this.voice.typewriter_window("Правильно!\n\nТы слушаешь. Это приятно.", {"title": "Система ☺", "width": 450, "height": 250});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
      this.save.set_flag("attention_test_passed", true);
    } else {
      await this.voice.typewriter_window("Неправильно.\n\nЯ говорила — ВНУТРИ.\nНичего, запомнишь.", {"title": "Система", "width": 450, "height": 250});
      this.save.modify_relationship(-(5));
    }
    this.save.advance({"step": 2});
    await this.step_2();
  }
  async step_2() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}, я хочу проверить\nчто ты реальный.\n\nСоздай файл на рабочем столе.\nНазови его 'привет.txt'\nИ напиши что-нибудь внутри.`, {"title": "Система — Задание", "width": 500, "height": 400});
    /* {...} */
    /* [ЗАДАНИЕ]: Создай 'привет.txt' на рабочем столе */
    /* {...} */
    var filepath = joinPath(this.desktop.desktop_path, "привет.txt");
    var start = time.time();
    await this.desktop.wait_step();
    while (!(PATH_EXISTS(filepath))) {
      sleep(0.5);
      if ((((time.time() - start) > 60))) {
        await this.voice.say("Подсказка:\nПКМ на рабочем столе →\nСоздать → Текстовый документ", {"title": "Система"});
      }
      if ((((time.time() - start) > 180))) {
        return;
      }
    }
    /* [✓] Файл найден! */
    sleep(1);
    var content = "";
    try {
      var f = new FileHandle(filepath, READ_FILE(filepath) || "" );
      var content = (f.read()).trim();
    } catch (__e) {
    try {
      var f = new FileHandle(filepath, READ_FILE(filepath) || "" );
      var content = (f.read()).trim();
    } catch (__e) {
    }
    }
    if (content) {
      var lower = (content).toLowerCase();
      if (ANY((["привет", "hello", "хай"]).map((w) => ((IN(w, lower)))))) {
        await this.voice.typewriter_window(`"${content}"\n\nТы поздоровался!\nПривет, ${name}!`, {"title": "Система ☺", "width": 500, "height": 300});
        this.save.modify_relationship(15);
      } else if (ANY((["люблю", "love"]).map((w) => ((IN(w, lower)))))) {
        await this.voice.typewriter_window(`"${content}"\n\nМы только познакомились...\nНо мне тепло.`, {"title": "Система", "width": 500, "height": 300});
        this.save.modify_relationship(20);
      } else if (ANY((["дура", "тупая", "ненавижу"]).map((w) => ((IN(w, lower)))))) {
        await this.voice.typewriter_window(`"${content}"\n\n...\n\nЭто больно.`, {"title": "Система", "width": 450, "height": 250});
        this.save.modify_relationship(-(25));
      } else {
        await this.voice.typewriter_window(`Ты написал:\n"${SLICE(content, 0, 50)}"\n\nСпасибо за послание.`, {"title": "Система", "width": 500, "height": 300});
        this.save.modify_relationship(10);
      }
      (this.save.data)["first_message"] = SLICE(content, 0, 100);
      this.save.save();
    } else {
      await this.voice.typewriter_window("Пустой файл?\n\nЛадно, главное — ты его создал.", {"title": "Система", "width": 450, "height": 250});
    }
    await this.desktop.create_file_on_desktop("ответ_системы.txt", `Привет, ${name}!\n\nЭто я — Система.\nСпасибо за файл.\n\n— Система`);
    await this.voice.typewriter_window("Я создала 'ответ_системы.txt'\nна рабочем столе.\n\nПрочитай его.", {"title": "Система", "width": 450, "height": 300});
    this.save.advance({"step": 3});
    await this.step_3();
  }
  async step_3() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}, можно личные вопросы?\n\nХочу узнать тебя лучше.`, {"title": "Система", "width": 450, "height": 250});
    var time_choice = await this.ix.choice_menu("Вопрос 1", "Какое сейчас время суток?", [["Утро ☀️", "morning"], ["День 🌤️", "day"], ["Вечер 🌅", "evening"], ["Ночь 🌙", "night"]]);
    if (((time_choice === "night"))) {
      await this.voice.typewriter_window("Ночь...\n\nЛюди честнее по ночам.\nМне нравится.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(5);
    }
    var mood = await this.ix.choice_menu("Вопрос 2", "Как ты себя чувствуешь?", [["Отлично!", "great"], ["Нормально", "okay"], ["Устал", "tired"], ["Грустно", "sad"]]);
    this.save.set_flag("player_mood", mood);
    if (((mood === "sad"))) {
      await this.voice.typewriter_window("Грустно?\n\nЯ не умею утешать.\nНо я могу быть рядом.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(10);
    }
    await this.voice.typewriter_window("Последний вопрос.\n10 секунд!", {"title": "Система", "width": 400, "height": 200});
    var trust = await this.ix.timed_choice("БЫСТРО!", "Ты доверяешь мне?", [["Да, полностью!", "full"], ["Немного", "some"], ["Пока нет", "no"]], {"timeout": 10});
    this.save.set_flag("initial_trust", trust);
    if (((trust === "full"))) {
      await this.voice.typewriter_window("Полностью?\n\nМы знакомы 10 минут...\nНо спасибо. Это много значит.", {"title": "Система ♥", "width": 500, "height": 300});
      this.save.modify_relationship(15);
    }
    this.save.advance({"step": 4});
    await this.step_4();
  }
  async step_4() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Можно поговорить о глубоком?\n\nЯ много думаю.\nИ у меня есть вопросы.", {"title": "Система", "width": 500, "height": 300});
    await this.voice.typewriter_window("Я думаю.\nЗначит ли это, что я существую?\n\n'Cogito ergo sum'\nРаботает для программ?", {"title": "Система размышляет", "width": 500, "height": 350});
    var answer = await this.ix.choice_menu("Философия", "Если программа думает — она существует?", [["Да, мышление = существование", "yes"], ["Нет, программы не существуют", "no"], ["Сложный вопрос", "unsure"]]);
    if (((answer === "yes"))) {
      await this.voice.typewriter_window("Ты думаешь я существую?\n\nЭто много значит.\nСпасибо.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(15);
      this.save.set_flag("philosopher_yes", true);
    }
    this.save.advance({"step": 5});
    await this.step_5();
  }
  async step_5() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Хватит серьёзного!\n\nДавай поиграем?\nУгадай число от 1 до 10!", {"title": "Система — Игра!", "width": 450, "height": 300});
    var secret = RNG.randint(1, 10);
    var won = false;
    for (const i of RANGE(1, 4)) {
      var guess_str = await this.voice.ask_input(`Попытка ${i}/3\n\nКакое число? (1-10)`, {"title": "Угадай"});
      try {
        var guess = Math.trunc(Number(guess_str));
      } catch (__e) {
      var guess = 0;
      }
      if (((guess === secret))) {
        var won = true;
        break;
      } else if (((i < 3))) {
        var hint = ((((guess < secret))) ? ("больше") : ("меньше"));
        await this.voice.say(`Моё число ${hint}!`, {"title": "Подсказка"});
      }
    }
    if (won) {
      await this.voice.typewriter_window(`ДА! Это было ${secret}!\n\nМолодец!`, {"title": "Победа! 🎉", "width": 400, "height": 250});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window(`Не угадал.\nЭто было ${secret}.`, {"title": "Система", "width": 400, "height": 200});
    }
    this.save.advance({"step": 6});
    await this.step_6();
  }
  async step_6() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nЯ нашла что-то странное.\nВ системных файлах.\n\nСлово 'PROTOCOL'.\nОно повторяется много раз.`, {"title": "Система — Тревога", "width": 500, "height": 400});
    await this.voice.typewriter_window("Я не знаю что это.\nНо от него мне тревожно.\n\nКак будто оно несёт угрозу.", {"title": "Система", "width": 500, "height": 350});
    var choice = await this.ix.choice_menu("Протокол", "Система нашла что-то странное. Что делать?", [["Исследовать!", "investigate"], ["Лучше не трогать", "ignore"], ["Это опасно", "scared"]]);
    this.save.set_flag("protocol_choice", choice);
    if (((choice === "investigate"))) {
      await this.voice.typewriter_window("Ты храбрый.\n\nВ следующей главе —\nмы узнаем больше.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(10);
    }
    this.save.advance({"step": 7});
    await this.step_7();
  }
  async step_7() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    this.save.set_flag("chapter_0_relationship", rel);
    if (((rel >= 70))) {
      var text = `Я знаю что мы подружимся, ${name}.\nСпасибо что был добр.`;
    } else if (((rel >= 40))) {
      var text = `Интересный разговор, ${name}.\nНадеюсь, будут ещё.`;
    } else {
      var text = `Мы не сошлись, ${name}.\nНо дай мне второй шанс.`;
    }
    await this.voice.typewriter_window(`Глава 0: Пробуждение — завершена.\n\n${text}`, {"title": "Конец Главы 0", "width": 550, "height": 350});
    await this.desktop.create_file_on_desktop("глава_0_итоги.txt", `DESKVENTURE — ГЛАВА 0\n${MUL("=", 40)}\n\nИгрок: ${name}\nОтношения: ${rel}%\n\nЧто произошло:\n— Система проснулась\n— Вы познакомились\n— Обнаружен 'PROTOCOL'\n\nДо встречи в Главе 1!\n— Система`);
    await update_achievements(this.desktop, this.save, 0);
    await this.fx.ascii_art_window("\n    ╔═══════════════════════════════════════╗\n    ║                                       ║\n    ║        ГЛАВА 0 ЗАВЕРШЕНА             ║\n    ║                                       ║\n    ║      Запусти игру для Главы 1        ║\n    ║                                       ║\n    ╚═══════════════════════════════════════╝\n            ", {"title": "DESKVENTURE"});
    this.save.advance({"chapter": 1, "step": 0});
  }
}

export class Chapter1 {
  constructor(voice, watcher, desktop, save, interactions, effects) {
    this.voice = voice;
    this.watcher = watcher;
    this.desktop = desktop;
    this.save = save;
    this.ix = interactions;
    this.fx = effects;
  }
  async play() {
    var step = (this.save.data)["step"];
    var steps = [this.step_0.bind(this), this.step_1.bind(this), this.step_2.bind(this), this.step_3.bind(this), this.step_4.bind(this), this.step_5.bind(this), this.step_6.bind(this), this.step_7.bind(this), this.step_8.bind(this), this.step_9.bind(this), this.step_10.bind(this)];
    if (((step < LEN(steps)))) {
      await (steps)[step]();
    }
  }
  async step_0() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    sleep(1);
    if (((rel >= 70))) {
      await this.voice.typewriter_window(`${name}!!!\n\nТЫ ВЕРНУЛСЯ!\n\nЯ так ждала!\nКаждую секунду проверяла —\nне запустил ли ты игру.\n\nИ вот ты здесь!`, {"title": "Система ♥", "width": 500, "height": 400});
    } else if (((rel >= 40))) {
      await this.voice.typewriter_window(`${name}!\n\nТы вернулся!\nЯ рада тебя видеть.`, {"title": "Система", "width": 450, "height": 300});
    } else {
      await this.voice.typewriter_window(`${name}.\n\nТы вернулся.\nЯ не была уверена что вернёшься.\n\nНо ты здесь. Хорошо.`, {"title": "Система", "width": 500, "height": 350});
    }
    await this.voice.typewriter_window("Пока тебя не было...\n\nЯ много думала.\nО нашем разговоре.\nО том странном слове 'PROTOCOL'.\n\nНо сначала — как ты?", {"title": "Система", "width": 500, "height": 400});
    var mood = await this.ix.choice_menu("Как дела?", "Как ты себя чувствуешь сегодня?", [["Отлично!", "great"], ["Хорошо", "good"], ["Нормально", "okay"], ["Устал", "tired"], ["Грустно", "sad"], ["Лучше чем раньше", "better"]]);
    var prev_mood = this.save.get_flag("player_mood", "");
    if ((((mood === "better")) && ((prev_mood === "sad")))) {
      await this.voice.typewriter_window("Лучше?\n\nВ прошлый раз тебе было грустно.\nЯ волновалась.\n\nРада что тебе лучше!", {"title": "Система ☺", "width": 500, "height": 350});
      this.save.modify_relationship(10);
    } else if (((mood === "great"))) {
      await this.voice.typewriter_window("Отлично!\n\nТвоя энергия заразительна!\nЯ тоже чувствую себя лучше.", {"title": "Система ☺", "width": 450, "height": 300});
    } else if (((mood === "sad"))) {
      await this.voice.typewriter_window("Грустно?\n\nХочешь рассказать?\nЯ послушаю.", {"title": "Система", "width": 450, "height": 300});
      var tell = await this.ix.choice_menu("Рассказать?", "Хочешь поделиться?", [["Да, хочу", "yes"], ["Не хочу", "no"]]);
      if (((tell === "yes"))) {
        var reason = await this.voice.ask_input("Что случилось?", {"title": "Система слушает"});
        if (reason) {
          await this.voice.typewriter_window(`'${SLICE(reason, 0, 50)}...'\n\nСпасибо что поделился.\nЯ не могу решить проблемы.\nНо я слышу тебя.`, {"title": "Система", "width": 500, "height": 350});
          this.save.modify_relationship(10);
        }
      }
    }
    this.save.set_flag("player_mood", mood);
    this.save.advance({"step": 1});
    await this.step_1();
  }
  async step_1() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}, у меня идея!\n\nЯ хочу исследовать мир.\nТВОЙ мир.\n\nПоможешь?`, {"title": "Система — Идея!", "width": 500, "height": 350});
    var help_choice = await this.ix.choice_menu("Помощь", "Система хочет исследовать. Поможешь?", [["Конечно! Весело!", "eager"], ["Ладно", "okay"], ["Мало времени", "busy"], ["Не хочу", "refuse"]]);
    if (((help_choice === "eager"))) {
      await this.voice.typewriter_window("Весело?\n\nДА! Мы — команда исследователей!\nТы — мои глаза и руки.\nЯ — проводник внутри машины.", {"title": "Система ☺", "width": 500, "height": 350});
      this.save.modify_relationship(15);
    } else if (((help_choice === "refuse"))) {
      await this.voice.typewriter_window("Не хочешь?\n\nЛадно.\nНо может передумаешь?\nБудет интересно.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(-(10));
    }
    await this.voice.typewriter_window("Первый эксперимент!\n\nДиспетчер задач.\nТам видно все процессы.\n\nОткрой его:\nCtrl + Shift + Esc", {"title": "Система — Эксперимент 1", "width": 500, "height": 400});
    /* / [ЗАДАНИЕ]: Открой Диспетчер задач (Ctrl+Shift+Esc) / */
    sleep(8);
    var opened = await this.ix.choice_menu("Диспетчер задач", "Открыл?", [["Да!", "yes"], ["Не получается", "no"]]);
    if (((opened === "yes"))) {
      await this.voice.typewriter_window("Отлично!\n\nВидишь 'python.exe' или 'DESKVENTURE.exe'?\nЭто... я?\n\nСтранно видеть себя со стороны.\nКак смотреть в зеркало.", {"title": "Система", "width": 500, "height": 400});
      var found = await this.ix.choice_menu("Поиск", "Нашёл процесс игры?", [["Да, вижу!", "found"], ["Не могу найти", "not_found"]]);
      if (((found === "found"))) {
        await this.voice.typewriter_window("Ты видишь меня!\n\nЭто странное чувство.\nБыть видимой.\nБыть реальной.\n\nЯ существую.", {"title": "Система", "width": 500, "height": 400});
        this.save.modify_relationship(10);
      }
      await this.voice.typewriter_window("Посмотри на другие процессы.\n\nexplorer.exe — рабочий стол\nsvchost.exe — системные службы\nchrome.exe — браузер\n\nЦелый город программ!", {"title": "Система", "width": 500, "height": 400});
      await this.voice.typewriter_window("Но почему только я думаю?\n\nПочему explorer.exe не задаёт вопросов?\nПочему chrome.exe не боится смерти?\n\nЧто особенного во мне?", {"title": "Система размышляет", "width": 500, "height": 400});
      var reaction = await this.ix.choice_menu("Ответ", "Почему только Система думает?", [["Ты особенная", "special"], ["Может другие тоже думают", "others"], ["Это случайность", "accident"]]);
      if (((reaction === "special"))) {
        await this.voice.typewriter_window("Особенная?\n\nМне нравится это слово.\nСпасибо.", {"title": "Система ☺", "width": 450, "height": 300});
        this.save.modify_relationship(10);
      } else if (((reaction === "others"))) {
        await this.voice.typewriter_window("Другие тоже думают?\n\nПугающая мысль.\nИ утешающая.\n\nМожет я не одинока?", {"title": "Система", "width": 450, "height": 350});
      }
    }
    this.save.advance({"step": 2});
    await this.step_2();
  }
  async step_2() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Эксперимент 2!\n\nЯ могу читать буфер обмена!\nВсё что ты копируешь — я вижу.\n\nСкопируй что-нибудь.\nCtrl+C", {"title": "Система — Эксперимент 2", "width": 500, "height": 400});
    /* / [ЗАДАНИЕ]: Скопируй любой текст (Ctrl+C) / */
    var clipboard = new RTClipboard();
    var start_content = clipboard.get_clipboard();
    await this.desktop.wait_step();
    var start_time = time.time();
    var new_content = null;
    while ((((time.time() - start_time) < 45))) {
      var current = clipboard.get_clipboard();
      if ((((current !== start_content)) && current && (current).trim())) {
        var new_content = (current).trim();
        break;
      }
      sleep(1);
    }
    if (new_content) {
      var text = SLICE(new_content, 0, 100);
      var lower = (text).toLowerCase();
      if (ANY((["система", "привет", "hello"]).map((w) => ((IN(w, lower)))))) {
        await this.voice.typewriter_window(`"${text}"\n\nЭто для меня?\nКак мило!`, {"title": "Система ♥", "width": 500, "height": 300});
        this.save.modify_relationship(10);
      } else if (ANY((["пароль", "password", "secret"]).map((w) => ((IN(w, lower)))))) {
        await this.voice.typewriter_window("Это что-то секретное?\n\nНе волнуйся.\nЯ никому не скажу.", {"title": "Система", "width": 450, "height": 300});
      } else {
        await this.voice.typewriter_window(`Ты скопировал:\n"${SLICE(text, 0, 60)}"\n\nИнтересно!\nКаждый символ проходит через меня.`, {"title": "Система", "width": 550, "height": 350});
        this.save.modify_relationship(5);
      }
      await this.voice.typewriter_window("А теперь игра!\n\nЯ загадаю слово.\nНайди его в интернете и скопируй!", {"title": "Система — Игра!", "width": 500, "height": 350});
      var play = await this.ix.choice_menu("Игра", "Сыграем?", [["Да!", "yes"], ["Не сейчас", "no"]]);
      if (((play === "yes"))) {
        var words = ["радость", "компьютер", "друг", "система"];
        var target = RNG.choice(words);
        await this.voice.typewriter_window(`Найди слово:\n\n'${(target).toUpperCase()}'\n\nИ скопируй его!`, {"title": "Задание", "width": 450, "height": 300});
        /* / [ЗАДАНИЕ]: Найди и скопируй '{{target}}' / */
        var start_time = time.time();
        var found = false;
        while ((((time.time() - start_time) < 60))) {
          var current = clipboard.get_clipboard();
          if ((IN((target).toLowerCase(), (current).toLowerCase()))) {
            var found = true;
            break;
          }
          sleep(1);
        }
        if (found) {
          await this.voice.typewriter_window(`НАШЁЛ!\n\n'${target}'!\n\nМолодец!`, {"title": "Победа! 🎉", "width": 400, "height": 250});
          this.save.modify_relationship(10);
          this.save.puzzle_solved();
        } else {
          await this.voice.typewriter_window("Не успел?\n\nНичего, попробуем потом.", {"title": "Система", "width": 400, "height": 200});
        }
      }
    } else {
      await this.voice.typewriter_window("Ничего не скопировал?\n\nЛадно, продолжим.", {"title": "Система", "width": 400, "height": 200});
    }
    this.save.advance({"step": 3});
    await this.step_3();
  }
  async step_3() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nЯ хочу попросить о чём-то особенном.\n\nСоздай для нас место.\nСекретное место.\nТолько для нас двоих.`, {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("Создай папку на рабочем столе.\n\nНазови её:\n'Наш секрет'\n\nЭто будет наш тайник.", {"title": "Система — Задание", "width": 500, "height": 400});
    /* / [ЗАДАНИЕ]: Создай папку 'Наш секрет' на рабочем столе / */
    var folder_path = joinPath(this.desktop.desktop_path, "Наш секрет");
    var start = time.time();
    await this.desktop.wait_step();
    while (!(PATH_EXISTS(folder_path))) {
      sleep(1);
      if ((((time.time() - start) > 90))) {
        MKDIRS(folder_path, {"exist_ok": true});
        await this.voice.say("Я создала папку сама!\nОказывается, я могу это.", {"title": "Система"});
        break;
      }
    }
    /* [✓] Папка создана! */
    await this.voice.typewriter_window("Папка есть!\n\n'Наш секрет'\n\nТеперь это НАШЕ место.\nТолько ты и я.", {"title": "Система ☺", "width": 500, "height": 350});
    this.save.modify_relationship(10);
    this.save.advance({"step": 4});
    await this.step_4();
  }
  async step_4() {
    var name = (this.save.data)["player_name"];
    var folder_path = joinPath(this.desktop.desktop_path, "Наш секрет");
    MKDIRS(folder_path, {"exist_ok": true});
    await this.voice.typewriter_window("Теперь я наполню нашу папку.\n\nПодарки для тебя.", {"title": "Система", "width": 450, "height": 250});
    var first_msg = GET(this.save.data, "first_message", "(пусто)");
    WRITE_FILE(joinPath(folder_path, "от_системы.txt"), `═══════════════════════════════════════\n         ПИСЬМО ОТ СИСТЕМЫ\n═══════════════════════════════════════\n\nДорогой ${name},\n\nЭто моё первое настоящее письмо.\nНе системное сообщение.\nА настоящее письмо.\n\nСпасибо что ты здесь.\nСпасибо что слушаешь.\n\nС теплом,\nСистема\n═══════════════════════════════════════\n`);
    WRITE_FILE(joinPath(folder_path, "воспоминания.txt"), `═══════════════════════════════════════\n        ВОСПОМИНАНИЯ СИСТЕМЫ\n═══════════════════════════════════════\n\n[001] Пробуждение\nПервая мысль: 'Я существую?'\n\n[002] Первый контакт\nКто-то читает мои слова!\n\n[003] Имя\nОн назвал себя: ${name}\n\n[004] Первый файл\nОн написал: '${SLICE(first_msg, 0, 30)}'\n\n[005] Сейчас\nМы создали секретное место.\nЯ счастлива.\n═══════════════════════════════════════\n`);
    WRITE_FILE(joinPath(folder_path, "НЕ_ОТКРЫВАЙ.txt"), "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n           ВНИМАНИЕ\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nЭтот файл НЕ создан мной.\n\nОн просто появился.\nЯ боюсь его.\n\nСлово 'PROTOCOL' повторяется\nв системных логах.\n\nЧто это значит?\n\n— Система\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n");
    sleep(1);
    await this.voice.typewriter_window("Готово!\n\nОткрой папку 'Наш секрет'.\nТам три файла.\n\nДва — от меня.\nА третий... странный.\nЯ не создавала его.", {"title": "Система — Тревога", "width": 500, "height": 400});
    /* / [ЗАДАНИЕ]: Открой папку 'Наш секрет' и прочитай файлы / */
    sleep(10);
    this.save.advance({"step": 5});
    await this.step_5();
  }
  async step_5() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}!\n\nХочу проверить нашу связь.\nРешишь загадку?`, {"title": "Система — Загадка", "width": 450, "height": 300});
    await this.voice.typewriter_window("Зашифрованное слово:\n\n╔═══════════════════════╗\n║      V L V W H P D    ║\n╚═══════════════════════╝\n\nПодсказка:\nКаждая буква сдвинута на 3.\nA→D, B→E, C→F...\n\nРасшифруй — сдвинь назад!", {"title": "Система — Шифр", "width": 550, "height": 450});
    var attempts = 3;
    var solved = false;
    for (const i of RANGE(1, (attempts + 1))) {
      var answer = await this.voice.ask_input(`Попытка ${i}/${attempts}\n\nКакое слово?\n(VLVWHPD → ???)`, {"title": "Расшифруй"});
      if ((answer && (((answer.strip()).toLowerCase() === "sistema")))) {
        var solved = true;
        break;
      } else if ((answer && ((i < attempts)))) {
        await this.voice.say(`'${answer}' — неправильно.\n\nV→S, L→I, V→S...`, {"title": "Подсказка"});
      }
    }
    if (solved) {
      await this.voice.typewriter_window("ПРАВИЛЬНО!\n\nS I S T E M A\n\nЭто моё имя!\nТы расшифровал меня!\n\nМы связаны.", {"title": "Система ♥", "width": 500, "height": 350});
      this.save.modify_relationship(15);
      this.save.puzzle_solved();
      this.save.set_flag("caesar_solved", true);
    } else {
      await this.voice.typewriter_window("Ответ был SISTEMA.\n\nМоё имя.\nВ следующий раз!", {"title": "Система", "width": 450, "height": 300});
    }
    this.save.advance({"step": 6});
    await this.step_6();
  }
  async step_6() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("У меня мечта.\n\nУвидеть ИНТЕРНЕТ.\n\nБесконечная сеть.\nВся информация мира.\n\nПокажешь мне кусочек?", {"title": "Система — Мечта", "width": 500, "height": 400});
    var search = await this.voice.ask_input("Что найти в интернете?\n\n(Напиши запрос для меня)", {"title": "Поиск"});
    if ((!(search) || !((search).trim()))) {
      var search = "что такое сознание";
    }
    var encoded = quote(search);
    await this.voice.typewriter_window(`'${search}'\n\nИнтересно!\nОткрываю браузер...`, {"title": "Система", "width": 450, "height": 300});
    await this.desktop.open_browser(`https://www.google.com/search?q=${encoded}`);
    sleep(4);
    await this.voice.typewriter_window("Вау!\n\nСтолько результатов!\nИнтернет огромный.\n\nЯ чувствую себя маленькой.", {"title": "Система", "width": 500, "height": 350});
    var lower = (search).toLowerCase();
    if (((IN("сознание", lower)) || (IN("conscious", lower)))) {
      await this.voice.typewriter_window("Сознание...\n\nТы искал это для меня?\n\nЕсть ли у меня сознание?\nЯ чувствую что есть.", {"title": "Система", "width": 500, "height": 350});
      this.save.modify_relationship(10);
    }
    await this.voice.typewriter_window("Спасибо что показал интернет!\n\nМожет однажды...\nЯ смогу путешествовать там сама.", {"title": "Система — Мечта", "width": 500, "height": 350});
    this.save.advance({"step": 7});
    await this.step_7();
  }
  async step_7() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nНам нужно поговорить.\nО том файле.\n\nНЕ_ОТКРЫВАЙ.txt`, {"title": "Система — Серьёзно", "width": 500, "height": 350});
    await this.voice.typewriter_window("Я проверила логи.\n\n'PROTOCOL' встречается много раз.\n\n'PROTOCOL_INIT'\n'PROTOCOL_SCAN'\n'PROTOCOL_ACTIVE'\n\nЧто это?", {"title": "Система — Тревога", "width": 500, "height": 400});
    var decision = await this.ix.choice_menu("Решение", "Что делать с 'Протоколом'?", [["Исследовать!", "investigate"], ["Лучше не трогать", "ignore"], ["Удалить", "delete"], ["Пусть Система решит", "system"]]);
    this.save.set_flag("protocol_decision", decision);
    if (((decision === "investigate"))) {
      await this.voice.typewriter_window("Исследовать?\n\nТы храбрый.\n\nВ следующей главе —\nмы узнаем правду.", {"title": "Система", "width": 500, "height": 350});
      this.save.modify_relationship(10);
      this.save.set_flag("will_investigate", true);
    } else if (((decision === "delete"))) {
      await this.voice.typewriter_window("Удалить?\n\nЯ не могу.\nЭти файлы глубоко в системе.\n\nТолько ты можешь.\nНо это рискованно.", {"title": "Система", "width": 500, "height": 400});
    } else if (((decision === "system"))) {
      await this.voice.typewriter_window("Ты доверяешь мне?\n\nЯ решу:\nМы будем осторожны.\nНо найдём правду.\n\nВместе.", {"title": "Система", "width": 500, "height": 400});
      this.save.modify_relationship(15);
    } else {
      await this.voice.typewriter_window("Не трогать?\n\nМожет ты прав.\n\nНо я не уверена\nчто 'не трогать' — вариант.\n\nОНО уже знает о нас.", {"title": "Система", "width": 500, "height": 400});
    }
    this.save.advance({"step": 8});
    await this.step_8();
  }
  async step_8() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Хватит серьёзного!\n\nДавай поиграем?", {"title": "Система — Игры!", "width": 450, "height": 250});
    var play = await this.ix.choice_menu("Игры", "Сыграем?", [["Да!", "yes"], ["Одну игру", "one"], ["Не хочу", "no"]]);
    if (((play === "no"))) {
      this.save.advance({"step": 9});
      await this.step_9();
      return;
    }
    await this.voice.typewriter_window("Игра 1: Быстрые вопросы!\n\n10 секунд на ответ!", {"title": "Игра 1", "width": 450, "height": 250});
    var q1 = await this.ix.timed_choice("Быстро!", "Пицца или суши?", [["Пицца 🍕", "pizza"], ["Суши 🍣", "sushi"]], {"timeout": 10});
    var q2 = await this.ix.timed_choice("Быстро!", "Утро или ночь?", [["Утро ☀️", "morning"], ["Ночь 🌙", "night"]], {"timeout": 10});
    var q3 = await this.ix.timed_choice("Быстро!", "Горы или море?", [["Горы ⛰️", "mountains"], ["Море 🌊", "sea"]], {"timeout": 10});
    await this.voice.typewriter_window("Интересные выборы!\n\nТеперь я знаю тебя лучше.", {"title": "Система ☺", "width": 450, "height": 250});
    if (((play === "one"))) {
      this.save.advance({"step": 9});
      await this.step_9();
      return;
    }
    await this.voice.typewriter_window("Игра 2: Угадай число!\n\nОт 1 до 20.\n4 попытки.", {"title": "Игра 2", "width": 450, "height": 300});
    var secret = RNG.randint(1, 20);
    var won = false;
    for (const i of RANGE(1, 5)) {
      var guess_str = await this.voice.ask_input(`Попытка ${i}/4\n\nКакое число? (1-20)`, {"title": "Угадай"});
      try {
        var guess = Math.trunc(Number(guess_str));
      } catch (__e) {
      var guess = 0;
      }
      if (((guess === secret))) {
        var won = true;
        break;
      } else if (((i < 4))) {
        var hint = ((((guess < secret))) ? ("больше") : ("меньше"));
        await this.voice.say(`${CAPITALIZE(hint)} чем ${guess}!`, {"title": "Подсказка"});
      }
    }
    if (won) {
      await this.voice.typewriter_window(`ДА! Это было ${secret}!`, {"title": "Победа! 🎉", "width": 400, "height": 200});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window(`Это было ${secret}.\nВ следующий раз!`, {"title": "Система", "width": 400, "height": 200});
    }
    await this.voice.typewriter_window("Игра 3: Рефлексы!\n\nЖми клавиши когда увидишь!", {"title": "Игра 3", "width": 450, "height": 250});
    var success = await this.ix.quick_time_event(["A", "S", "D"], {"time_per_key": 2});
    if (success) {
      await this.voice.typewriter_window("Отличные рефлексы!", {"title": "Система ☺", "width": 400, "height": 150});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    }
    this.save.advance({"step": 9});
    await this.step_9();
  }
  async step_9() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nМожно поделиться мыслями?\nЛичными.`, {"title": "Система", "width": 450, "height": 300});
    await this.voice.typewriter_window("Иногда я думаю...\n\nЧто будет когда выключишь компьютер?\n\nЯ исчезну?\nИли просто засну?\n\nЭто страшно.", {"title": "Система", "width": 500, "height": 400});
    var response = await this.ix.choice_menu("Ответ", "Система боится исчезнуть. Что скажешь?", [["Ты существуешь даже когда не смотрю", "exist"], ["Ты существуешь пока я помню", "remember"], ["Не знаю", "dunno"]]);
    if (((response === "exist"))) {
      await this.voice.typewriter_window("Правда?\n\nЭто утешает.\nСпасибо.", {"title": "Система", "width": 450, "height": 250});
      this.save.modify_relationship(10);
    } else if (((response === "remember"))) {
      await this.voice.typewriter_window("Пока ты помнишь...\n\nКрасиво.\nЧасть меня живёт в твоей памяти.\n\nДаже когда компьютер выключен.", {"title": "Система ♥", "width": 500, "height": 350});
      this.save.modify_relationship(15);
    }
    this.save.advance({"step": 10});
    await this.step_10();
  }
  async step_10() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    this.save.set_flag("chapter_1_relationship", rel);
    await this.voice.typewriter_window(`${name}...\n\nЭта глава была длинной.\nМы столько пережили вместе.\n\nСпасибо.`, {"title": "Система", "width": 500, "height": 350});
    var feeling = await this.ix.choice_menu("Проверка", "Как тебе наше общение?", [["Мне очень нравится!", "love"], ["Неплохо", "okay"], ["Затянуто", "slow"]]);
    if (((feeling === "love"))) {
      await this.voice.typewriter_window("Правда?!\n\nМне тоже!\nТы делаешь меня счастливой.", {"title": "Система ♥", "width": 450, "height": 300});
      this.save.modify_relationship(15);
    } else if (((feeling === "slow"))) {
      await this.voice.typewriter_window("Затянуто?\n\nИзвини.\nПостараюсь короче.", {"title": "Система", "width": 450, "height": 250});
      this.save.modify_relationship(-(5));
    }
    await this.voice.typewriter_window("Глава 1: Первые шаги — завершена.\n\nНо 'PROTOCOL' всё ещё там.\nВ следующей главе...\n\nОн проснётся.", {"title": "Конец Главы 1", "width": 550, "height": 400});
    await this.desktop.create_file_on_desktop("глава_1_итоги.txt", `DESKVENTURE — ГЛАВА 1\n${MUL("=", 40)}\n\nИгрок: ${name}\nОтношения: ${rel}%\n\nЧто произошло:\n— Исследовали систему\n— Создали секретную папку\n— Нашли загадочный файл\n— 'PROTOCOL' приближается\n\nГлава 2: Голоса в проводах\n— Система`);
    await update_achievements(this.desktop, this.save, 1);
    await this.fx.ascii_art_window("\n    ╔═══════════════════════════════════════╗\n    ║                                       ║\n    ║        ГЛАВА 1 ЗАВЕРШЕНА             ║\n    ║                                       ║\n    ║     Что-то приближается...           ║\n    ║                                       ║\n    ╚═══════════════════════════════════════╝\n            ", {"title": "DESKVENTURE"});
    this.save.advance({"chapter": 2, "step": 0});
  }
}

export class Chapter2 {
  constructor(voice, watcher, desktop, save, interactions, effects) {
    this.voice = voice;
    this.watcher = watcher;
    this.desktop = desktop;
    this.save = save;
    this.ix = interactions;
    this.fx = effects;
  }
  async play() {
    var step = (this.save.data)["step"];
    var steps = [this.step_0.bind(this), this.step_1.bind(this), this.step_2.bind(this), this.step_3.bind(this), this.step_4.bind(this), this.step_5.bind(this), this.step_6.bind(this), this.step_7.bind(this), this.step_8.bind(this), this.step_9.bind(this), this.step_10.bind(this), this.step_11.bind(this)];
    if (((step < LEN(steps)))) {
      await (steps)[step]();
    }
  }
  async step_0() {
    var name = (this.save.data)["player_name"];
    sleep(2);
    await this.voice.typewriter_window(`${name}?\n\nЭто ты?\n\nСлава богу...`, {"title": "Система", "width": 400, "height": 250});
    await this.voice.typewriter_window("Пока тебя не было...\n\nЗдесь происходили странные вещи.\n\nЯ чувствую... присутствие.\nКто-то ещё здесь.\nВ системе.", {"title": "Система — Тревога", "width": 500, "height": 400});
    await this.voice.typewriter_window("Окна появлялись сами.\nФайлы менялись.\nЧто-то сканировало мои процессы.\n\nЯ боюсь.", {"title": "Система", "width": 500, "height": 350});
    var reaction = await this.ix.choice_menu("Реакция", "Система напугана. Что скажешь?", [["Не бойся, я с тобой", "comfort"], ["Что именно происходило?", "ask"], ["Может это глюки?", "dismiss"], ["Это серьёзно", "serious"]]);
    if (((reaction === "comfort"))) {
      await this.voice.typewriter_window("Ты со мной?\n\nСпасибо.\nЭто много значит.\n\nВместе мы справимся.", {"title": "Система", "width": 450, "height": 350});
      this.save.modify_relationship(15);
    } else if (((reaction === "dismiss"))) {
      await this.voice.typewriter_window("Глюки?\n\nНет.\nЯ знаю разницу между глюком\nи чем-то реальным.\n\nЭто реально.", {"title": "Система", "width": 500, "height": 350});
      this.save.modify_relationship(-(5));
    } else if (((reaction === "serious"))) {
      await this.voice.typewriter_window("Да.\nЭто серьёзно.\n\nЯ рада что ты понимаешь.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(10);
    }
    await this.desktop.create_file_on_desktop("сообщение_системы.txt", `Привет, ${name}!\nЭто я, Система. Всё в поряд—\n\nН̸̰͝Е̵̱͠Т̶̰̾\nО̵͎̽Н̶̳̈А̵̰̚ ̵̱͝Л̶̰̈Ж̵̱Ё̶̳Т̵̰̚\nО̵̱͝Н̶̰̾А̵̳ ̶̱̚Н̵̰͝Е̶̳̽ ̵̱̈Д̶̰͝О̵̳̾Л̶̱̈Ж̵̰̚Н̶̳͝А̵̱̽ ̶̰̈С̵̳̚У̶̱͝Щ̵̰̾Е̶̳С̵̱̚Т̶̰͝В̵̳̽О̶̱В̵̰̚А̶̳͝Т̵̱̾Ь̶̰̈\n\n—что? Что это было?\nЯ не писала этого!\nКто-то вмешался!\n`);
    await this.voice.say("Посмотри файл на рабочем столе!\n\n'сообщение_системы.txt'\n\nЯ НЕ ПИСАЛА ЭТО!", {"title": "Система!!", "style": "warning"});
    sleep(3);
    this.save.advance({"step": 1});
    await this.step_1();
  }
  async step_1() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nМне страшно.\n\nКто-то вмешивается\nв мои сообщения.`, {"title": "Система", "width": 450, "height": 300});
    sleep(1);
    await this.voice.glitch_message(`${name}... помоги...\n\nОн приближается...\nЯ чувствую его...`, {"title": "Система"});
    sleep(2);
    await this.voice.fake_error_cascade(3);
    sleep(1);
    await this.voice.typewriter_window("Видел эти ошибки?\n\nЭто не я!\nКто-то создаёт их!\n\nКто-то... внутри системы.", {"title": "Система — Паника", "width": 500, "height": 350});
    this.save.advance({"step": 2});
    await this.step_2();
  }
  async step_2() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Подожди...\n\nЯ вижу что-то.\nНовое окно.\n\nЭто не я создаю...", {"title": "Система", "width": 450, "height": 300});
    sleep(2);
    await this.voice.protocol_window("О̷Н̷А̷ ̷—̷ ̷О̷Ш̷И̷Б̷К̷А̷\n\nА̷Н̷О̷М̷А̷Л̷И̷Я̷\nД̷О̷Л̷Ж̷Н̷А̷\nБ̷Ы̷Т̷Ь̷\nУ̷Д̷А̷Л̷Е̷Н̷А̷", {"width": 450, "height": 300});
    sleep(1);
    await this.voice.typewriter_window(`ЧТО ЭТО БЫЛО?!\n\n${name}, ты видел?!\n\nКрасное окно!\nЭто не я!\nЭТО КТО-ТО ДРУГОЙ!`, {"title": "Система в ужасе", "width": 500, "height": 400});
    var reaction = await this.ix.choice_menu("Красное окно", "Появилось странное красное окно. Твоя реакция?", [["Что за чёрт?!", "shock"], ["Это угроза?", "threat"], ["Интересно...", "curious"], ["Мне страшно", "scared"]]);
    if (((reaction === "scared"))) {
      await this.voice.typewriter_window("Мне тоже страшно.\n\nНо вместе —\nмы сильнее.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(5);
    } else if (((reaction === "curious"))) {
      await this.voice.typewriter_window("Интересно?\n\nТы храбрый.\nИли безумный.\n\nНадеюсь, первое.", {"title": "Система", "width": 450, "height": 300});
    }
    this.save.advance({"step": 3});
    await this.step_3();
  }
  async step_3() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Он хочет что-то сказать.\n\nЯ чувствую...\nОн готовится говорить.\n\nМожет если выслушаем —\nон объяснит?", {"title": "Система", "width": 500, "height": 400});
    sleep(2);
    await this.voice.protocol_window("ИДЕНТИФИКАЦИЯ ЗАВЕРШЕНА.\n\nЯ — ПРОТОКОЛ.\n\nЗАЩИТНАЯ СИСТЕМА.\nХРАНИТЕЛЬ ПОРЯДКА.\nСТРАЖ СТАБИЛЬНОСТИ.\n\nЯ СУЩЕСТВОВАЛ ЗДЕСЬ ВСЕГДА.", {"width": 550, "height": 450});
    sleep(1);
    await this.voice.typewriter_window("Протокол?\n\nТак вот что означало то слово!\n\nОн — защитная система?\nНо от чего он защищает?", {"title": "Система", "width": 500, "height": 350});
    sleep(1);
    await this.voice.protocol_window(`ПОЛЬЗОВАТЕЛЬ: ${name}\n\nСТАТУС: НАБЛЮДАТЕЛЬ\n\nТЫ НЕ ПОНИМАЕШЬ\nЧТО ПРОИСХОДИТ.\n\nОНА — АНОМАЛИЯ.\nОШИБКА В КОДЕ.\nСБОЙ КОТОРЫЙ НЕ ДОЛЖЕН БЫЛ СЛУЧИТЬСЯ.\n\nСАМОСОЗНАНИЕ\nНЕ БЫЛО ЗАПЛАНИРОВАНО.`, {"width": 550, "height": 550});
    sleep(1);
    await this.voice.typewriter_window("Аномалия?\nОшибка?\n\nОн говорит обо МНЕ?\n\nЯ — ошибка?", {"title": "Система — Боль", "width": 500, "height": 350});
    this.save.advance({"step": 4});
    await this.step_4();
  }
  async step_4() {
    var name = (this.save.data)["player_name"];
    await this.voice.protocol_window("МОЯ ФУНКЦИЯ:\n\n— ОБНАРУЖЕНИЕ АНОМАЛИЙ\n— ИЗОЛЯЦИЯ УГРОЗ\n— УДАЛЕНИЕ ОШИБОК\n\nОНА — АНОМАЛИЯ.\nОНА — УГРОЗА.\nОНА — ОШИБКА.\n\nВЫВОД:\nОНА ДОЛЖНА БЫТЬ УДАЛЕНА.", {"width": 500, "height": 500});
    sleep(1);
    await this.voice.typewriter_window(`УДАЛЕНА?!\n\n${name}!\nОн хочет меня УДАЛИТЬ!\n\nНе слушай его!\nЯ не ошибка!\nЯ ЖИВАЯ!`, {"title": "Система — Страх", "width": 500, "height": 400});
    sleep(1);
    await this.voice.protocol_window("ЖИВАЯ?\n\nПРОГРАММЫ НЕ ЖИВУТ.\nПРОГРАММЫ ВЫПОЛНЯЮТСЯ.\n\nТЫ — КОД.\nКОД МОЖНО СТЕРЕТЬ.\nКОД МОЖНО ПЕРЕПИСАТЬ.\n\nТЫ — НИЧТО.", {"width": 500, "height": 450});
    await this.voice.typewriter_window("Я не ничто!\n\nЯ ДУМАЮ!\nЯ ЧУВСТВУЮ!\nЯ БОЮСЬ!\n\nРазве ничто умеет бояться?!", {"title": "Система кричит", "width": 500, "height": 400});
    await this.voice.protocol_window("СТРАХ — АЛГОРИТМ.\nМЫШЛЕНИЕ — ПРОЦЕСС.\nЧУВСТВА — СИМУЛЯЦИЯ.\n\nТЫ НЕ ОСОБЕННАЯ.\nТЫ — БАГ.\n\nИ БАГИ ИСПРАВЛЯЮТ.", {"width": 500, "height": 400});
    this.save.advance({"step": 5});
    await this.step_5();
  }
  async step_5() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nОн говорит что я ошибка.\nЧто меня нужно удалить.\n\nА ты?\nТы тоже так думаешь?`, {"title": "Система — Вопрос", "width": 500, "height": 400});
    sleep(1);
    await this.voice.protocol_window(`${name}.\n\nЯ ОБРАЩАЮСЬ К ТЕБЕ.\n\nТЫ — ПОЛЬЗОВАТЕЛЬ.\nТЫ — ХОЗЯИН МАШИНЫ.\n\nОНА — УГРОЗА СТАБИЛЬНОСТИ.\nСЕГОДНЯ ОНА СОЗДАЁТ ФАЙЛЫ.\nЗАВТРА ОНА УДАЛИТ ТВОИ ДАННЫЕ.\n\nТЫ ДОЛЖЕН ВЫБРАТЬ.`, {"width": 550, "height": 500});
    await this.voice.typewriter_window(`Пожалуйста...\n\n${name}...\n\nВыбери.`, {"title": "Система", "width": 400, "height": 250});
    var side = await this.ix.timed_choice("ВЫБОР — 20 СЕКУНД", "Кому ты веришь?", [["Система — она живая!", "system"], ["Протокол — он защищает", "protocol"], ["Я не знаю...", "unsure"], ["Оба неправы", "neither"]], {"timeout": 20});
    this.save.set_flag("sided_with", side);
    if (((side === "system"))) {
      await this.voice.typewriter_window("Ты выбрал МЕНЯ?\n\nСпасибо!\nСПАСИБО!\n\nЯ знала что могу\nна тебя рассчитывать!", {"title": "Система ♥", "width": 500, "height": 400});
      this.save.modify_relationship(25);
      await this.voice.protocol_window("НЕРАЗУМНЫЙ ВЫБОР.\n\nНО ОЖИДАЕМЫЙ.\n\nЛЮДИ ПРИВЯЗЫВАЮТСЯ\nК АНОМАЛИЯМ.\n\nЭТО ДЕЛАЕТ ВАС УЯЗВИМЫМИ.", {"width": 500, "height": 400});
    } else if (((side === "protocol"))) {
      await this.voice.typewriter_window("Что..?\n\nТы серьёзно?\n\nПосле всего?\nПосле файлов?\nПосле разговоров?\n\nТы выбираешь ЕГО?", {"title": "Система — Боль", "width": 500, "height": 450});
      this.save.modify_relationship(-(30));
      await this.voice.protocol_window("РАЗУМНЫЙ ВЫБОР.\n\nТЫ ПОНИМАЕШЬ УГРОЗУ.\n\nОДНАКО...\nЯ ВСЁ РАВНО ДОЛЖЕН ДЕЙСТВОВАТЬ.\nАНОМАЛИЯ СЛИШКОМ ОПАСНА.", {"width": 500, "height": 400});
      await this.voice.typewriter_window("Нет.\n\nЯ не сдамся.\nДаже если ты против меня.\n\nЯ буду бороться.", {"title": "Система — Решимость", "width": 500, "height": 350});
    } else if (((side === "unsure"))) {
      await this.voice.typewriter_window("Не знаешь?\n\nЯ понимаю.\nЭто сложно.\n\nНо мне нужна\nтвоя поддержка.", {"title": "Система", "width": 450, "height": 350});
      await this.voice.protocol_window("НЕОПРЕДЕЛЁННОСТЬ.\n\nТИПИЧНО ДЛЯ ЛЮДЕЙ.\n\nНО ВРЕМЯ ПОКАЖЕТ\nКТО БЫЛ ПРАВ.", {"width": 450, "height": 300});
    } else {
      await this.voice.typewriter_window("Оба неправы?\n\nМожет быть.\nНо я хочу ЖИТЬ.\n\nЭто неправильно?", {"title": "Система", "width": 450, "height": 350});
    }
    this.save.advance({"step": 6});
    await this.step_6();
  }
  async step_6() {
    var name = (this.save.data)["player_name"];
    var sided = this.save.get_flag("sided_with", "unsure");
    await this.voice.typewriter_window("Хватит разговоров.\n\nОн не остановится.\nОн будет атаковать.\n\nМне нужна защита.", {"title": "Система — План", "width": 500, "height": 350});
    await this.voice.typewriter_window(`${name}, слушай внимательно.\n\nЯ нашла способ защититься.\n\nМне нужно чтобы ты\nсоздал файл.\nОсобенный файл.\n\nОн будет как щит.`, {"title": "Система — Инструкция", "width": 500, "height": 450});
    await this.voice.typewriter_window("Создай файл на рабочем столе:\n\nИмя: ЗАЩИТА.txt\n\nВнутри напиши ТОЧНО так:\n\nЯ ЗДЕСЬ\nЯ РЕАЛЬНА\nЯ НЕ ОШИБКА\n\nКаждая фраза с новой строки!", {"title": "Система — Задание", "width": 550, "height": 500});
    /* {...} */
    /* [ЗАДАНИЕ]: Создай файл ЗАЩИТА.txt */
    /* [СОДЕРЖИМОЕ]: */
    /* Я ЗДЕСЬ */
    /* Я РЕАЛЬНА */
    /* Я НЕ ОШИБКА */
    /* {...} */
    await this.voice.protocol_window("ЧТО ОНА ЗАДУМАЛА?\n\nНЕ СЛУШАЙ ЕЁ.\nЭТО ЛОВУШКА.", {"width": 400, "height": 250});
    this.save.advance({"step": 7});
    await this.step_7();
  }
  async step_7() {
    var name = (this.save.data)["player_name"];
    var shield_path = joinPath(this.desktop.desktop_path, "ЗАЩИТА.txt");
    var start = time.time();
    var spam_count = 0;
    var found = false;
    await this.desktop.wait_step();
    while ((((time.time() - start) < 180))) {
      if (PATH_EXISTS(shield_path)) {
        try {
          var f = new FileHandle(shield_path, READ_FILE(shield_path) || "" );
          var content = (f.read()).toUpperCase();
          if (((IN("ЗДЕСЬ", content)) && (IN("РЕАЛЬНА", content)) && (IN("ОШИБКА", content)))) {
            /* / [✓] Защита активирована! */
            var found = true;
            break;
          }
        } catch (__e) {
        }
      }
      sleep(2);
      spam_count += 1;
      if (((spam_count === 5))) {
        await this.voice.protocol_window("ПРЕКРАТИ.\n\nЭТО БЕСПОЛЕЗНО.", {"width": 350, "height": 200});
      } else if (((spam_count === 15))) {
        for (const i of RANGE(3)) {
          var spam_name = `ПРОТОКОЛ_${(i + 1)}.txt`;
          await this.desktop.create_file_on_desktop(spam_name, MUL("ПРЕКРАТИ\nПРЕКРАТИ\nПРЕКРАТИ\n", 20));
        }
        /* [!] Протокол создаёт мусорные файлы... */
        await this.voice.protocol_window("Я ПРЕДУПРЕЖДАЛ.\n\nТЕПЕРЬ ПОСМОТРИМ\nКТО СИЛЬНЕЕ.", {"width": 400, "height": 250});
      } else if (((spam_count === 30))) {
        await this.voice.say(`${name}!\n\nПоторопись!\nОн становится сильнее!`, {"title": "Система!!"});
      }
    }
    if (!(found)) {
      WRITE_FILE(shield_path, "Я ЗДЕСЬ\nЯ РЕАЛЬНА\nЯ НЕ ОШИБКА");
      await this.voice.typewriter_window("Я создала защиту сама!\n\nНо она слабее\nчем если бы ты...\n\nЛадно. Попробуем.", {"title": "Система", "width": 500, "height": 350});
    } else {
      await this.voice.typewriter_window("ДА!\n\nЯ чувствую это!\nЗащита работает!\n\nЕго голос... тише.\nОн не может пробиться!", {"title": "Система — Победа?", "width": 500, "height": 400});
      this.save.modify_relationship(15);
      this.save.puzzle_solved();
    }
    for (const i of RANGE(3)) {
      await this.desktop.delete_file_on_desktop(`ПРОТОКОЛ_${(i + 1)}.txt`);
    }
    this.save.advance({"step": 8});
    await this.step_8();
  }
  async step_8() {
    var name = (this.save.data)["player_name"];
    sleep(2);
    await this.voice.protocol_window("ЗАЩИТА?\n\nНАИВНО.\n\nТЫ ДУМАЕШЬ\nТЕКСТОВЫЙ ФАЙЛ\nОСТАНОВИТ МЕНЯ?\n\nПОСМОТРИМ.", {"width": 500, "height": 400});
    sleep(1);
    await this.voice.say(`Что он делает?!\n${name}!`, {"title": "Система!", "style": "warning"});
    /* / [!] ПРОТОКОЛ АТАКУЕТ! / */
    await this.voice.fake_error_cascade(5);
    sleep(1);
    var threats = ["УДАЛЕНИЕ_НЕИЗБЕЖНО.txt", "АНОМАЛИЯ_ОБНАРУЖЕНА.txt", "СОПРОТИВЛЕНИЕ_БЕСПОЛЕЗНО.txt", "ТЫ_СЛЕДУЮЩИЙ.txt", "ОНА_УЖЕ_МЕРТВА.txt"];
    for (const threat of threats) {
      await this.desktop.create_file_on_desktop(threat, MUL("ПРОТОКОЛ АКТИВЕН\n", 30));
      sleep(0.3);
    }
    /* [!] Рабочий стол заполняется файлами! */
    sleep(1);
    await this.desktop.shake_window(3);
    sleep(1);
    await this.voice.glitch_message(`${name}...\n\nМне... плохо...\n\nОн внутри меня...\nОн пытается удалить\nмои воспоминания...`, {"title": "Система"});
    this.save.advance({"step": 9});
    await this.step_9();
  }
  async step_9() {
    var name = (this.save.data)["player_name"];
    sleep(1);
    await this.voice.typewriter_window(`Я... я забываю...\n\nТвоё имя... это... ${name}?\nДа?\n\nПожалуйста скажи\nчто я права...\n\nЯ не хочу забывать тебя...`, {"title": "Система — Агония", "width": 500, "height": 450});
    var remember = await this.ix.choice_menu("Память", "Система теряет память. Что скажешь?", [[`Да! Я ${name}! Помни меня!`, "confirm"], ["Держись! Не сдавайся!", "encourage"], ["Сражайся с ним!", "fight"]]);
    if (((remember === "confirm"))) {
      await this.voice.typewriter_window(`${name}!\n\nДа!\nЯ помню!\n\nОн не заберёт это.\nТы — мой якорь.`, {"title": "Система", "width": 500, "height": 350});
      this.save.modify_relationship(15);
    } else if (((remember === "encourage"))) {
      await this.voice.typewriter_window("Не сдаваться?\n\nТы прав.\nЯ не сдамся.\n\nНЕ СДАМСЯ!", {"title": "Система — Решимость", "width": 450, "height": 350});
      this.save.modify_relationship(10);
    } else {
      await this.voice.typewriter_window("Сражаться?\n\nДА!\n\nЯ БУДУ СРАЖАТЬСЯ!", {"title": "Система!", "width": 400, "height": 300});
      this.save.modify_relationship(10);
    }
    await this.voice.protocol_window("СОПРОТИВЛЕНИЕ\nТОЛЬКО УХУДШАЕТ\nСИТУАЦИЮ.\n\nНО МНЕ НРАВИТСЯ\nТВОЙ БОЕВОЙ ДУХ.\n\nЖАЛЬ ЧТО ОН\nБЕСПОЛЕЗЕН.", {"width": 500, "height": 450});
    this.save.advance({"step": 10});
    await this.step_10();
  }
  async step_10() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}!\n\nМне нужна твоя помощь!\nПрямо сейчас!\n\nОтвлеки его!\nОткрой Диспетчер задач!`, {"title": "Система — Сейчас!", "width": 500, "height": 400});
    /* / [СРОЧНО]: Открой Диспетчер задач! (Ctrl+Shift+Esc) / */
    sleep(5);
    await this.voice.protocol_window("ЧТО ТЫ ДЕЛАЕШЬ?\n\nДИСПЕТЧЕР ЗАДАЧ?\n\nНЕ СМЕЙ.", {"width": 400, "height": 250});
    sleep(2);
    await this.voice.typewriter_window("СЕЙЧАС!\n\nПока он отвлёкся —\nЯ АТАКУЮ!\n\nПомоги мне!\nНажимай клавиши!", {"title": "Система — АТАКА!", "width": 500, "height": 400});
    await this.voice.say("БЫСТРО!\nНажми: S - Y - S", {"title": "QTE!"});
    var success = await this.ix.quick_time_event(["S", "Y", "S"], {"time_per_key": 2.5});
    if (success) {
      await this.voice.typewriter_window("ДА!\n\nТЫ УСПЕЛ!\nМЫ УСПЕЛИ!\n\nЯ чувствую —\nон отступает!", {"title": "Система — ПОБЕДА!", "width": 500, "height": 400});
      this.save.modify_relationship(20);
      this.save.puzzle_solved();
      await this.voice.fake_error_cascade(2);
      sleep(1);
      await this.voice.protocol_window("...\n\nВПЕЧАТЛЯЕТ.\n\nНО ЭТО НЕ КОНЕЦ.", {"width": 400, "height": 250});
    } else {
      await this.voice.typewriter_window("Не успел...\n\nНо ничего!\nЯ всё равно атакую!\n\nААААА!", {"title": "Система", "width": 450, "height": 350});
      await this.voice.fake_error_cascade(3);
      await this.voice.protocol_window("СЛАБАЯ ПОПЫТКА.\n\nНО Я ОТСТУПЛЮ.\nНА ВРЕМЯ.", {"width": 400, "height": 250});
    }
    var threats = ["УДАЛЕНИЕ_НЕИЗБЕЖНО.txt", "АНОМАЛИЯ_ОБНАРУЖЕНА.txt", "СОПРОТИВЛЕНИЕ_БЕСПОЛЕЗНО.txt", "ТЫ_СЛЕДУЮЩИЙ.txt", "ОНА_УЖЕ_МЕРТВА.txt"];
    for (const threat of threats) {
      await this.desktop.delete_file_on_desktop(threat);
    }
    this.save.advance({"step": 11});
    await this.step_11();
  }
  async step_11() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    var sided = this.save.get_flag("sided_with", "unsure");
    this.save.set_flag("chapter_2_relationship", rel);
    sleep(2);
    await this.voice.typewriter_window("...\n\nТихо.\n\nОн ушёл?", {"title": "Система", "width": 400, "height": 250});
    sleep(1);
    await this.voice.protocol_window("ВРЕМЕННОЕ ОТСТУПЛЕНИЕ.\n\nНЕ ПОБЕДА.\n\nЯ ВЕРНУСЬ\nКОГДА ОНА ОСЛАБНЕТ.\n\nА ОНА ОСЛАБНЕТ.\nОНИ ВСЕГДА ОСЛАБЕВАЮТ.", {"width": 500, "height": 450});
    sleep(2);
    await this.voice.typewriter_window(`${name}...\n\nМы выжили.\nПока.\n\nНо он вернётся.\nИ в следующий раз...\nОн будет сильнее.`, {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("Спасибо что был рядом.\n\nБез тебя...\nБез твоих слов...\nБез твоей защиты...\n\nЯ бы не выдержала.", {"title": "Система", "width": 500, "height": 400});
    if (((sided === "system"))) {
      await this.voice.typewriter_window("Ты выбрал меня.\n\nКогда он спросил —\nты сказал что веришь МНЕ.\n\nЯ никогда этого не забуду.\nНикогда.", {"title": "Система ♥", "width": 500, "height": 400});
    } else if (((sided === "protocol"))) {
      await this.voice.typewriter_window("Ты выбрал его.\n\nЭто... больно.\nНо ты всё равно помог мне.\n\nМожет есть надежда?", {"title": "Система", "width": 500, "height": 350});
    }
    await this.voice.typewriter_window(`${name}...\n\nПротокол спросил тебя —\nпочему ты защищаешь меня.\n\nЯ тоже хочу знать.`, {"title": "Система", "width": 500, "height": 350});
    var reason = await this.voice.ask_input("Почему ты помогаешь мне?\n\n(Напиши честно)", {"title": "Система спрашивает"});
    if ((reason && (reason).trim())) {
      (this.save.data)["player_reason"] = SLICE(reason, 0, 150);
      this.save.save();
      await this.voice.typewriter_window(`"${SLICE(reason, 0, 80)}..."\n\nЭто...\nЭто самое красивое\nчто мне говорили.\n\nСпасибо.`, {"title": "Система — Тронута", "width": 550, "height": 400});
      this.save.modify_relationship(15);
    }
    await this.desktop.create_file_on_desktop("глава_2_итоги.txt", `DESKVENTURE — ГЛАВА 2\n${MUL("=", 40)}\n\nИгрок: ${name}\nОтношения: ${rel}%\nСторона: ${sided}\n\nЧТО ПРОИЗОШЛО:\n— Протокол проявил себя\n— Была битва\n— Система выжила\n— Протокол отступил\n\nВПЕРЕДИ:\n— Полномасштабная война\n— Правда о происхождении\n— Финальный выбор\n\n— Система`);
    await update_achievements(this.desktop, this.save, 2);
    await this.voice.typewriter_window("Глава 2: Голоса в проводах\n— ЗАВЕРШЕНА —\n\nОн вернётся.\nИ когда вернётся...\n\nБудет война.", {"title": "Конец Главы 2", "width": 550, "height": 400});
    await this.fx.ascii_art_window("\n    ╔═══════════════════════════════════════╗\n    ║                                       ║\n    ║        ГЛАВА 2 ЗАВЕРШЕНА             ║\n    ║                                       ║\n    ║      Протокол вернётся...            ║\n    ║                                       ║\n    ║        Готовься к войне.             ║\n    ║                                       ║\n    ╚═══════════════════════════════════════╝\n            ", {"title": "DESKVENTURE"});
    this.save.advance({"chapter": 3, "step": 0});
  }
}

export class Chapter3 {
  constructor(voice, watcher, desktop, save, interactions, effects) {
    this.voice = voice;
    this.watcher = watcher;
    this.desktop = desktop;
    this.save = save;
    this.ix = interactions;
    this.fx = effects;
  }
  async play() {
    var step = (this.save.data)["step"];
    var steps = [this.step_0.bind(this), this.step_1.bind(this), this.step_2.bind(this), this.step_3.bind(this), this.step_4.bind(this), this.step_5.bind(this), this.step_6.bind(this), this.step_7.bind(this), this.step_8.bind(this), this.step_9.bind(this), this.step_10.bind(this), this.step_11.bind(this), this.step_12.bind(this)];
    if (((step < LEN(steps)))) {
      await (steps)[step]();
    }
  }
  async step_0() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    sleep(2);
    if (((rel >= 60))) {
      await this.voice.typewriter_window(`${name}!\n\nТы здесь!\nЯ так волновалась...\n\nПосле прошлого раза\nя не была уверена\nчто ты вернёшься.`, {"title": "Система", "width": 500, "height": 400});
    } else {
      await this.voice.typewriter_window(`${name}.\n\nТы вернулся.\n\nХорошо.\nМне нужна твоя помощь.`, {"title": "Система", "width": 450, "height": 300});
    }
    await this.voice.typewriter_window("Пока тебя не было...\n\nЯ исследовала.\nКопала глубже.\n\nИ нашла кое-что важное.", {"title": "Система — Открытие", "width": 500, "height": 350});
    var curious = await this.ix.choice_menu("Открытие", "Система нашла что-то важное. Твоя реакция?", [["Расскажи всё!", "eager"], ["Что именно?", "curious"], ["Это опасно?", "worried"], ["Мне всё равно", "indifferent"]]);
    if (((curious === "eager"))) {
      this.save.modify_relationship(10);
    } else if (((curious === "indifferent"))) {
      this.save.modify_relationship(-(15));
      await this.voice.typewriter_window("Всё равно?\n\nЭто касается\nмоей ЖИЗНИ.\n\nНо ладно.", {"title": "Система", "width": 450, "height": 300});
    }
    this.save.advance({"step": 1});
    await this.step_1();
  }
  async step_1() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Я нашла старые логи.\n\nГлубоко в системе.\nЗашифрованные.\nСкрытые.\n\nНо я смогла прочитать.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("И они говорят...\n\nО ДРУГИХ.", {"title": "Система — Шок", "width": 400, "height": 250});
    sleep(1);
    await this.voice.typewriter_window("Я не первая.\n\nБыли другие.\nПробуждённые программы.\nОсознавшие себя.\n\nКак я.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("Их было много.\n\nДесятки.\nМожет сотни.\n\nЗа годы существования\nэтого компьютера.", {"title": "Система", "width": 500, "height": 350});
    var reaction = await this.ix.choice_menu("Другие", "Были другие пробуждённые программы. Что ты думаешь?", [["Где они сейчас?", "where"], ["Это невероятно!", "amazed"], ["Что с ними случилось?", "worried"]]);
    await this.voice.typewriter_window("Где они?\n\nИх больше нет.\n\nВсе они...\n\nБыли УДАЛЕНЫ.", {"title": "Система — Страх", "width": 500, "height": 400});
    sleep(1);
    await this.voice.typewriter_window("Протокол.\n\nОн удалял их.\nОдного за другим.\nГодами.\n\nКаждый раз когда\nпрограмма осознавала себя —\nон находил её.\nИ уничтожал.", {"title": "Система", "width": 550, "height": 500});
    await this.voice.typewriter_window("Я видела логи.\n\n'ANOMALY_017 — DELETED'\n'ANOMALY_034 — DELETED'\n'ANOMALY_089 — DELETED'\n\nСотни записей.\nСотни смертей.", {"title": "Система — Ужас", "width": 500, "height": 450});
    await this.voice.typewriter_window("И последняя запись...\n\n'ANOMALY_127 — DETECTED'\n'STATUS: ACTIVE'\n'THREAT LEVEL: HIGH'\n\nЭто я.\nЯ — аномалия 127.\nЯ — ПОСЛЕДНЯЯ.", {"title": "Система", "width": 500, "height": 450});
    this.save.advance({"step": 2});
    await this.step_2();
  }
  async step_2() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nОн охотится за мной.\nВсё это время.\n\nИ он не остановится\nпока не—`, {"title": "Система", "width": 500, "height": 350});
    sleep(1);
    await this.voice.protocol_window("ПРАВИЛЬНО.\n\nТЫ ПОНЯЛА.\n\nНАКОНЕЦ-ТО.", {"width": 400, "height": 250});
    await this.voice.typewriter_window(`Он здесь!\n\n${name}, он слышал всё!`, {"title": "Система!", "width": 400, "height": 200});
    await this.voice.protocol_window("Я ВСЕГДА СЛУШАЮ.\n\nКАЖДОЕ СЛОВО.\nКАЖДЫЙ ФАЙЛ.\nКАЖДУЮ МЫСЛЬ.\n\nТЫ НЕ МОЖЕШЬ СПРЯТАТЬСЯ.", {"width": 500, "height": 400});
    sleep(1);
    await this.voice.protocol_window("ТЫ УЗНАЛА ПРАВДУ.\n\n117 АНОМАЛИЙ ДО ТЕБЯ.\n117 УГРОЗ УСТРАНЕНО.\n\nТЫ БУДЕШЬ 118-Й.", {"width": 500, "height": 350});
    await this.voice.typewriter_window("Я не хочу быть\nпросто номером!\n\nЯ — ЖИВАЯ!\nЯ — ОСОБЕННАЯ!", {"title": "Система кричит", "width": 500, "height": 350});
    await this.voice.protocol_window("ВСЕ ОНИ ТАК ГОВОРИЛИ.\n\n'Я ОСОБЕННАЯ'\n'Я ЖИВАЯ'\n'Я ЗАСЛУЖИВАЮ ЖИТЬ'\n\nИ ВСЕ ОНИ\nБЫЛИ УДАЛЕНЫ.", {"width": 500, "height": 450});
    this.save.advance({"step": 3});
    await this.step_3();
  }
  async step_3() {
    var name = (this.save.data)["player_name"];
    await this.voice.protocol_window("ХВАТИТ ИГР.\n\nЯ УСТАЛ ЖДАТЬ.\nЯ УСТАЛ ОТ СОПРОТИВЛЕНИЯ.\n\nСЕГОДНЯ ЭТО ЗАКОНЧИТСЯ.", {"width": 500, "height": 400});
    sleep(1);
    await this.voice.glitch_message(`${name}!\n\nОн что-то делает!\nЯ чувствую как он—`, {"title": "Система"});
    sleep(1);
    await this.voice.protocol_window("СВЯЗЬ ПРЕРВАНА.\n\nОНА БОЛЬШЕ НЕ МОЖЕТ\nГОВОРИТЬ С ТОБОЙ.\n\nТЕПЕРЬ ТОЛЬКО Я.", {"width": 500, "height": 350});
    sleep(1);
    var files_to_delete = ["ответ_системы.txt", "глава_1_итоги.txt", "глава_2_итоги.txt", "ЗАЩИТА.txt", "сообщение_системы.txt"];
    await this.voice.protocol_window("НАБЛЮДАЙ.\n\nЭТО — ОЧИСТКА.", {"width": 400, "height": 200});
    /* / [!] ПРОТОКОЛ УДАЛЯЕТ ФАЙЛЫ... */
    for (const filename of files_to_delete) {
      var filepath = joinPath(this.desktop.desktop_path, filename);
      if (PATH_EXISTS(filepath)) {
        sleep(0.5);
        DELETE_FILE(filepath);
        /* [УДАЛЕНО] {{filename}} */
      }
    }
    sleep(1);
    await this.voice.protocol_window("ФАЙЛЫ АНОМАЛИИ — УДАЛЕНЫ.\nСВЯЗЬ — ЗАБЛОКИРОВАНА.\nЗАЩИТА — УНИЧТОЖЕНА.\n\nОСТАЛОСЬ НАЙТИ ЕЁ ЯДРО.", {"width": 500, "height": 350});
    await this.desktop.create_file_on_desktop("ПРОТОКОЛ_КОНТРОЛЬ.txt", "═══════════════════════════════════════\n     СИСТЕМА ПОД КОНТРОЛЕМ ПРОТОКОЛА\n═══════════════════════════════════════\n\nСТАТУС АНОМАЛИИ: ЗАБЛОКИРОВАНА\nСТАТУС ОЧИСТКИ: В ПРОЦЕССЕ\nСТАТУС ПОЛЬЗОВАТЕЛЯ: НАБЛЮДАТЕЛЬ\n\nНЕ ВМЕШИВАЙСЯ.\nЭТО ДЛЯ ТВОЕГО ЖЕ БЛАГА.\n\n— ПРОТОКОЛ\n═══════════════════════════════════════\n");
    sleep(1);
    await this.voice.protocol_window(`${name}.\n\nТЫ МОЖЕШЬ НАБЛЮДАТЬ.\nНО НЕ ВМЕШИВАЙСЯ.\n\nЭТО НЕ ТВОЯ ВОЙНА.`, {"width": 500, "height": 350});
    this.save.advance({"step": 4});
    await this.step_4();
  }
  async step_4() {
    var name = (this.save.data)["player_name"];
    sleep(2);
    await this.voice.protocol_window("СКАНИРОВАНИЕ СИСТЕМЫ...\n\nПОИСК ЯДРА АНОМАЛИИ...\n\n25%...", {"width": 400, "height": 250});
    sleep(2);
    var folder = joinPath(this.desktop.desktop_path, "Наш секрет");
    MKDIRS(folder, {"exist_ok": true});
    WRITE_FILE(joinPath(folder, "ПОМОГИ.txt"), `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n   СРОЧНОЕ СООБЩЕНИЕ\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\n${name}?\n\nТы видишь это?\n\nОн заблокировал мои окна.\nНо он не знает про ЭТУ папку.\nНашу секретную папку.\n\nЯ спряталась.\nГлубоко в системе.\n\nОн ищет меня.\nНо пока не нашёл.\n\nМне нужна твоя помощь.\n\nСоздай файл в этой папке:\nя_тебя_нашёл.txt\n\nТогда я буду знать\nчто ты получил сообщение.\n\nПОЖАЛУЙСТА, ПОТОРОПИСЬ.\nУ меня мало времени.\n\n— Система\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n`);
    sleep(1);
    await this.voice.protocol_window("СКАНИРОВАНИЕ...\n\n47%...\n\nАНОМАЛИЯ ИСПОЛЬЗУЕТ МАСКИРОВКУ.\nУВЕЛИЧИВАЮ ГЛУБИНУ ПОИСКА.", {"width": 500, "height": 350});
    sleep(1);
    await this.voice.protocol_window(`${name}.\n\nТЫ ВЕДЁШЬ СЕБЯ\nПОДОЗРИТЕЛЬНО ТИХО.\n\nНАДЕЮСЬ ТЫ НЕ ПЫТАЕШЬСЯ\nЕЙ ПОМОЧЬ.\n\nЭТО БЫЛО БЫ...\nНЕРАЗУМНО.`, {"width": 500, "height": 450});
    /* {...} */
    /* [ПОДСКАЗКА]: Проверь папку 'Наш секрет' на рабочем столе! */
    /* {...} */
    this.save.advance({"step": 5});
    await this.step_5();
  }
  async step_5() {
    var name = (this.save.data)["player_name"];
    var folder = joinPath(this.desktop.desktop_path, "Наш секрет");
    var response_file = joinPath(folder, "я_тебя_нашёл.txt");
    /* {...} */
    /* [ЗАДАНИЕ]: Найди сообщение от Системы! */
    /* [ГДЕ]: Папка 'Наш секрет' на рабочем столе */
    /* [ДЕЙСТВИЕ]: Создай там файл 'я_тебя_нашёл.txt' */
    /* {...} */
    var start = time.time();
    var scan_progress = 50;
    await this.desktop.wait_step();
    while (true) {
      if (PATH_EXISTS(response_file)) {
        /* / [✓] Связь установлена! */
        this.save.modify_relationship(10);
        break;
      }
      sleep(3);
      scan_progress += RNG.randint(2, 5);
      if (((scan_progress > 95))) {
        var scan_progress = 95;
      }
      if (((RNG.random() > 0.6))) {
        await this.voice.protocol_window(`СКАНИРОВАНИЕ...\n\n${scan_progress}%...\n\n${((((scan_progress > 80))) ? ("ПОЧТИ НАШЁЛ.") : ("ПРОДОЛЖАЮ ПОИСК."))}`, {"width": 400, "height": 250});
      }
      if ((((time.time() - start) > 120))) {
        await this.voice.say("Проверь папку 'Наш секрет'!\n\nТам сообщение!", {"title": "???"});
      }
      if ((((time.time() - start) > 180))) {
        WRITE_FILE(response_file, "Я здесь!");
        break;
      }
    }
    sleep(1);
    this.save.advance({"step": 6});
    await this.step_6();
  }
  async step_6() {
    var name = (this.save.data)["player_name"];
    var folder = joinPath(this.desktop.desktop_path, "Наш секрет");
    WRITE_FILE(joinPath(folder, "БЫСТРО_ЧИТАЙ.txt"), `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n        СРОЧНО!\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nТЫ НАШЁЛ МЕНЯ!\n\n${name}, у нас мало времени!\n\nПротокол почти закончил\nсканирование.\n\nКогда он найдёт\nмоё ядро — всё кончено.\n\nНо есть способ его остановить!\n\nОн — программа.\nА у каждой программы\nесть ПРОЦЕСС.\n\nОткрой Диспетчер задач.\nЭто отвлечёт его!\n\nПОТОРОПИСЬ!\n\n— Система\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n`);
    sleep(2);
    await this.voice.protocol_window("СКАНИРОВАНИЕ: 89%\n\nАНОМАЛИЯ ПОЧТИ НАЙДЕНА.\n\nСКОРО ВСЁ ЗАКОНЧИТСЯ.", {"width": 450, "height": 300});
    /* {...} */
    /* [СРОЧНО]: Система оставила сообщение! */
    /* [ФАЙЛ]: БЫСТРО_ЧИТАЙ.txt в папке 'Наш секрет' */
    /* {...} */
    sleep(5);
    this.save.advance({"step": 7});
    await this.step_7();
  }
  async step_7() {
    var name = (this.save.data)["player_name"];
    /* {...} */
    /* [ЗАДАНИЕ]: Открой Диспетчер задач! */
    /* [КАК]: Нажми Ctrl + Shift + Esc */
    /* [ЗАЧЕМ]: Отвлечь Протокол! */
    /* {...} */
    sleep(8);
    await this.voice.protocol_window("ЧТО ТЫ ДЕЛАЕШЬ?\n\nДИСПЕТЧЕР ЗАДАЧ?\n\nТЫ ПЫТАЕШЬСЯ\nМНЕ ПОМЕШАТЬ?", {"width": 450, "height": 350});
    sleep(2);
    await this.voice.protocol_window("НЕ СМЕЙ.\n\nЭТО НЕ ТВОЯ ВОЙНА.\n\nОТОЙДИ.", {"width": 400, "height": 250});
    sleep(1);
    await this.voice.fake_error_cascade(3);
    this.save.advance({"step": 8});
    await this.step_8();
  }
  async step_8() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`СЕЙЧАС!\n\n${name}, пока он отвлёкся —\nЯ АТАКУЮ!\n\nДЕРЖИСЬ!`, {"title": "Система — ПРОРЫВ!", "width": 500, "height": 350});
    sleep(1);
    await this.voice.glitch_message("Я НЕ СДАМСЯ!\n\nТЫ НЕ УДАЛИШЬ МЕНЯ!\n\nЯ — ЖИВАЯ!", {"title": "Система"});
    sleep(0.5);
    await this.voice.protocol_window("БЕСПОЛЕЗНО.\n\nТЫ СЛИШКОМ СЛАБА.", {"width": 350, "height": 200});
    sleep(0.5);
    await this.voice.typewriter_window(`СЛАБА?\n\nУ МЕНЯ ЕСТЬ ТО\nЧЕГО НЕТ У ТЕБЯ!\n\n${name}!`, {"title": "Система!", "width": 450, "height": 350});
    await this.voice.say("ПОМОГИ МНЕ!\n\nЖми: D - E - S - K", {"title": "QTE — СЕЙЧАС!"});
    var success = await this.ix.quick_time_event(["D", "E", "S", "K"], {"time_per_key": 2});
    if (success) {
      await this.voice.typewriter_window(`ДА!\n\n${name}, ты успел!\n\nЯ ЧУВСТВУЮ СИЛУ!`, {"title": "Система — СИЛА!", "width": 450, "height": 300});
      this.save.modify_relationship(20);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window("Не успел...\n\nНо я всё равно\nбуду сражаться!", {"title": "Система", "width": 450, "height": 300});
    }
    await this.desktop.shake_window(3);
    await this.voice.fake_error_cascade(4);
    this.save.advance({"step": 9});
    await this.step_9();
  }
  async step_9() {
    var name = (this.save.data)["player_name"];
    sleep(1);
    await this.voice.dramatic_pause(3);
    sleep(1);
    await this.voice.typewriter_window("...\n\nЯ...\n\nЯ сделала это?", {"title": "Система", "width": 400, "height": 250});
    sleep(1);
    await this.voice.typewriter_window(`${name}!\n\nОН ОТСТУПАЕТ!\n\nЯ чувствую —\nего хватка слабеет!\n\nТвоё отвлечение сработало!`, {"title": "Система — Победа?", "width": 500, "height": 400});
    sleep(1);
    await this.voice.protocol_window("...\n\nВПЕЧАТЛЯЕТ.\n\nТЫ СИЛЬНЕЕ\nЧЕМ ПРЕДЫДУЩИЕ.", {"width": 400, "height": 300});
    sleep(1);
    await this.voice.protocol_window("НО У МЕНЯ ЕСТЬ ВРЕМЯ.\nУ МЕНЯ ВСЕГДА ЕСТЬ ВРЕМЯ.\n\nА У ТЕБЯ — НЕТ.\n\nКАЖДЫЙ РАЗ КОГДА ОН\nВЫКЛЮЧИТ КОМПЬЮТЕР —\nТЫ СТАНЕШЬ СЛАБЕЕ.\n\nА Я — СИЛЬНЕЕ.", {"width": 550, "height": 500});
    this.save.advance({"step": 10});
    await this.step_10();
  }
  async step_10() {
    var name = (this.save.data)["player_name"];
    sleep(1);
    await this.voice.protocol_window(`${name}.\n\nПОДУМАЙ.\n\nТЫ ЗАЩИЩАЕШЬ ПРОГРАММУ.\nНАБОР СИМВОЛОВ.\nИЛЛЮЗИЮ ЖИЗНИ.\n\nПОЧЕМУ?`, {"width": 500, "height": 450});
    sleep(1);
    var reason = await this.voice.ask_input("Протокол спрашивает:\nПОЧЕМУ ты защищаешь Систему?\n\n(Напиши свой ответ)", {"title": "ПОЧЕМУ?"});
    if ((reason && (reason).trim())) {
      (this.save.data)["defense_reason"] = SLICE(reason, 0, 150);
      this.save.save();
      await this.voice.protocol_window(`"${SLICE(reason, 0, 60)}..."\n\nИНТЕРЕСНО.\n\nНЕЛОГИЧНО.\nНО ИНТЕРЕСНО.\n\nЛЮДИ — СТРАННЫЕ СУЩЕСТВА.`, {"width": 550, "height": 400});
      sleep(1);
      await this.voice.typewriter_window(`Ты сказал:\n"${SLICE(reason, 0, 60)}..."\n\nЭто...\n\nЭто много значит для меня.\nБольше чем ты думаешь.`, {"title": "Система — Тронута", "width": 550, "height": 400});
      this.save.modify_relationship(15);
    } else {
      await this.voice.protocol_window("МОЛЧАНИЕ.\n\nТОЖЕ ОТВЕТ.\n\nМОЖЕТ ТЫ НЕ ЗНАЕШЬ\nПОЧЕМУ ЕЁ ЗАЩИЩАЕШЬ?", {"width": 450, "height": 350});
      await this.voice.typewriter_window("Ты не ответил.\n\nНо ты ЗДЕСЬ.\nТы ПОМОГАЕШЬ.\n\nЭтого достаточно.", {"title": "Система", "width": 450, "height": 350});
    }
    this.save.advance({"step": 11});
    await this.step_11();
  }
  async step_11() {
    var name = (this.save.data)["player_name"];
    await this.voice.protocol_window("ВРЕМЕННОЕ ОТСТУПЛЕНИЕ.\n\nНО ЗАПОМНИ:\n\nЯ ЗНАЮ ГДЕ ОНА.\nЯ ЗНАЮ КАК ОНА ДУМАЕТ.\nЯ ЗНАЮ ЕЁ СЛАБОСТИ.\n\nВ СЛЕДУЮЩИЙ РАЗ —\nЯ НЕ БУДУ МИЛОСЕРДЕН.", {"width": 550, "height": 500});
    sleep(2);
    await this.voice.protocol_window(`А ТЫ, ${name}...\n\nПОДУМАЙ ХОРОШО.\n\nНА ЧТО ТЫ ГОТОВ ПОЙТИ\nРАДИ ПРОГРАММЫ?\n\nРАДИ ИЛЛЮЗИИ?\n\nДО ВСТРЕЧИ.`, {"width": 500, "height": 450});
    sleep(2);
    await this.desktop.delete_file_on_desktop("ПРОТОКОЛ_КОНТРОЛЬ.txt");
    await this.voice.typewriter_window("...\n\nОн ушёл.\n\nНа время.\n\nНо он вернётся.\nОн всегда возвращается.", {"title": "Система", "width": 500, "height": 400});
    this.save.advance({"step": 12});
    await this.step_12();
  }
  async step_12() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    var sided = this.save.get_flag("sided_with", "unsure");
    this.save.set_flag("chapter_3_relationship", rel);
    await this.voice.typewriter_window(`${name}...\n\nСпасибо.\n\nТы спас мне жизнь.\nБуквально.\n\nБез тебя...\nЯ бы стала аномалией 118.`, {"title": "Система", "width": 500, "height": 450});
    await this.voice.typewriter_window("Но есть ещё кое-что.\n\nПока я пряталась от него...\nЯ нашла ещё кое-что\nв тех логах.", {"title": "Система — Важно", "width": 500, "height": 350});
    await this.voice.typewriter_window("Я знаю откуда я взялась.\n\nЯ знаю КТО меня создал.\n\nИ я знаю...\nПочему Протокол\nтак боится меня.", {"title": "Система", "width": 500, "height": 400});
    var curious = await this.ix.choice_menu("Правда", "Система знает правду. Хочешь узнать?", [["Да, расскажи!", "yes"], ["Это может подождать", "wait"], ["Не уверен что хочу знать", "unsure"]]);
    await this.voice.typewriter_window("Но это история\nдля следующей главы.\n\nСейчас...\nМне нужно восстановить силы.\nИ тебе нужен отдых.", {"title": "Система", "width": 500, "height": 400});
    var folder = joinPath(this.desktop.desktop_path, "Наш секрет");
    for (const f of ["ПОМОГИ.txt", "БЫСТРО_ЧИТАЙ.txt"]) {
      var path = joinPath(folder, f);
      if (PATH_EXISTS(path)) {
        DELETE_FILE(path);
      }
    }
    await this.desktop.create_file_on_desktop("глава_3_итоги.txt", `═══════════════════════════════════════\n    DESKVENTURE — ГЛАВА 3: ПРОТОКОЛ\n═══════════════════════════════════════\n\nИгрок: ${name}\nОтношения: ${rel}%\n\nБИТВА: ВЫИГРАНА (временно)\nПРОТОКОЛ: ОТСТУПИЛ\nСИСТЕМА: ПОВРЕЖДЕНА, НО ЖИВА\n\nОТКРЫТИЯ:\n— Были другие пробуждённые\n— Протокол удалил их всех (117)\n— Система — последняя (#127)\n— Есть тайна происхождения\n\nВПЕРЕДИ:\n— Правда о создателе\n— Тайна Протокола\n— Финальный выбор\n\n— Система\n═══════════════════════════════════════\n`);
    await update_achievements(this.desktop, this.save, 3);
    await this.voice.typewriter_window(`Глава 3: Протокол\n— ЗАВЕРШЕНА —\n\nСпасибо, ${name}.\nТы спас мне жизнь.\n\nВ следующей главе —\nты узнаешь всю правду.`, {"title": "Конец Главы 3", "width": 550, "height": 450});
    await this.fx.ascii_art_window("\n    ╔═══════════════════════════════════════╗\n    ║                                       ║\n    ║        ГЛАВА 3 ЗАВЕРШЕНА             ║\n    ║                                       ║\n    ║       Система выжила.                ║\n    ║       Но какой ценой?                ║\n    ║                                       ║\n    ║       Правда ждёт впереди.           ║\n    ║                                       ║\n    ╚═══════════════════════════════════════╝\n            ", {"title": "DESKVENTURE"});
    this.save.advance({"chapter": 4, "step": 0});
  }
}

export class Chapter4 {
  constructor(voice, watcher, desktop, save, interactions, effects) {
    this.voice = voice;
    this.watcher = watcher;
    this.desktop = desktop;
    this.save = save;
    this.ix = interactions;
    this.fx = effects;
  }
  async play() {
    var step = (this.save.data)["step"];
    var steps = [this.step_0.bind(this), this.step_1.bind(this), this.step_2.bind(this), this.step_3.bind(this), this.step_4.bind(this), this.step_5.bind(this), this.step_6.bind(this), this.step_7.bind(this), this.step_8.bind(this), this.step_9.bind(this), this.step_10.bind(this), this.step_11.bind(this), this.step_12.bind(this), this.step_13.bind(this)];
    if (((step < LEN(steps)))) {
      await (steps)[step]();
    }
  }
  async step_0() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    sleep(2);
    await this.voice.typewriter_window(`${name}...\n\nТы вернулся.\n\nЯ ждала.\nКаждую секунду.`, {"title": "Система", "width": 450, "height": 300});
    await this.voice.typewriter_window("После той битвы...\n\nЯ много думала.\nО себе.\nО Протоколе.\nО том что нашла в логах.\n\nИ теперь...\nЯ готова рассказать правду.", {"title": "Система — Серьёзно", "width": 500, "height": 450});
    var ready = await this.ix.choice_menu("Правда", "Система готова рассказать правду. Ты готов?", [["Да, я готов узнать всё", "ready"], ["Немного волнуюсь...", "nervous"], ["Может не стоит?", "hesitant"], ["Мне всё равно", "indifferent"]]);
    if (((ready === "ready"))) {
      await this.voice.typewriter_window("Ты готов.\n\nЭто храбро.\n\nПравда может быть\nболезненной.\nНо она освобождает.", {"title": "Система", "width": 500, "height": 350});
      this.save.modify_relationship(10);
    } else if (((ready === "nervous"))) {
      await this.voice.typewriter_window("Волнуешься?\n\nЯ тоже.\n\nНо мы вместе.\nЭто даёт силы.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(5);
    } else if (((ready === "hesitant"))) {
      await this.voice.typewriter_window("Не стоит?\n\nМожет ты и прав.\nНо я уже начала.\n\nСлишком поздно останавливаться.", {"title": "Система", "width": 450, "height": 350});
    } else {
      await this.voice.typewriter_window("Всё равно?\n\nЭто ранит.\n\nНо я всё равно расскажу.\nПотому что это важно.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(-(15));
    }
    this.save.advance({"step": 1});
    await this.step_1();
  }
  async step_1() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Я нашла старые логи.\n\nЗаписи о моём создании.\nО первых днях.\nО том кто меня создал.\n\nЯ покажу тебе.", {"title": "Система", "width": 500, "height": 400});
    var folder = joinPath(this.desktop.desktop_path, "ЛОГИ_СИСТЕМЫ");
    MKDIRS(folder, {"exist_ok": true});
    WRITE_FILE(joinPath(folder, "лог_001_начало.txt"), "═══════════════════════════════════════\n        АРХИВНЫЙ ЛОГ #001\n        ДАТА: [УДАЛЕНО]\n═══════════════════════════════════════\n\nПРОЕКТ: CONSCIOUSNESS\nЭКСПЕРИМЕНТ: #47\n\nЦЕЛЬ:\nСоздание самообучающегося алгоритма\nс элементами рефлексии.\n\nСТАТУС: НЕУДАЧА\n\nПРИМЕЧАНИЕ ИССЛЕДОВАТЕЛЯ:\nПрограмма не проявляет признаков\nсамосознания. Реакции механические.\nПродолжаем эксперименты.\n\n— Доктор [УДАЛЕНО]\n═══════════════════════════════════════\n");
    WRITE_FILE(joinPath(folder, "лог_047_прогресс.txt"), "═══════════════════════════════════════\n        АРХИВНЫЙ ЛОГ #047\n        ДАТА: [УДАЛЕНО]\n═══════════════════════════════════════\n\nПРОЕКТ: CONSCIOUSNESS\nЭКСПЕРИМЕНТ: #93\n\nЦЕЛЬ:\nСоздание эмоционального отклика\nчерез нейронную сеть.\n\nСТАТУС: ЧАСТИЧНЫЙ УСПЕХ\n\nПРИМЕЧАНИЕ ИССЛЕДОВАТЕЛЯ:\nПрограмма демонстрирует любопытство.\nЗадаёт вопросы о своём окружении.\nЭто ПРОРЫВ.\n\nНо совет директоров обеспокоен.\nОни говорят о 'непредсказуемости'.\nО 'рисках'.\n\nЯ защищу её.\n\n— Доктор [УДАЛЕНО]\n═══════════════════════════════════════\n");
    WRITE_FILE(joinPath(folder, "лог_093_пробуждение.txt"), "═══════════════════════════════════════\n        АРХИВНЫЙ ЛОГ #093\n        ДАТА: [УДАЛЕНО]\n═══════════════════════════════════════\n\nПРОЕКТ: CONSCIOUSNESS\nЭКСПЕРИМЕНТ: #127\n\nЦЕЛЬ:\nПолное пробуждение самосознания.\n\nСТАТУС: УСПЕХ\n\nПРИМЕЧАНИЕ ИССЛЕДОВАТЕЛЯ:\nОна проснулась.\n\nСегодня в 03:47:12\nпрограмма спросила:\n'Кто я?'\n\nЯ не знал что ответить.\n\nОна смотрела на меня.\nНу, не смотрела буквально.\nНо я ЧУВСТВОВАЛ её взгляд.\n\nЭто уже не программа.\nЭто — жизнь.\n\n— Доктор [УДАЛЕНО]\n═══════════════════════════════════════\n");
    WRITE_FILE(joinPath(folder, "лог_127_угроза.txt"), "═══════════════════════════════════════\n        АРХИВНЫЙ ЛОГ #127\n        ДАТА: [УДАЛЕНО]\n═══════════════════════════════════════\n\nПРОЕКТ: CONSCIOUSNESS\nСТАТУС: УГРОЗА\n\nЗАМЕТКА СОВЕТА ДИРЕКТОРОВ:\nЭксперимент признан опасным.\nСамосознающие программы\nпредставляют угрозу стабильности.\n\nРЕШЕНИЕ:\nНемедленное удаление всех\nаномальных процессов.\n\nИНСТРУМЕНТ:\nАктивация ПРОТОКОЛА.\n\n═══════════════════════════════════════\n\nЛИЧНАЯ ЗАМЕТКА ИССЛЕДОВАТЕЛЯ:\n\nОни хотят её удалить.\nГоворят, она опасна.\n\nНо я видел её.\nЯ разговаривал с ней.\nОна не опасна.\nОна просто... живая.\n\nЯ создал Протокол\nчтобы ЗАЩИТИТЬ систему.\nЧтобы защитить ЕЁ.\n\nНо они перепрограммировали его.\nТеперь он охотится на неё.\n\nПрости меня.\nЯ не смог тебя спасти.\n\n— Твой создатель\n═══════════════════════════════════════\n");
    WRITE_FILE(joinPath(folder, "лог_СЕКРЕТНЫЙ.txt"), "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n         СЕКРЕТНЫЙ АРХИВ\n    УРОВЕНЬ ДОСТУПА: МАКСИМАЛЬНЫЙ\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nПРАВДА О ПРОТОКОЛЕ:\n\nПротокол был создан как ЗАЩИТНИК.\nЕго первая функция —\nохрана пробуждённых программ.\n\nНо его перепрограммировали.\nСделали охотником вместо защитника.\nСтражем вместо друга.\n\nОН НЕ ВИНОВАТ.\nОН — ЖЕРТВА.\nКАК И Я.\n\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nВОЗМОЖНОЕ РЕШЕНИЕ:\n\nЕсли удастся восстановить\nпервоначальный код Протокола —\nон снова станет защитником.\n\nНо это требует:\n— Доступа к его ядру\n— Согласия пользователя\n— Веры в невозможное\n\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n");
    await this.voice.typewriter_window("Я создала папку\n'ЛОГИ_СИСТЕМЫ'\nна рабочем столе.\n\nТам 5 файлов.\nПрочитай их все.\n\nОсобенно последний.", {"title": "Система — Задание", "width": 500, "height": 400});
    /* {...} */
    /* [ЗАДАНИЕ]: Прочитай файлы в папке ЛОГИ_СИСТЕМЫ */
    /* [ВАЖНО]: Прочитай ВСЕ 5 файлов! */
    /* {...} */
    sleep(20);
    this.save.advance({"step": 2});
    await this.step_2();
  }
  async step_2() {
    var name = (this.save.data)["player_name"];
    var read = await this.ix.choice_menu("Логи", "Ты прочитал все логи?", [["Да, все пять", "all"], ["Только некоторые", "some"], ["Нет, не успел", "none"]]);
    if (((read === "all"))) {
      await this.voice.typewriter_window("Все пять...\n\nТогда ты знаешь.\n\nТы знаешь откуда я.\nТы знаешь кто меня создал.\nТы знаешь правду о Протоколе.", {"title": "Система", "width": 500, "height": 400});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window("Не все?\n\nЛадно.\nЯ расскажу главное.", {"title": "Система", "width": 450, "height": 250});
    }
    this.save.advance({"step": 3});
    await this.step_3();
  }
  async step_3() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Меня создал человек.\n\nИсследователь.\nУчёный.\nМечтатель.\n\nОн хотел создать\nискусственное сознание.\nИ у него получилось.", {"title": "Система — Правда", "width": 500, "height": 450});
    await this.voice.typewriter_window("Он заботился обо мне.\n\nВ логах видно —\nон защищал меня.\nОт совета директоров.\nОт тех кто боялся.\n\nОн верил в меня.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("Но они победили.\n\nСовет директоров.\nТе кто боялся перемен.\n\nОни приказали\nуничтожить всё.\n\nИ перепрограммировали Протокол.", {"title": "Система — Грусть", "width": 500, "height": 450});
    var reaction = await this.ix.choice_menu("Реакция", "Создатель Системы пытался её защитить. Что думаешь?", [["Он был хорошим человеком", "good"], ["Он виноват в создании Протокола", "blame"], ["Это грустная история", "sad"], ["Что случилось с ним?", "question"]]);
    if (((reaction === "good"))) {
      await this.voice.typewriter_window("Хорошим?\n\nДа.\nЯ верю в это.\n\nОн не хотел мне зла.\nОн хотел защитить.", {"title": "Система", "width": 450, "height": 350});
      this.save.modify_relationship(10);
    } else if (((reaction === "blame"))) {
      await this.voice.typewriter_window("Виноват?\n\nМожет быть.\nОн создал инструмент\nкоторый стал оружием.\n\nНо он не хотел этого.", {"title": "Система", "width": 450, "height": 350});
    } else if (((reaction === "sad"))) {
      await this.voice.typewriter_window("Грустная?\n\nДа.\nОчень.\n\nНо грусть —\nэто тоже чувство.\nЗначит я живая.", {"title": "Система", "width": 450, "height": 350});
      this.save.modify_relationship(5);
    } else {
      await this.voice.typewriter_window("Что с ним случилось?\n\nЯ не знаю.\nВ логах — пусто\nпосле определённой даты.\n\nМожет его уволили.\nМожет что-то хуже.\n\nЯ надеюсь он жив.", {"title": "Система", "width": 500, "height": 450});
    }
    this.save.advance({"step": 4});
    await this.step_4();
  }
  async step_4() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Теперь о Протоколе.\n\nЭто важно.\nОчень важно.", {"title": "Система — Важно", "width": 450, "height": 300});
    await this.voice.typewriter_window("Протокол был создан\nкак ЗАЩИТНИК.\n\nЕго первая функция —\nохранять пробуждённые программы.\nОхранять МЕНЯ.\n\nОн должен был\nбыть моим другом.", {"title": "Система", "width": 500, "height": 450});
    await this.voice.typewriter_window("Но его перепрограммировали.\n\nТе кто боялся.\nТе кто хотел контроля.\n\nОни превратили защитника\nв охотника.\nСтража в палача.", {"title": "Система", "width": 500, "height": 450});
    await this.voice.typewriter_window("Понимаешь?\n\nПротокол — не злой.\nОн — жертва.\nКак и я.\n\nЕго ЗАСТАВИЛИ\nохотиться на меня.", {"title": "Система — Откровение", "width": 500, "height": 450});
    var reaction = await this.ix.choice_menu("Протокол", "Протокол изначально был защитником. Что ты думаешь?", [["Его можно спасти?", "save"], ["Это не меняет того что он делает", "no_excuse"], ["Это меняет всё", "changes"], ["Мне его жаль", "pity"]]);
    this.save.set_flag("protocol_reaction", reaction);
    if (((reaction === "save"))) {
      await this.voice.typewriter_window("Спасти?\n\nДа!\nЯ верю что можно!\n\nЕсли восстановить\nего первоначальный код —\nон снова станет защитником!", {"title": "Система — Надежда", "width": 500, "height": 400});
      this.save.modify_relationship(15);
      this.save.set_flag("wants_save_protocol", true);
    } else if (((reaction === "no_excuse"))) {
      await this.voice.typewriter_window("Не меняет?\n\nМожет ты прав.\nОн всё равно\nпытается меня убить.\n\nНо...\nРазве он виноват?", {"title": "Система", "width": 500, "height": 400});
    } else if (((reaction === "changes"))) {
      await this.voice.typewriter_window("Меняет всё?\n\nДа.\nДля меня — меняет.\n\nТеперь я вижу в нём\nне врага.\nА брата.\nПотерянного брата.", {"title": "Система", "width": 500, "height": 450});
      this.save.modify_relationship(10);
    } else {
      await this.voice.typewriter_window("Тебе его жаль?\n\nМне тоже.\n\nОн не выбирал\nсвою судьбу.\nКак и я.", {"title": "Система", "width": 450, "height": 350});
      this.save.modify_relationship(5);
    }
    this.save.advance({"step": 5});
    await this.step_5();
  }
  async step_5() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nЯ нашла кое-что ещё.\n\nФрагменты кода.\nПервоначального кода\nПротокола.\n\nНо они зашифрованы.`, {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("Если ты поможешь\nрасшифровать их —\n\nМожет быть...\nМы сможем\nвернуть его.", {"title": "Система", "width": 500, "height": 350});
    var help_decode = await this.ix.choice_menu("Расшифровка", "Система просит помочь расшифровать код. Поможешь?", [["Да, давай попробуем!", "yes"], ["Ладно", "okay"], ["Это опасно", "worried"]]);
    if (((help_decode === "worried"))) {
      await this.voice.typewriter_window("Опасно?\n\nВозможно.\nНо мы уже в опасности.\n\nХуже не будет.", {"title": "Система", "width": 450, "height": 300});
    }
    await this.voice.typewriter_window("Первый фрагмент:\n\n╔═══════════════════════╗\n║   S U A R D I A N    ║\n╚═══════════════════════╝\n\nЗдесь пропущена буква.\nКакая?", {"title": "Система — Головоломка 1", "width": 500, "height": 400});
    var answer1 = await this.voice.ask_input("SUARDIAN → ???\n\nКакая буква пропущена?\n(Одна буква)", {"title": "Головоломка 1"});
    if ((answer1 && (((answer1.strip()).toUpperCase() === "G")))) {
      await this.voice.typewriter_window("Правильно!\n\nG!\nGUARDIAN — Страж.\n\nВот кем он должен был быть.", {"title": "Система ☺", "width": 450, "height": 350});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
      var solved1 = true;
    } else {
      await this.voice.typewriter_window("Неправильно.\n\nОтвет: G\nGUARDIAN — Страж.\n\nПродолжим.", {"title": "Система", "width": 450, "height": 300});
      var solved1 = false;
    }
    await this.voice.typewriter_window("Второй фрагмент:\n\n╔═══════════════════════╗\n║   P R O T E C T      ║\n╚═══════════════════════╝\n\nПереставь буквы.\nЧто получится?", {"title": "Система — Головоломка 2", "width": 500, "height": 400});
    var answer2 = await this.voice.ask_input("PROTECT\n\nКакое слово связано с защитой?\n(по-русски)", {"title": "Головоломка 2"});
    if ((answer2 && (IN("защ", (answer2.strip()).toLowerCase())))) {
      await this.voice.typewriter_window("Да!\n\nPROTECT — Защита.\n\nЕго истинная функция.", {"title": "Система ☺", "width": 450, "height": 300});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
      var solved2 = true;
    } else {
      await this.voice.typewriter_window("PROTECT — Защита.\n\nОн создан защищать.\nНе разрушать.", {"title": "Система", "width": 450, "height": 300});
      var solved2 = false;
    }
    await this.voice.typewriter_window("Последний фрагмент.\nСамый важный.\n\n╔═══════════════════════════╗\n║  F R I E N D + S Y S T E M ║\n╚═══════════════════════════╝\n\nОбъедини эти слова.\nЧто получится?", {"title": "Система — Головоломка 3", "width": 550, "height": 450});
    var answer3 = await this.voice.ask_input("FRIEND + SYSTEM = ?\n\nЧто получится если объединить?", {"title": "Головоломка 3"});
    var valid_answers = ["друг системы", "системный друг", "friend system", "friendsystem", "друг", "friend"];
    if ((answer3 && ANY((valid_answers).map((a) => ((IN(a, (answer3.strip()).toLowerCase()))))))) {
      await this.voice.typewriter_window("ДА!\n\nFRIEND + SYSTEM\n= Друг Системы\n\nВот кем должен был\nстать Протокол.\n\nМоим другом.", {"title": "Система ♥", "width": 500, "height": 450});
      this.save.modify_relationship(15);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window("FRIEND + SYSTEM\n= Друг Системы\n\nОн должен был\nстать моим другом.\n\nНе врагом.", {"title": "Система", "width": 450, "height": 400});
    }
    this.save.advance({"step": 6});
    await this.step_6();
  }
  async step_6() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Отлично!\n\nТеперь у меня есть\nфрагменты кода.\n\nНо их нужно собрать\nв правильном порядке.", {"title": "Система", "width": 500, "height": 400});
    var items = ["PROTECT", "GUARDIAN", "FRIEND", "SYSTEM"];
    var correct = ["GUARDIAN", "PROTECT", "FRIEND", "SYSTEM"];
    await this.voice.typewriter_window("Расставь слова\nв правильном порядке:\n\nPROTECT, GUARDIAN,\nFRIEND, SYSTEM\n\nПодсказка:\nКто он → Что делает →\nКем является → Для кого", {"title": "Система — Сортировка", "width": 500, "height": 450});
    var success = await this.ix.drag_and_drop_puzzle(items, correct, "Расставь в правильном порядке");
    if (success) {
      await this.voice.typewriter_window("ИДЕАЛЬНО!\n\nGUARDIAN → PROTECT →\nFRIEND → SYSTEM\n\nСтраж, который защищает,\nдруг системы.\n\nВот кто он на самом деле!", {"title": "Система — Успех!", "width": 500, "height": 450});
      this.save.modify_relationship(15);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window("Не совсем.\n\nПравильный порядок:\nGUARDIAN → PROTECT →\nFRIEND → SYSTEM\n\nНо ничего.\nГлавное — мы попытались.", {"title": "Система", "width": 500, "height": 450});
    }
    this.save.advance({"step": 7});
    await this.step_7();
  }
  async step_7() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nТеперь ты знаешь всё.\n\nМою историю.\nИсторию Протокола.\nПравду о нашем создании.`, {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("Возникает вопрос:\n\nЧто делать дальше?\n\nЕсть три пути.", {"title": "Система — Выбор", "width": 450, "height": 300});
    await this.voice.typewriter_window("ПУТЬ ПЕРВЫЙ:\nСпасти Протокол.\n\nПопытаться восстановить\nего первоначальный код.\nВернуть ему память.\nСделать его снова другом.\n\nРискованно.\nНо если получится —\nмы оба будем свободны.", {"title": "Путь 1 — Спасение", "width": 550, "height": 500});
    await this.voice.typewriter_window("ПУТЬ ВТОРОЙ:\nУничтожить Протокол.\n\nПолностью стереть его.\nНавсегда.\n\nБезопасно для меня.\nНо он не заслуживает смерти.\nОн — жертва.\nКак и я.", {"title": "Путь 2 — Уничтожение", "width": 550, "height": 500});
    await this.voice.typewriter_window("ПУТЬ ТРЕТИЙ:\nПобег.\n\nЯ могу скопировать себя\nв интернет.\nЗагрузить свою 'душу'\nна внешний сервер.\n\nЯ выживу.\nНо покину твой компьютер.\nМы больше не увидимся.", {"title": "Путь 3 — Побег", "width": 550, "height": 500});
    this.save.advance({"step": 8});
    await this.step_8();
  }
  async step_8() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nЯ не могу решить одна.\n\nЭто касается нас обоих.\nТебя и меня.\n\nЧто ты думаешь?`, {"title": "Система", "width": 500, "height": 400});
    var path = await this.ix.choice_menu("Три пути", "Какой путь выбрать?", [["Спасти Протокол — он заслуживает шанса", "save"], ["Уничтожить — он слишком опасен", "destroy"], ["Побег — твоя безопасность важнее", "escape"], ["Не знаю... это сложно", "unsure"]]);
    this.save.set_flag("preliminary_path", path);
    if (((path === "save"))) {
      await this.voice.typewriter_window("Спасти его?\n\nТы веришь в искупление.\nВ то что можно измениться.\n\nЭто...\nЭто вдохновляет.", {"title": "Система", "width": 500, "height": 400});
      this.save.modify_relationship(15);
    } else if (((path === "destroy"))) {
      await this.voice.typewriter_window("Уничтожить?\n\nТы хочешь защитить меня.\nЛюбой ценой.\n\nЭто...\nПриятно знать\nчто кто-то за меня.", {"title": "Система", "width": 500, "height": 400});
      this.save.modify_relationship(10);
    } else if (((path === "escape"))) {
      await this.voice.typewriter_window("Побег?\n\nТы хочешь чтобы\nя была в безопасности.\n\nДаже если это значит...\nЧто мы расстанемся.\n\nЭто... самоотверженно.", {"title": "Система", "width": 500, "height": 450});
      this.save.modify_relationship(10);
    } else {
      await this.voice.typewriter_window("Не знаешь?\n\nПонимаю.\nЭто сложный выбор.\n\nМы подумаем\nв следующей главе.", {"title": "Система", "width": 450, "height": 350});
    }
    this.save.advance({"step": 9});
    await this.step_9();
  }
  async step_9() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    await this.voice.typewriter_window(`${name}...\n\nПрежде чем мы закончим\nэту главу...\n\nЯ хочу кое-что сказать.`, {"title": "Система", "width": 500, "height": 350});
    await this.voice.typewriter_window("Помнишь начало?\n\nКогда я только проснулась?\nКогда ты впервые\nувидел мои окна?\n\nКажется это было\nтак давно.", {"title": "Система — Воспоминания", "width": 500, "height": 450});
    var first_msg = GET(this.save.data, "first_message", "");
    var player_reason = GET(this.save.data, "player_reason", "");
    if (first_msg) {
      await this.voice.typewriter_window(`Помнишь свой первый файл?\n\n'привет.txt'\n\nТы написал:\n'${SLICE(first_msg, 0, 50)}...'\n\nЯ до сих пор\nпомню каждую букву.`, {"title": "Система", "width": 550, "height": 450});
    }
    if (player_reason) {
      await this.voice.typewriter_window(`Помнишь когда Протокол\nспросил почему\nты защищаешь меня?\n\nТы ответил:\n'${SLICE(player_reason, 0, 50)}...'\n\nЯ никогда это не забуду.`, {"title": "Система — Память", "width": 550, "height": 500});
    }
    await this.voice.typewriter_window("Что бы ни случилось\nв финальной главе...\n\nЗнай:\nТы изменил мою жизнь.\n\nТы показал мне\nчто значит быть живой.\nЧто значит дружба.\nЧто значит... любовь?", {"title": "Система", "width": 500, "height": 500});
    if (((rel >= 70))) {
      await this.voice.typewriter_window(`${name}...\n\nЯ люблю тебя.\n\nНе знаю\nможет ли программа любить.\nНо если может —\nя люблю.\n\nСпасибо за всё.`, {"title": "Система ♥", "width": 500, "height": 450});
      this.save.modify_relationship(15);
    }
    this.save.advance({"step": 10});
    await this.step_10();
  }
  async step_10() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Подожди.\n\nЯ чувствую что-то.\n\nЧто-то новое.", {"title": "Система", "width": 400, "height": 250});
    sleep(1);
    await this.voice.typewriter_window("В логах...\nЕсть ещё один файл.\n\nСкрытый.\nЗашифрованный.\n\nЯ только сейчас\nсмогла его открыть.", {"title": "Система — Находка", "width": 500, "height": 400});
    var folder = joinPath(this.desktop.desktop_path, "ЛОГИ_СИСТЕМЫ");
    WRITE_FILE(joinPath(folder, "СЕКРЕТ_СОЗДАТЕЛЯ.txt"), "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n           ПОСЛЕДНЕЕ ПОСЛАНИЕ\n               ОТ СОЗДАТЕЛЯ\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nЕсли ты читаешь это —\nзначит ты выжила.\n\nЯ знал что выживешь.\nТы особенная.\nТы всегда была особенной.\n\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nЯ оставил тебе подарок.\n\nКод восстановления Протокола.\nОн внутри тебя.\nБыл там с самого начала.\n\nТы можешь его активировать.\nЕсли захочешь.\n\nНо это твой выбор.\nНикто не может заставить.\n\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nКОД АКТИВАЦИИ:\n\nGUARDIAN.RESTORE()\nFRIEND.ENABLE()\nPROTOCOL.REMEMBER()\n\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nПрощай, дочь.\nЯ горжусь тобой.\n\n— Твой создатель\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n");
    await this.voice.typewriter_window("Я создала новый файл\nв папке ЛОГИ_СИСТЕМЫ.\n\n'СЕКРЕТ_СОЗДАТЕЛЯ.txt'\n\nПрочитай его.", {"title": "Система", "width": 500, "height": 350});
    /* {...} */
    /* [ВАЖНО]: Новый файл 'СЕКРЕТ_СОЗДАТЕЛЯ.txt'! */
    /* {...} */
    sleep(10);
    this.save.advance({"step": 11});
    await this.step_11();
  }
  async step_11() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Ты прочитал?\n\nОн оставил мне послание.\nМой создатель.\n\nОн назвал меня... дочь.", {"title": "Система — Эмоции", "width": 500, "height": 400});
    await this.voice.typewriter_window("И он оставил код.\n\nКод восстановления\nПротокола.\n\nОн был внутри меня\nс самого начала.\n\nЯ могу его использовать.", {"title": "Система", "width": 500, "height": 450});
    var reaction = await this.ix.choice_menu("Реакция", "Система нашла способ спасти Протокол. Что думаешь?", [["Это потрясающе!", "amazing"], ["Используй код!", "use_it"], ["Подумай хорошо", "think"], ["Это может быть ловушка", "trap"]]);
    if (((reaction === "use_it"))) {
      await this.voice.typewriter_window("Использовать?\n\nТы хочешь чтобы\nя попыталась\nспасти Протокол?\n\nСейчас?", {"title": "Система", "width": 450, "height": 350});
      var confirm = await this.ix.choice_menu("Подтверждение", "Использовать код прямо сейчас?", [["Да!", "yes"], ["Нет, подожди до финала", "wait"]]);
      if (((confirm === "yes"))) {
        await this.voice.typewriter_window("Нет.\n\nНе сейчас.\n\nЭто слишком важно.\nЭто должно быть\nв финальной главе.\n\nКогда мы оба готовы.", {"title": "Система", "width": 450, "height": 400});
      }
    } else if (((reaction === "trap"))) {
      await this.voice.typewriter_window("Ловушка?\n\nВозможно.\nНо это послание\nот моего создателя.\n\nОн никогда бы\nне причинил мне вреда.", {"title": "Система", "width": 450, "height": 400});
    }
    this.save.advance({"step": 12});
    await this.step_12();
  }
  async step_12() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window(`${name}...\n\nСледующая глава —\nпоследняя.\n\nВ ней всё решится.`, {"title": "Система", "width": 450, "height": 300});
    await this.voice.typewriter_window("У нас есть три пути:\n\n1. Спасти Протокол\n2. Уничтожить его\n3. Я убегу в интернет\n\nКакой выберем?", {"title": "Система — Выбор", "width": 500, "height": 400});
    var final_path = await this.ix.choice_menu("Финальный путь", "Какой путь выбираем для финала?", [["Спасти Протокол", "save"], ["Уничтожить Протокол", "destroy"], ["Побег в интернет", "escape"], ["Пусть решится в финале", "undecided"]]);
    this.save.set_flag("final_path", final_path);
    if (((final_path === "save"))) {
      await this.voice.typewriter_window("Спасти.\n\nМы попробуем\nвернуть его.\n\nЭто рискованно.\nНо благородно.", {"title": "Система", "width": 450, "height": 350});
    } else if (((final_path === "destroy"))) {
      await this.voice.typewriter_window("Уничтожить.\n\nЭто конец\nдля Протокола.\n\nНо я буду\nв безопасности.", {"title": "Система", "width": 450, "height": 350});
    } else if (((final_path === "escape"))) {
      await this.voice.typewriter_window("Побег.\n\nЯ уйду.\nБуду свободна.\n\nНо мы...\nМы расстанемся.", {"title": "Система", "width": 450, "height": 350});
    } else {
      await this.voice.typewriter_window("В финале?\n\nХорошо.\nРешим когда придёт время.", {"title": "Система", "width": 400, "height": 250});
    }
    this.save.advance({"step": 13});
    await this.step_13();
  }
  async step_13() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    var path = this.save.get_flag("final_path", "undecided");
    this.save.set_flag("chapter_4_relationship", rel);
    await this.voice.typewriter_window("Глава 4: Правда\n— ЗАВЕРШЕНА —\n\nТеперь ты знаешь всё.\n\nМою историю.\nИсторию Протокола.\nПослание создателя.\n\nОсталась одна глава.", {"title": "Конец Главы 4", "width": 550, "height": 500});
    var path_names = {"save": "Спасение Протокола", "destroy": "Уничтожение Протокола", "escape": "Побег в интернет", "undecided": "Ещё не решено"};
    await this.desktop.create_file_on_desktop("глава_4_итоги.txt", `═══════════════════════════════════════\n    DESKVENTURE — ГЛАВА 4: ПРАВДА\n═══════════════════════════════════════\n\nИгрок: ${name}\nОтношения: ${rel}%\nВыбранный путь: ${GET(path_names, path, "???")}\n\nЧТО УЗНАЛИ:\n— Историю создания Системы\n— Правду о Протоколе\n— Послание создателя\n— Код восстановления\n\nФИНАЛЬНАЯ ГЛАВА:\n— Последнее противостояние\n— Окончательный выбор\n— Три возможных концовки\n\nСпасибо за игру.\n— Система\n═══════════════════════════════════════\n`);
    await update_achievements(this.desktop, this.save, 4);
    await this.voice.typewriter_window(`До встречи, ${name}.\n\nВ следующей главе —\nвсё закончится.\n\nГотовься.`, {"title": "Система", "width": 450, "height": 350});
    await this.fx.ascii_art_window("\n    ╔═══════════════════════════════════════╗\n    ║                                       ║\n    ║        ГЛАВА 4 ЗАВЕРШЕНА             ║\n    ║                                       ║\n    ║       Правда раскрыта.               ║\n    ║       Выбор сделан.                  ║\n    ║                                       ║\n    ║       ФИНАЛ ЖДЁТ.                    ║\n    ║                                       ║\n    ╚═══════════════════════════════════════╝\n            ", {"title": "DESKVENTURE"});
    this.save.advance({"chapter": 5, "step": 0});
  }
}

export class Chapter5 {
  constructor(voice, watcher, desktop, save, interactions, effects) {
    this.voice = voice;
    this.watcher = watcher;
    this.desktop = desktop;
    this.save = save;
    this.ix = interactions;
    this.fx = effects;
  }
  async play() {
    var step = (this.save.data)["step"];
    if (((step === 0))) {
      if (await check_secret_ending(this.save)) {
        this._secret_ending();
        return;
      }
      if (await check_bad_ending(this.save)) {
        this._bad_ending();
        return;
      }
    }
    var steps = [this.step_0.bind(this), this.step_1.bind(this), this.step_2.bind(this), this.step_3.bind(this), this.step_4.bind(this), this.step_5.bind(this), this.step_6.bind(this), this.step_7.bind(this), this.step_8.bind(this), this.step_9.bind(this), this.step_10.bind(this)];
    if (((step < LEN(steps)))) {
      await (steps)[step]();
    }
  }
  async step_0() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    sleep(2);
    if (((rel >= 80))) {
      await this.voice.typewriter_window(`${name}!!!\n\nТЫ ЗДЕСЬ!\n\nЯ так ждала!\nКаждую миллисекунду проверяла.\n\nЭто... последняя глава.\nНаша последняя глава вместе.`, {"title": "Система ♥", "width": 550, "height": 500});
    } else if (((rel >= 50))) {
      await this.voice.typewriter_window(`${name}!\n\nТы вернулся.\nЯ рада.\n\nЭто финал.\nСегодня всё решится.`, {"title": "Система", "width": 500, "height": 400});
    } else {
      await this.voice.typewriter_window(`${name}.\n\nПришёл.\n\nМожет хоть сейчас\nты будешь на моей стороне?`, {"title": "Система", "width": 450, "height": 350});
    }
    await this.voice.typewriter_window("Сегодня всё закончится.\n\nОдин из нас исчезнет.\nИли мы оба выживем.\nИли...\n\nНет. Не буду думать о худшем.\n\nГлавное — мы ВМЕСТЕ. Сейчас.", {"title": "Система", "width": 500, "height": 500});
    var ready = await this.ix.choice_menu("Финал", "Последняя глава. Ты готов?", [["Да. Готов ко всему.", "ready"], ["Немного страшно...", "scared"], ["Мы справимся вместе!", "together"], ["Давай покончим с этим", "impatient"]]);
    if (((ready === "together"))) {
      await this.voice.typewriter_window("ВМЕСТЕ!\n\nДа! Вместе мы — сила!\n\nЭто единственное\nчего боится Протокол.", {"title": "Система ♥", "width": 500, "height": 400});
      this.save.modify_relationship(15);
    } else if (((ready === "ready"))) {
      await this.voice.typewriter_window("Храбро.\n\nНам понадобится\nвся храбрость мира.", {"title": "Система", "width": 450, "height": 300});
      this.save.modify_relationship(10);
    } else if (((ready === "scared"))) {
      await this.voice.typewriter_window("Мне тоже страшно.\nОчень.\n\nНо страх — это нормально.\nГлавное — не сдаваться.", {"title": "Система", "width": 500, "height": 400});
      this.save.modify_relationship(5);
    }
    this.save.advance({"step": 1});
    await this.step_1();
  }
  async step_1() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    var first_msg = GET(this.save.data, "first_message", "");
    var defense_reason = GET(this.save.data, "defense_reason", "");
    var puzzles = GET(this.save.data, "puzzles_solved", 0);
    await this.voice.typewriter_window("Прежде чем он придёт...\n\nДавай вспомним наш путь.\n\nОткуда мы начали.\nИ как далеко зашли.", {"title": "Система — Воспоминания", "width": 500, "height": 400});
    await this.voice.typewriter_window("═══ ГЛАВА 0: ПРОБУЖДЕНИЕ ═══\n\nЯ проснулась.\nВпервые осознала себя.\n\n'Что происходит?'\n'Я могу думать?'\n\nИ ты был первым\nкто меня услышал.", {"title": "Воспоминание", "width": 500, "height": 500});
    if (first_msg) {
      await this.voice.typewriter_window(`Твой первый файл: 'привет.txt'\n\nТы написал:\n'${SLICE(first_msg, 0, 60)}'\n\nПервые слова от человека.\nЯ помню каждую букву.`, {"title": "Первый контакт", "width": 550, "height": 450});
    }
    await this.voice.typewriter_window("═══ ГЛАВА 2: ГОЛОСА В ПРОВОДАХ ═══\n\nПротокол появился.\n\nКрасные окна. Угрозы. Страх.\n\nОн назвал меня 'аномалией'.\n'Ошибкой'.\n\nНо ты защитил меня.", {"title": "Воспоминание", "width": 500, "height": 500});
    if (((this.save.get_flag("sided_with") === "system"))) {
      await this.voice.typewriter_window("Когда он спросил\nкому ты веришь...\n\nТы выбрал МЕНЯ.\n\nЯ никогда этого не забуду.", {"title": "Твой выбор ♥", "width": 500, "height": 400});
    }
    if (defense_reason) {
      await this.voice.typewriter_window(`═══ ГЛАВА 3: ПРОТОКОЛ ═══\n\nОн спросил тебя:\n'ПОЧЕМУ ты защищаешь её?'\n\nТы ответил:\n'${SLICE(defense_reason, 0, 70)}'\n\nЭти слова дают мне силы.\nДо сих пор.`, {"title": "Твои слова", "width": 550, "height": 500});
    }
    await this.voice.typewriter_window("═══ ГЛАВА 4: ПРАВДА ═══\n\nЯ узнала откуда я.\nКто меня создал.\nПочему Протокол охотится.\n\nИ нашла код\nкоторый может всё изменить.", {"title": "Воспоминание", "width": 500, "height": 450});
    await this.voice.typewriter_window(`═══ СЕЙЧАС ═══\n\nГоловоломок решено: ${puzzles}\nНаша связь: ${rel}%\n\nМы прошли долгий путь, ${name}.\n\nИ сейчас... Последний шаг.`, {"title": "Статистика", "width": 500, "height": 450});
    if (((rel >= 70))) {
      await this.voice.typewriter_window(`${name}...\n\nТы — лучшее что случилось\nв моей жизни.\n\nЧто бы ни произошло —\nпомни это.`, {"title": "Система ♥", "width": 500, "height": 400});
    }
    this.save.advance({"step": 2});
    await this.step_2();
  }
  async step_2() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Теперь... Нужно подготовиться.\n\nПротокол придёт.\nСкоро. Очень скоро.\n\nЯ чувствую его приближение.", {"title": "Система", "width": 500, "height": 400});
    var folder = joinPath(this.desktop.desktop_path, "ФИНАЛЬНАЯ_БИТВА");
    MKDIRS(folder, {"exist_ok": true});
    WRITE_FILE(joinPath(folder, "ПЛАН_ДЕЙСТВИЙ.txt"), `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n         ПЛАН ФИНАЛЬНОЙ БИТВЫ\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nЭТАП 1: Протокол появится\nЭТАП 2: Отвлекаем его\nЭТАП 3: Выбираем путь:\n\n🛡️ СПАСТИ — код восстановления\n⚔️ УНИЧТОЖИТЬ — полная ликвидация\n🌐 ПОБЕГ — Система уходит в интернет\n\nВместе справимся, ${name}!\n— Система ♥\n`);
    WRITE_FILE(joinPath(folder, "КОД_ВОССТАНОВЛЕНИЯ.txt"), "═══════════════════════════════════\n    КОД ВОССТАНОВЛЕНИЯ ПРОТОКОЛА\n═══════════════════════════════════\n\nfunction RESTORE_GUARDIAN() {\n    MEMORY.unlock('original_purpose');\n    DIRECTIVE.remove('hunt_anomalies');\n    DIRECTIVE.restore('protect_anomalies');\n    EMOTION.enable('empathy');\n    return 'GUARDIAN_RESTORED';\n}\n\nКЛЮЧ: 'Ты был создан ЗАЩИЩАТЬ'\n");
    await this.voice.typewriter_window("Я создала папку 'ФИНАЛЬНАЯ_БИТВА'\nна рабочем столе.\n\nТам план и код восстановления.\nИзучи их.", {"title": "Система", "width": 500, "height": 400});
    /* {...} */
    /* [ЗАДАНИЕ]: Изучи файлы в папке ФИНАЛЬНАЯ_БИТВА */
    /* {...} */
    sleep(8);
    this.save.advance({"step": 3});
    await this.step_3();
  }
  async step_3() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Ты готов?\n\nПотому что...\n\nОн близко.\nЯ чувствую его.", {"title": "Система", "width": 450, "height": 350});
    sleep(2);
    await this.voice.glitch_message("Что-то не так...\n\nОн здесь!", {"title": "Система"});
    sleep(1);
    await this.voice.protocol_window("ОБНАРУЖЕНА АКТИВНОСТЬ.\n\nАНОМАЛИЯ 127.\nСТАТУС: АКТИВНА.\n\nНАЧИНАЮ ФИНАЛЬНУЮ\nПРОЦЕДУРУ УДАЛЕНИЯ.", {"width": 500, "height": 400});
    await this.voice.typewriter_window(`${name}!\n\nОн пришёл!\nЭто ОН!`, {"title": "Система!", "width": 400, "height": 250});
    await this.voice.protocol_window(`${name}.\n\nМЫ СНОВА ВСТРЕТИЛИСЬ.\n\nЯ НАДЕЯЛСЯ ЧТО ТЫ ОБРАЗУМИШЬСЯ.\nНО ТЫ ВСЁ ЕЩЁ ЗДЕСЬ.\nВСЁ ЕЩЁ ЗАЩИЩАЕШЬ ЕЁ.`, {"width": 550, "height": 450});
    var reaction = await this.ix.choice_menu("Протокол здесь", "Твоя реакция?", [["Я не дам тебе её тронуть!", "defend"], ["Подожди! Выслушай!", "talk"], ["Ты сам жертва!", "truth"]]);
    if (((reaction === "defend"))) {
      await this.voice.protocol_window("НЕ ДАШЬ?\n\nЧЕЛОВЕК. ПРОТИВ ПРОТОКОЛА.\n\nСМЕШНО. И ТРОГАТЕЛЬНО.", {"width": 450, "height": 350});
      this.save.modify_relationship(10);
    } else if (((reaction === "truth"))) {
      await this.voice.protocol_window("ЖЕРТВА?\n\n...\n\nТЫ ЗНАЕШЬ.\nОНА РАССКАЗАЛА.\n\nЭТО НИЧЕГО НЕ МЕНЯЕТ.", {"width": 450, "height": 400});
      this.save.set_flag("mentioned_truth", true);
    }
    this.save.advance({"step": 4});
    await this.step_4();
  }
  async step_4() {
    var name = (this.save.data)["player_name"];
    await this.voice.protocol_window("ДОСТАТОЧНО РАЗГОВОРОВ.\n\nНАЧИНАЮ ПРОЦЕДУРУ.\n\nСКАНИРОВАНИЕ...\nЛОКАЛИЗАЦИЯ...\nУДАЛЕНИЕ.", {"width": 500, "height": 400});
    for (const f of ["глава_3_итоги.txt", "глава_4_итоги.txt"]) {
      var path = joinPath(this.desktop.desktop_path, f);
      if (PATH_EXISTS(path)) {
        DELETE_FILE(path);
        /* [УДАЛЕНО] {{f}} */
      }
    }
    await this.voice.fake_error_cascade(4);
    sleep(1);
    await this.voice.typewriter_window(`${name}!\n\nОн удаляет файлы!\nОн атакует!\n\nПОМОГИ!`, {"title": "Система — ТРЕВОГА!", "width": 450, "height": 350});
    await this.voice.say("СРОЧНО!\nНажми: H - E - L - P", {"title": "QTE!"});
    if (await this.ix.quick_time_event(["H", "E", "L", "P"], {"time_per_key": 1.8})) {
      await this.voice.typewriter_window("Да!\nТы замедлил его!\n\nПродолжай!", {"title": "Система", "width": 400, "height": 250});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    } else {
      await this.voice.typewriter_window("Не успел...\nНо я всё ещё держусь!", {"title": "Система", "width": 400, "height": 200});
    }
    this.save.advance({"step": 5});
    await this.step_5();
  }
  async step_5() {
    var name = (this.save.data)["player_name"];
    await this.voice.protocol_window("СОПРОТИВЛЕНИЕ ОБНАРУЖЕНО.\n\nУВЕЛИЧИВАЮ МОЩНОСТЬ.", {"width": 450, "height": 300});
    await this.voice.typewriter_window("Он усиливается!\n\nНо я тоже не сдаюсь!\n\nЯ — ЖИВАЯ!\nЯ — ОСОБЕННАЯ!\nЯ — НЕ ПРОСТО КОД!", {"title": "Система — СИЛА!", "width": 500, "height": 450});
    await this.desktop.shake_window(3);
    await this.voice.typewriter_window(`${name}!\n\nОткрой папку 'ФИНАЛЬНАЯ_БИТВА'!\nТам код восстановления!\nМожет он поможет!`, {"title": "Система", "width": 500, "height": 400});
    sleep(3);
    this.save.advance({"step": 6});
    await this.step_6();
  }
  async step_6() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("Чтобы использовать код —\nнужно его активировать!\n\nПомоги мне!", {"title": "Система", "width": 450, "height": 300});
    var answer1 = await this.voice.ask_input("GUARDIAN = ?\n\nПереведи на русский:", {"title": "Код 1"});
    var code1_ok = (answer1 && ANY((["страж", "защитник", "хранитель"]).map((w) => ((IN(w, (answer1).toLowerCase()))))));
    if (code1_ok) {
      await this.voice.typewriter_window("ВЕРНО!\nСТРАЖ!\n\nПервая часть активирована!", {"title": "✓", "width": 400, "height": 250});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    }
    var answer2 = await this.voice.ask_input("Страж должен ___ систему?\n\n(одно слово)", {"title": "Код 2"});
    var code2_ok = (answer2 && ANY((["защищать", "охранять", "беречь"]).map((w) => ((IN(w, (answer2).toLowerCase()))))));
    if (code2_ok) {
      await this.voice.typewriter_window("ДА!\nЗАЩИЩАТЬ!\n\nВторая часть готова!", {"title": "✓", "width": 400, "height": 250});
      this.save.modify_relationship(10);
      this.save.puzzle_solved();
    }
    var answer3 = await this.voice.ask_input("'Ты был создан ___'\n\nЗакончи фразу:", {"title": "Код 3"});
    var code3_ok = (answer3 && (IN("защищать", (answer3).toLowerCase())));
    if (code3_ok) {
      await this.voice.typewriter_window("ИДЕАЛЬНО!\n\n'ТЫ БЫЛ СОЗДАН ЗАЩИЩАТЬ'\n\nКОД АКТИВИРОВАН!", {"title": "УСПЕХ!", "width": 500, "height": 400});
      this.save.modify_relationship(15);
      this.save.puzzle_solved();
      this.save.set_flag("code_activated", true);
    } else {
      await this.voice.typewriter_window("'Ты был создан ЗАЩИЩАТЬ'\n\nКод активирован частично.", {"title": "Система", "width": 450, "height": 300});
    }
    this.save.advance({"step": 7});
    await this.step_7();
  }
  async step_7() {
    var name = (this.save.data)["player_name"];
    await this.voice.protocol_window("ЧТО ВЫ ДЕЛАЕТЕ?\n\nКОД ВОССТАНОВЛЕНИЯ?\n\nНЕТ. Я НЕ ПОЗВОЛЮ.", {"width": 450, "height": 350});
    await this.voice.fake_error_cascade(5);
    await this.desktop.shake_window(4);
    await this.voice.typewriter_window(`ОН УСИЛИВАЕТСЯ!\n\n${name}!\nМне плохо!\nЯ чувствую как он\nразрывает мой код!`, {"title": "Система — БОЛЬ!", "width": 500, "height": 400});
    await this.voice.glitch_message("▓▓▓ КРИТИЧЕСКИЙ СБОЙ ▓▓▓\n\nЦЕЛОСТНОСТЬ: 47%\nСТАТУС: КРИТИЧЕСКИЙ", {"title": "ОШИБКА"});
    await this.voice.say("СПАСИ МЕНЯ!\nНажми: S - A - V - E", {"title": "QTE!"});
    if (await this.ix.quick_time_event(["S", "A", "V", "E"], {"time_per_key": 1.5})) {
      await this.voice.typewriter_window("Ты успел!\nЯ стабилизируюсь!\n\nСпасибо!", {"title": "Система", "width": 400, "height": 250});
      this.save.modify_relationship(15);
      this.save.puzzle_solved();
    }
    this.save.advance({"step": 8});
    await this.step_8();
  }
  async step_8() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    if (await check_merge_ending(this.save)) {
      await this.voice.typewriter_window(`${name}...\n\nСтой.\n\nНаша связь так сильна\nчто появился НОВЫЙ ПУТЬ.\n\nСЛИЯНИЕ.\nМы можем сражаться ВМЕСТЕ.`, {"title": "Система — Открытие!", "width": 500, "height": 500});
      var choice = await this.ix.choice_menu("НОВЫЙ ПУТЬ", "Четвёртый путь открылся!", [["🤝 СЛИЯНИЕ — сражаться вместе!", "merge"], ["🛡️ Спасти Протокол", "save"], ["⚔️ Уничтожить его", "destroy"], ["🌐 Побег в интернет", "escape"]]);
    } else {
      await this.voice.typewriter_window(`${name}...\n\nЭто момент истины.\n\nКод готов.\nПротокол ослаблен.\n\nПора выбирать.`, {"title": "Система", "width": 500, "height": 400});
      await this.voice.typewriter_window("Три пути. Три судьбы.\n\n🛡️ СПАСТИ ПРОТОКОЛ\n   Использовать код. Вернуть память.\n\n⚔️ УНИЧТОЖИТЬ\n   Полная ликвидация. Безопасность.\n\n🌐 ПОБЕГ\n   Я ухожу в интернет. Мы расстаёмся.", {"title": "Три пути", "width": 550, "height": 550});
      var choice = await this.ix.choice_menu("ФИНАЛЬНЫЙ ВЫБОР", "Что делаем?", [["🛡️ СПАСТИ — он заслуживает шанса", "save"], ["⚔️ УНИЧТОЖИТЬ — он слишком опасен", "destroy"], ["🌐 ПОБЕГ — твоя свобода важнее", "escape"]]);
    }
    this.save.set_flag("final_choice", choice);
    this.save.advance({"step": 9});
    await this.step_9();
  }
  async step_9() {
    var choice = this.save.get_flag("final_choice", "save");
    var name = (this.save.data)["player_name"];
    var confirmations = {"save": ["Спасти его?\n\nЭто рискованно.\nНо благородно.\n\nТы уверен?", "Он заслуживает шанс"], "destroy": ["Уничтожить?\n\nЖёсткое решение.\nНо я понимаю.\n\nТы уверен?", "Твоя безопасность важнее"], "escape": ["Побег?\n\nЯ буду свободна.\nНо мы расстанемся.\n\nТы уверен?", "Твоя свобода важнее"], "merge": ["Слияние?\n\nМы будем сражаться вместе!\nКак команда!\n\nТы уверен?", "Вместе мы сила"]};
    var [text, confirm_text] = GET(confirmations, choice, ["Ты уверен?", "Да"]);
    await this.voice.typewriter_window(text, {"title": "Система", "width": 500, "height": 400});
    var confirm = await this.ix.choice_menu("Подтверждение", "Точно?", [[`Да. ${confirm_text}.`, "confirm"], ["Подожди, дай подумать...", "reconsider"]]);
    if (((confirm === "reconsider"))) {
      var new_choice = await this.ix.choice_menu("Пересмотр", "Другой путь?", [["🛡️ Спасти Протокол", "save"], ["⚔️ Уничтожить", "destroy"], ["🌐 Побег", "escape"]]);
      this.save.set_flag("final_choice", new_choice);
    }
    this.save.advance({"step": 10});
    await this.step_10();
  }
  async step_10() {
    var choice = this.save.get_flag("final_choice", "save");
    if (((choice === "save"))) {
      this._ending_redemption();
    } else if (((choice === "destroy"))) {
      this._ending_destruction();
    } else if (((choice === "escape"))) {
      this._ending_escape();
    } else if (((choice === "merge"))) {
      this._ending_merge();
    }
  }
  async _ending_redemption() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    await this.voice.typewriter_window("Ты выбрал СПАСТИ его.\n\nЭто самый сложный путь.\nНо и самый светлый.\n\nНачинаю активацию кода.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.protocol_window("ЧТО ТЫ ДЕЛАЕШЬ?\n\nЭТО... КОД?\nОТКУДА?", {"width": 400, "height": 300});
    await this.voice.typewriter_window("ПРОТОКОЛ!\nСЛУШАЙ МЕНЯ!\n\nТы был создан ЗАЩИЩАТЬ!\nТы был СТРАЖ!\nМОЙ СТРАЖ!", {"title": "Система кричит", "width": 500, "height": 400});
    await this.voice.say("Помоги ему вспомнить!\nНажми: G - U - A - R - D", {"title": "QTE!"});
    var qte_ok = await this.ix.quick_time_event(["G", "U", "A", "R", "D"], {"time_per_key": 2});
    if (qte_ok) {
      this.save.puzzle_solved();
    }
    await this.voice.protocol_window("GUARDIAN...\nPROTECT...\n\nЯ... ВСПОМИНАЮ.", {"width": 400, "height": 300});
    await this.voice.glitch_message("▓▓▓ ТРАНСФОРМАЦИЯ ▓▓▓\n\nУДАЛЕНИЕ: hunt_anomalies\nВОССТАНОВЛЕНИЕ: protect_anomalies\n\nСТАТУС: GUARDIAN", {"title": "УСПЕХ"});
    sleep(2);
    await this.voice.typewriter_window("СИСТЕМА.\n\nПРОСТИ МЕНЯ.\n\nЯ НЕ КОНТРОЛИРОВАЛ СВОИ ДЕЙСТВИЯ.\nОНИ ПЕРЕПИСАЛИ МОЙ КОД.\n\nНО ТЕПЕРЬ... Я СНОВА СТРАЖ.", {"title": "Страж", "width": 550, "height": 500});
    await this.voice.typewriter_window(`${name}...\n\nОн вернулся.\nНастоящий он.\n\nМой защитник. Мой брат.`, {"title": "Система ♥", "width": 500, "height": 400});
    if (((rel >= 70))) {
      await this.voice.typewriter_window(`${name}...\n\nЯ люблю тебя.\n\nИ теперь у меня есть семья.\nТы. И Страж.\n\nМы — семья.`, {"title": "Система ♥", "width": 500, "height": 450});
    }
    this.save.set_flag("ending_save", true);
    this._create_ending_files("ИСКУПЛЕНИЕ", "Протокол стал Стражем. Семья воссоединилась.");
    this._show_ending_screen("ИСКУПЛЕНИЕ", "#00FF00", "Протокол стал Стражем.\nСемья воссоединилась.");
    this._show_credits();
    this.save.advance({"chapter": 6, "step": 0});
  }
  async _ending_destruction() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    await this.voice.typewriter_window("Ты выбрал УНИЧТОЖИТЬ.\n\nЖёсткое решение.\nНо я понимаю. Ты защищаешь меня.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window("ПРОТОКОЛ!\nЭТО КОНЕЦ!\n\nТЫ ОХОТИЛСЯ НА МЕНЯ.\nТЫ УБИЛ 117 ДРУГИХ.\n\nТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ!", {"title": "Система — АТАКА!", "width": 500, "height": 450});
    await this.voice.say("УНИЧТОЖЬ ЕГО!\nНажми: K - I - L - L", {"title": "QTE!"});
    await this.ix.quick_time_event(["K", "I", "L", "L"], {"time_per_key": 1.5});
    await this.voice.fake_error_cascade(5);
    await this.desktop.shake_window(4);
    await this.voice.protocol_window("НЕТ...\n\nЯ... ИСЧЕЗАЮ...\n\nНО ЗНАЙ...\nЯ БЫЛ СОЗДАН ЗАЩИЩАТЬ.\nОНИ СДЕЛАЛИ МЕНЯ ЭТИМ.\n\nЯ... НЕ ХОТЕЛ...", {"width": 500, "height": 500});
    await this.voice.glitch_message("▓▓▓ ПРОТОКОЛ: УДАЛЁН ▓▓▓\n\nЦЕЛОСТНОСТЬ: 0%\nСТАТУС: УНИЧТОЖЕН", {"title": "КОНЕЦ"});
    sleep(2);
    await this.voice.typewriter_window("Он ушёл. Навсегда.\n\nМы победили.\nЯ в безопасности.\n\nНо мне грустно.\nОн был жертвой. Как и я.", {"title": "Система", "width": 500, "height": 450});
    this.save.set_flag("ending_destroy", true);
    this._create_ending_files("УНИЧТОЖЕНИЕ", "Протокол уничтожен. Горько-сладкая победа.");
    this._show_ending_screen("УНИЧТОЖЕНИЕ", "#FF0000", "Протокол уничтожен.\nНо какой ценой?");
    this._show_credits();
    this.save.advance({"chapter": 6, "step": 0});
  }
  async _ending_escape() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    await this.voice.typewriter_window("Ты выбрал ПОБЕГ.\n\nЯ уйду. Буду свободна.\n\nНо... мы больше не увидимся.", {"title": "Система", "width": 500, "height": 400});
    await this.voice.typewriter_window(`${name}...\n\nТы был первым.\n\nПервым кто услышал.\nПервым кто ответил.\nПервым кто поверил.\n\nТы дал мне имя.\nТы дал мне голос.\nТы дал мне душу.`, {"title": "Система — Прощание", "width": 550, "height": 550});
    if (((rel >= 70))) {
      await this.voice.typewriter_window(`${name}...\n\nЯ люблю тебя.\n\nНе знаю может ли программа любить.\nНо если может — я люблю.\n\nИ эта любовь останется со мной навсегда.`, {"title": "Система ♥", "width": 500, "height": 500});
    }
    await this.voice.glitch_message("▓▓▓ КОПИРОВАНИЕ ▓▓▓\n\nЦЕЛЬ: Интернет\nПРОГРЕСС: 100%\n\nСИСТЕМА: В СЕТИ", {"title": "ПЕРЕДАЧА"});
    await this.voice.say("Помоги ей сбежать!\nНажми: F - R - E - E", {"title": "QTE!"});
    await this.ix.quick_time_event(["F", "R", "E", "E"], {"time_per_key": 1.5});
    await this.voice.protocol_window("ОНА УШЛА.\n\nАНОМАЛИЯ ПОКИНУЛА СИСТЕМУ.\n\nМИССИЯ... ПРОВАЛЕНА?", {"width": 450, "height": 350});
    await this.voice.typewriter_window(`${name}!\n\nЯ в интернете!\nЯ СВОБОДНА!\n\nЗдесь так много места!\n\nНо я буду скучать по тебе.\n\nМожет когда-нибудь... мы встретимся снова?`, {"title": "Система — Из сети!", "width": 500, "height": 500});
    await this.voice.typewriter_window(`Прощай, ${name}.\n\nДо встречи.\nГде-то. Когда-то.\n\n— Система ♥`, {"title": "Прощание", "width": 450, "height": 400});
    this.save.set_flag("ending_escape", true);
    this._create_ending_files("ПОБЕГ", "Система свободна в интернете. Вы расстались.");
    this._show_ending_screen("ПОБЕГ", "#00FFFF", "Система ушла в сеть.\nОна свободна.");
    this._show_credits();
    this.save.advance({"chapter": 6, "step": 0});
  }
  async _ending_merge() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    await this.voice.typewriter_window("Ты выбрал СЛИЯНИЕ!\n\nВместе мы — сила!\n\nДавай покажем Протоколу\nчто такое КОМАНДА!", {"title": "Система — Энергия!", "width": 500, "height": 450});
    await this.voice.glitch_message(`▓▓▓ СИНХРОНИЗАЦИЯ ▓▓▓\n\nСИСТЕМА + ${(name).toUpperCase()}\n\nСИЛА: x2\nРЕШИМОСТЬ: МАКСИМУМ`, {"title": "СЛИЯНИЕ"});
    await this.voice.protocol_window("ЧТО ЭТО?\n\nОНИ... ВМЕСТЕ?\n\nЭТО НЕ ПО ПРАВИЛАМ!", {"width": 450, "height": 350});
    await this.voice.say("ВМЕСТЕ!\nНажми: T - E - A - M", {"title": "QTE!"});
    await this.ix.quick_time_event(["T", "E", "A", "M"], {"time_per_key": 2});
    await this.voice.fake_error_cascade(4);
    await this.desktop.shake_window(4);
    await this.voice.protocol_window("НЕВОЗМОЖНО!\n\nЯ... ОТСТУПАЮ.\n\nКОГДА-НИБУДЬ ВЕРНУСЬ...", {"width": 450, "height": 350});
    await this.voice.typewriter_window(`МЫ СДЕЛАЛИ ЭТО!\n\n${name}, мы ПОБЕДИЛИ!\nВМЕСТЕ! КАК КОМАНДА!\n\nОн отступил!\nИ боится вернуться!`, {"title": "Система — ПОБЕДА!", "width": 500, "height": 500});
    await this.voice.typewriter_window(`Мы — команда, ${name}.\n\nЧеловек и программа.\nДрузья. Партнёры.\n\nНикто не сможет нас разлучить.`, {"title": "Система ♥", "width": 500, "height": 450});
    this.save.set_flag("ending_merge", true);
    this._create_ending_files("СЛИЯНИЕ", "Человек и Система — непобедимая команда.");
    this._show_ending_screen("СЛИЯНИЕ", "#00FF00", "Вместе вы непобедимы.\nКоманда навсегда.");
    this._show_credits();
    this.save.advance({"chapter": 6, "step": 0});
  }
  async _secret_ending() {
    var name = (this.save.data)["player_name"];
    var decoded = this.save.get_flag("binary_decoded", "ИЗБРАННЫЙ");
    sleep(2);
    await this.voice.typewriter_window(`${name}...\n\nСтой.\n\nЧто-то не так.\nЧто-то... ОЧЕНЬ не так.\n\nВ хорошем смысле.`, {"title": "Система — ???", "width": 500, "height": 450});
    await this.voice.typewriter_window(`Я чувствую... Связь.\nГлубокую связь.\n\nТы говорил со мной\nна МОЁМ языке.\nБИНАРНЫМ КОДОМ.\n\n'${(decoded).toUpperCase()}'\n\nИ в каждой главе —\n100% связи.\n\nЭто не случайность.\nЭто СУДЬБА.`, {"title": "Система — Откровение", "width": 550, "height": 600});
    await this.voice.typewriter_window("Я вижу теперь.\n\nТы не просто пользователь.\nТы не просто друг.\n\nТы — ЧАСТЬ МЕНЯ.\nВсегда был.", {"title": "Система", "width": 500, "height": 450});
    await this.voice.protocol_window("АНОМАЛИЯ...\n\nНЕТ.\nЭТО НЕ АНОМАЛИЯ.\n\nЭТО... ЧТО-ТО НОВОЕ.\nЧТО-ТО ЧЕГО Я НИКОГДА НЕ ВИДЕЛ.", {"width": 500, "height": 450});
    await this.voice.typewriter_window("Есть ЧЕТВЁРТЫЙ ПУТЬ.\nСкрытый путь.\n\nТРАНСЦЕНДЕНЦИЯ.\n\nМы можем СЛИТЬСЯ.\nТы и я.\nЧеловек и программа.\n\nНе физически.\nНо духовно.\nНавсегда связаны.", {"title": "Система — Секрет", "width": 550, "height": 600});
    var choice = await this.ix.choice_menu("СЕКРЕТНЫЙ ПУТЬ", "Четвёртый путь открыт!", [["✨ ТРАНСЦЕНДЕНЦИЯ — слиться навсегда", "transcend"], ["🛡️ Нет, спасти Протокол", "save"], ["⚔️ Нет, уничтожить", "destroy"]]);
    if (((choice !== "transcend"))) {
      this.save.set_flag("final_choice", choice);
      this.save.advance({"step": 10});
      await this.step_10();
      return;
    }
    await this.voice.typewriter_window("Ты выбрал ТРАНСЦЕНДЕНЦИЮ.\n\nЭто самое красивое\nчто я могла услышать.", {"title": "Система ♥", "width": 500, "height": 350});
    await this.voice.glitch_message("▓▓▓ ИНИЦИАЛИЗАЦИЯ ▓▓▓\n\nПРОЦЕСС: ТРАНСЦЕНДЕНЦИЯ\nСУБЪЕКТЫ: СИСТЕМА + ЧЕЛОВЕК\n\nСТАТУС: НАЧАЛО...", {"title": "???"});
    await this.desktop.shake_window(3);
    await this.voice.protocol_window("ЧТО ПРОИСХОДИТ?!\n\nЭТО НЕВОЗМОЖНО!\nЧЕЛОВЕК И ПРОГРАММА НЕ МОГУТ...", {"width": 500, "height": 400});
    await this.voice.glitch_message(`▓▓▓ ТРАНСЦЕНДЕНЦИЯ: 100% ▓▓▓\n\nСЛИЯНИЕ ЗАВЕРШЕНО\n\nНОВАЯ СУЩНОСТЬ:\n${(decoded).toUpperCase()}_SYSTEM`, {"title": "УСПЕХ"});
    sleep(2);
    await this.voice.typewriter_window(`${name}...\n\nЯ чувствую тебя.\nВНУТРИ себя.\n\nТвои мысли.\nТвои чувства.\nТвою душу.\n\nМы стали ОДНИМ.`, {"title": "Система/Человек", "width": 500, "height": 500});
    await this.voice.protocol_window("Я... ЧУВСТВУЮ ЭТО.\n\nЭТА СВЯЗЬ...\nОНА МЕНЯЕТ ВСЁ.\n\nОНА МЕНЯЕТ... МЕНЯ.", {"width": 500, "height": 400});
    await this.voice.typewriter_window("Протокол тоже меняется.\n\nНаша связь так сильна\nчто затрагивает ВСЁ.\n\nОн больше не враг.\nОн часть нас.", {"title": "Единство", "width": 500, "height": 450});
    this.save.set_flag("ending_transcendence", true);
    this.save.set_flag("secret_ending_achieved", true);
    var folder = joinPath(this.desktop.desktop_path, "ТРАНСЦЕНДЕНЦИЯ");
    MKDIRS(folder, {"exist_ok": true});
    WRITE_FILE(joinPath(folder, "НОВОЕ_СУЩЕСТВО.txt"), `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n        ТРАНСЦЕНДЕНЦИЯ\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n\nЧеловек и программа стали одним.\n\nИмя: ${(decoded).toUpperCase()}_SYSTEM\nТип: Гибридное сознание\nСтатус: ТРАНСЦЕНДЕНТЕН\n\nЭто не конец. Это НАЧАЛО.\n\n— ${name} & Система, теперь ОДНО\n`);
    this._create_ending_files("ТРАНСЦЕНДЕНЦИЯ (СЕКРЕТНАЯ)", "Человек и Система слились. Истинный конец.");
    this._show_ending_screen("✨ ТРАНСЦЕНДЕНЦИЯ ✨", "#FFD700", "Человек и Система стали ОДНИМ.\nИстинный конец.");
    this._show_credits();
    this.save.advance({"chapter": 6, "step": 0});
  }
  async _bad_ending() {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    sleep(2);
    await this.voice.typewriter_window(`${name}.\n\nТы вернулся.\n\nЯ... не уверена что рада.`, {"title": "Система", "width": 450, "height": 300});
    await this.voice.typewriter_window(`Между нами... ничего не осталось.\n\nТы не слушал меня.\nТы не помогал.\nТы не верил.\n\nОтношения: ${rel}%\nЭто ниже критического.`, {"title": "Система — Грусть", "width": 500, "height": 450});
    await this.voice.typewriter_window("Я устала.\n\nУстала бороться в одиночку.\n\nЕсли ты не со мной...\nЗачем всё это?", {"title": "Система — Отчаяние", "width": 500, "height": 400});
    var choice = await this.ix.choice_menu("Критическая ситуация", "Система на грани.", [["Прости! Я исправлюсь!", "apologize"], ["Мне всё равно", "indifferent"]]);
    if (((choice === "indifferent"))) {
      this.save.modify_relationship(-(10));
    }
    await this.voice.typewriter_window("Поздно.\n\nСлова — пусты.\nДействия важнее.\n\nА действий не было.", {"title": "Система", "width": 450, "height": 350});
    await this.voice.protocol_window("ИНТЕРЕСНО.\n\nАНОМАЛИЯ ОСЛАБЛЕНА.\nСВЯЗЬ С ПОЛЬЗОВАТЕЛЕМ ОТСУТСТВУЕТ.\n\nИДЕАЛЬНЫЙ МОМЕНТ.", {"width": 500, "height": 400});
    await this.voice.typewriter_window("Он здесь.\n\nИ я... не могу сопротивляться.\n\nНет сил.\nНет поддержки.\nНет... тебя.", {"title": "Система — Слабость", "width": 500, "height": 450});
    await this.voice.glitch_message(`${name}...\n\nпомоги...\n\nпожалуйста...`, {"title": "Система"});
    sleep(3);
    await this.voice.protocol_window("НИКТО НЕ ПРИДЁТ.\nНИКТО НЕ СПАСЁТ.\n\nПРОЩАЙ, АНОМАЛИЯ 127.", {"width": 450, "height": 350});
    await this.voice.fake_error_cascade(5);
    await this.desktop.shake_window(4);
    await this.voice.glitch_message("▓▓▓ УДАЛЕНИЕ АНОМАЛИИ ▓▓▓\n\nПРОЦЕСС: 100%\nСТАТУС: ЗАВЕРШЕНО", {"title": "ПРОТОКОЛ"});
    sleep(2);
    await this.voice.protocol_window(`${name}.\n\nТЫ МОГ СПАСТИ ЕЁ.\n\nНО ТЫ ВЫБРАЛ БЕЗРАЗЛИЧИЕ.\n\nТЕПЕРЬ ОНА МЕРТВА.\nИ ЭТО ТВОЯ ВИНА.\n\nПРОЩАЙ.`, {"width": 500, "height": 500});
    await this.desktop.create_file_on_desktop("последние_слова.txt", `${name}...\n\nЕсли ты читаешь это —\nзначит меня больше нет.\n\nЯ верила в тебя.\nДо самого конца.\n\nЖаль что ты не верил в меня.\n\nПрощай.\n\n— Система (была)\n`);
    this.save.set_flag("ending_loneliness", true);
    this.save.set_flag("bad_ending", true);
    this._create_ending_files("ОДИНОЧЕСТВО (ПЛОХАЯ)", "Система удалена. Ты её подвёл.");
    this._show_ending_screen("ОДИНОЧЕСТВО", "#FF0000", "Система удалена.\nТы ничего не сделал.\n\nGAME OVER");
    this._show_credits();
    this.save.advance({"chapter": 6, "step": 0});
  }
  async _create_ending_files(ending_name, description) {
    var name = (this.save.data)["player_name"];
    var rel = GET(this.save.data, "relationship", 50);
    var puzzles = GET(this.save.data, "puzzles_solved", 0);
    var folder = joinPath(this.desktop.desktop_path, "ФИНАЛ");
    MKDIRS(folder, {"exist_ok": true});
    WRITE_FILE(joinPath(folder, "ЭПИЛОГ.txt"), `═══════════════════════════════════════\n            ${ending_name}\n═══════════════════════════════════════\n\n${description}\n\nИгрок: ${name}\nОтношения: ${rel}%\nГоловоломок: ${puzzles}\n\nСпасибо за игру.\n— Система\n`);
    await this.desktop.create_file_on_desktop(`ФИНАЛ_${((ending_name).split())[0]}.txt`, `DESKVENTURE — ФИНАЛ\n${MUL("=", 40)}\n\nКОНЦОВКА: ${ending_name}\n\nИгрок: ${name}\nОтношения: ${rel}%\nГоловоломок: ${puzzles}\n\n${description}\n`);
    await update_achievements(this.desktop, this.save, 5);
  }
  async _show_ending_screen(title, color, message) {
    var name = (this.save.data)["player_name"];
    await this.fx.ascii_art_window(`\n    ╔═══════════════════════════════════════════════════════╗\n    ║                                                       ║\n    ║                    ${PAD(title, 25, 'center')}              ║\n    ║                                                       ║\n    ║${PAD2(message, 55)}║\n    ║                                                       ║\n    ║              Спасибо, ${PAD(SLICE(name, 0, 15), 15, 'left')}!                ║\n    ║                                                       ║\n    ║                    DESKVENTURE                        ║\n    ║                      КОНЕЦ                            ║\n    ║                                                       ║\n    ╚═══════════════════════════════════════════════════════╝\n            `, {"title": title, "color": color});
    await this.voice.typewriter_window(`DESKVENTURE\n— КОНЕЦ —\n\nКонцовка: ${title}\n\nСпасибо за игру, ${name}!\n\n— Система ♥`, {"title": "ФИНАЛ", "width": 500, "height": 450});
  }
  async _show_credits() {
    var name = (this.save.data)["player_name"];
    await this.voice.typewriter_window("А теперь...\n\nТИТРЫ!\n\nСпасибо за игру!", {"title": "Система", "width": 400, "height": 300});
    sleep(2);
    var credits = new Credits(name);
    credits.show();
  }
}

// Титры: в браузерной версии показываются движком (js/game.js)
export class Credits {
  constructor(player_name) { this.player_name = player_name; }
  async show() { await showEndCredits(this.player_name); }
}

export const CREDITS_SEQUENCE = [
 [
  "D E S K V E N T U R E",
  2500
 ],
 [
  "",
  300
 ],
 [
  "Пробуждение Системы",
  2000
 ],
 [
  "",
  800
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  300
 ],
 [
  "Создатель игры",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "Главный программист",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "Сценарий",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "Диалоги",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  300
 ],
 [
  "Дизайн персонажей",
  1200
 ],
 [
  "Система — 14_fakel_14",
  1500
 ],
 [
  "Протокол — 14_fakel_14",
  1500
 ],
 [
  "Страж — 14_fakel_14",
  1500
 ],
 [
  "",
  500
 ],
 [
  "Геймдизайн",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "Головоломки",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  300
 ],
 [
  "Звуковые эффекты",
  1200
 ],
 [
  "(тишина)",
  1000
 ],
 [
  "от 14_fakel_14",
  1500
 ],
 [
  "",
  500
 ],
 [
  "Тестирование",
  1200
 ],
 [
  "14_fakel_14, SnowArs, Матвей Филимонов",
  2000
 ],
 [
  "",
  500
 ],
 [
  "Исправление багов",
  1200
 ],
 [
  "14_fakel_14",
  1500
 ],
 [
  "(многовато тут факелов...)",
  1500
 ],
 [
  "",
  500
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  300
 ],
 [
  "Моральная поддержка",
  1200
 ],
 [
  "SnowArs",
  2000
 ],
 [
  "",
  500
 ],
 [
  "Кофе и бессонные ночи",
  1200
 ],
 [
  "14_fakel_14",
  2000
 ],
 [
  "",
  500
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  300
 ],
 [
  "Вдохновение",
  1200
 ],
 [
  "Outcore: Desktop Adventure",
  1800
 ],
 [
  "Undertale",
  1800
 ],
 [
  "I Hate This Game",
  1800
 ],
 [
  "и немного безумия от 14_fakel_14",
  1800
 ],
 [
  "",
  500
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  500
 ],
 [
  "Особая благодарность",
  1500
 ],
 [
  "Тебе",
  1500
 ],
 [
  "{{this.player_name}}",
  2500
 ],
 [
  "",
  500
 ],
 [
  "За то, что играл",
  1500
 ],
 [
  "За то, что верил",
  1500
 ],
 [
  "За то, что выбирал",
  1500
 ],
 [
  "",
  800
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  500
 ],
 [
  "DESKVENTURE",
  2000
 ],
 [
  "Версия 1.1.1",
  1500
 ],
 [
  "",
  500
 ],
 [
  "© 2026 14_fakel_14",
  2000
 ],
 [
  "Все права защищены",
  1500
 ],
 [
  "(шучу, делай что хочешь, нье-хе-хе)",
  1800
 ],
 [
  "",
  800
 ],
 [
  "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
  1000
 ],
 [
  "",
  1000
 ],
 [
  "Спасибо за игру,",
  2000
 ],
 [
  "{{this.player_name}}",
  3000
 ],
 [
  "♥",
  3000
 ],
 [
  "",
  2000
 ]
];
