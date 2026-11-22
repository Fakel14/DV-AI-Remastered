#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESKVENTURE: AI REMASTERED — транспайлер сценария.

Берёт исходный Python-сценарий (story/chapters.py) и переводит его
в JavaScript-модуль с 1:1 сохранением ВСЕХ диалогов и логики ветвления.

Правила:
  * строки и f-строки переносятся дословно;
  * вызовы self.voice / self.ix / self.desktop / self.fx становятся await;
  * print() закомментирован;
  * класс Credits не транспилируется (титры реализованы в движке),
    но его последовательность вытаскивается в CREDITS_SEQUENCE.
"""
import ast
import json
import re
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "chapters.txt"
OUT = sys.argv[2] if len(sys.argv) > 2 else "js/chapters.js"

source = open(SRC, encoding="utf-8-sig").read().replace("\r\n", "\n")
tree = ast.parse(source)
lines = source.split("\n")

SKIP_CLASSES = {"Credits"}


def indent(n):
    return "  " * n


class T:
    def __init__(self):
        self.awaiting = set()

    # помечает все вызовы внутри выражения на позицию await (Python: 3.11)
    def mark_await(self, expr, shift=0):
        for n in ast.walk(expr):
            if isinstance(n, ast.Call):
                ln = (n.lineno, n.col_offset)
                self.awaiting.add((ln[0] + shift, ln[1]))
                self.awaiting.add(ln)

    # ---------------------------------------------------------------- exprs
    def expr(self, node):
        m = getattr(self, "e_" + type(node).__name__, None)
        if m is None:
            raise SystemExit(f"UNSUPPORTED EXPR {type(node).__name__} line {getattr(node,'lineno','?')}: "
                             f"{ast.get_source_segment(source,node)!r}")
        return m(node)

    def e_Constant(self, node):
        v = node.value
        if isinstance(v, str):
            return json.dumps(v, ensure_ascii=False)
        if isinstance(v, bool):
            return "true" if v else "false"
        if v is None:
            return "null"
        if isinstance(v, (int, float)):
            return repr(v)
        raise SystemExit(f"bad constant {v!r}")

    def str_parts(self, node):
        """Собирает содержимое строки/ф-строки (в формате шаблонной литерала JS)."""
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        if isinstance(node, ast.JoinedStr):
            out = ""
            for v in node.values:
                if isinstance(v, ast.Constant):
                    out += v.value
                elif isinstance(v, ast.FormattedValue):
                    out += "{{" + self.formatted(v) + "}}"
                else:
                    raise SystemExit("bad fstring part")
            return out
        raise SystemExit(f"not a string: {ast.dump(node)[:120]}")

    def formatted(self, fv):
        inner = self.expr(fv.value)
        if fv.format_spec is None:
            return inner
        spec = self.str_parts(fv.format_spec)
        # поддержка выравнивания: :^25 / :<15
        m = re.match(r"^([\^<>])(\d+)$", spec)
        if m:
            align = {"^": "center", "<": "left", ">": "right"}[m.group(1)]
            return f"PAD({inner}, {m.group(2)}, {align!r})"
        raise SystemExit(f"unsupported format spec {spec!r}")

    def tpl(self, node):
        """Возвращает JS-выражение строки (шаблонный литерал при подстановках)."""
        content = self.str_parts(node)
        if "{{" in content:
            parts = re.split(r"(\{\{.*?\}\})", content, flags=re.S)
            out = "`"
            for p in parts:
                if p.startswith("{{") and p.endswith("}}"):
                    out += "${" + p[2:-2] + "}"
                else:
                    out += (p.replace("\\", "\\\\").replace("${", "\\${")
                             .replace("`", "\\`").replace("\n", "\\n"))
            return out + "`"
        return json.dumps(content, ensure_ascii=False)

    def e_JoinedStr(self, node):
        return self.tpl(node)

    def e_Name(self, node):
        if node.id == "self":
            return "this"
        if node.id == "None":
            return "null"
        if node.id == "True":
            return "true"
        if node.id == "False":
            return "false"
        return node.id

    def chain(self, node):
        """Плоская запись a.b.c без лишних скобок (для вызовов методов)."""
        if isinstance(node, ast.Attribute):
            return self.chain(node.value) + "." + node.attr
        if isinstance(node, ast.Call):
            return self.chain(node.func) + "(" + self.arglist(node) + ")"
        if isinstance(node, ast.Name):
            return self.expr(node)
        return "(" + self.expr(node) + ")"

    def e_Attribute(self, node):
        v = self.chain(node.value)
        return f"{v}.{node.attr}"

    ASYNC_ROOTS = ("this.voice.", "this.ix.", "this.desktop.", "this.fx.")

    def call(self, node, force_sync=False):
        f = node.func
        name = ""
        is_await = (node.lineno, node.col_offset) in self.awaiting and not force_sync
        # ---- специальные функции
        if isinstance(f, ast.Name):
            fn = f.id
            if fn == "print":
                arg = node.args[0] if node.args else None
                return "/* print */ 0" if arg is None else f"null /* print: {self.str_parts(arg)[:40] if isinstance(arg,(ast.Constant,ast.JoinedStr)) else ''} */"
            if fn == "len":
                return f"LEN({self.expr(node.args[0])})"
            if fn == "int":
                return f"Math.trunc(Number({self.expr(node.args[0])}))"
            if fn == "str":
                return f"String({self.expr(node.args[0])})"
            if fn == "chr":
                return f"String.fromCharCode({self.expr(node.args[0])})"
            if fn in ("min", "max"):
                return f"Math.{fn}(" + ", ".join(self.expr(a) for a in node.args) + ")"
            if fn == "range":
                a = [self.expr(x) for x in node.args]
                return f"RANGE({', '.join(a)})"
            if fn == "all":
                g = node.args[0]
                if isinstance(g, ast.GeneratorExp):
                    return f"ALL({self.genexp(g)})"
                return f"ALL({self.expr(g)})"
            if fn == "any":
                g = node.args[0]
                if isinstance(g, ast.GeneratorExp):
                    return f"ANY({self.genexp(g)})"
                return f"ANY({self.expr(g)})"
            if fn == "sum":
                g = node.args[0]
                if isinstance(g, ast.GeneratorExp):
                    return f"SUM({self.genexp(g)})"
                return f"SUM({self.expr(g)})"
            if fn == "ClipboardWatcher":
                return "new RTClipboard()"
            if fn == "Credits":
                return f"new Credits({self.arglist(node)})"
            if fn in ("update_achievements", "check_banned_name", "check_secret_ending",
                      "check_bad_ending", "check_merge_ending", "decode_binary", "is_binary_name"):
                args = [self.expr(a) for a in node.args]
                pre = "await " if is_await else ""
                return f"{pre}{fn}({', '.join(args)})"
            if fn == "open":
                raise SystemExit(f"bare open() at line {node.lineno} — должно быть в with")
            return f"{fn}(" + self.arglist(node) + ")"

        if isinstance(f, ast.Attribute):
            base = self.chain(f.value)
            attr = f.attr
            dotted = base + "." + attr
            args = self.arglist(node)
            if isinstance(f.value, ast.Name) and f.value.id == "random":
                return f"RNG.{attr}({args})"
            if base.startswith("urllib") and attr == "quote":
                return f"quote({args})"
            if base == "time" and attr == "sleep":
                return f"sleep({args})"
            if base == "os" and attr not in ("makedirs", "remove", "path") and not isinstance(f.value, ast.Attribute):
                raise SystemExit(f"os.{attr} needs special handling line {node.lineno}")
            # os.path.*
            if isinstance(f.value, ast.Attribute) and f.value.attr == "path":
                if attr == "join":
                    return "joinPath(" + args + ")"
                if attr == "exists":
                    return f"PATH_EXISTS({args})"
            if isinstance(f.value, ast.Name) and f.value.id == "os":
                if attr == "makedirs":
                    return f"MKDIRS({args})"
                if attr == "remove":
                    return f"DELETE_FILE({args})"
            if attr == "get" and not args.__contains__(""):
                pass
            if attr == "get":
                a = [self.expr(x) for x in node.args]
                if len(a) == 2:
                    return f"GET({base}, {a[0]}, {a[1]})"
                return f"GET({base}, {a[0]}, null)"
            if attr == "items":
                return f"ITEMS({base})"
            if attr == "values":
                return f"Object.values({base})"
            if attr == "keys":
                return f"Object.keys({base})"
            if attr == "capitalize":
                return f"CAPITALIZE({base})"
            if attr == "center":
                return f"PAD2({base}, {self.expr(node.args[0])})"
            if attr == "isprintable":
                return f"ISPRINTABLE({base})"
            if attr == "isalpha":
                return f"ISALPHA({base})"
            if attr == "join":
                return f"({base}).join({args})"
            if attr == "read":
                return f"READ_FILE({base})"
            if attr == "write":
                return f"WRITE_FILE({base}, {args})"
            if attr == "append":
                return f"({base}).push({args})"
            if attr == "join":
                # Python: "".join(list) → JS: list.join("")
                return f"({args}).join({base})"
            PY_STR = {
                "strip": "trim", "lstrip": "trimStart", "rstrip": "trimEnd",
                "upper": "toUpperCase", "lower": "toLowerCase",
                "startswith": "startsWith", "endswith": "endsWith",
                "replace": "replaceAll", "find": "indexOf", "index": "indexOf",
            }
            if attr in PY_STR:
                return f"({base}).{PY_STR[attr]}({args})"
            if attr == "title":
                return f"CAPITALIZE({base})"
            if attr in ("split", "count"):
                return f"({base}).{attr}({args})"
            if attr in ("format",):
                raise SystemExit(f"format() at line {node.lineno}")
            # вызовы игрового API
            if is_await and (any(dotted.startswith(r) for r in self.ASYNC_ROOTS)
                             or dotted.startswith("this.step_")):
                return f"await {dotted}({args})"
            return f"{dotted}({args})"

        if isinstance(f, ast.Subscript):
            fn_expr = self.expr(f.value)
            idx = self.expr(f.slice)
            args = self.arglist(node)
            pre = "await " if is_await else ""
            return f"{pre}({fn_expr})[{idx}]({args})"
        raise SystemExit(f"unsupported call at line {node.lineno}")

    def arglist(self, node):
        parts = [self.expr(a) for a in node.args]
        if node.keywords:
            kv = []
            for kw in node.keywords:
                if kw.arg is None:
                    raise SystemExit("**kwargs")
                kv.append(f"{json.dumps(kw.arg)}: {self.expr(kw.value)}")
            parts.append("{" + ", ".join(kv) + "}")
        return ", ".join(parts)

    def e_Call(self, node):
        return self.call(node)

    def genexp(self, node):
        it = self.expr(node.generators[0].iter)
        var = self._target(node.generators[0].target)
        target = node.generators[0].target
        if isinstance(target, (ast.Tuple, ast.List)):
            names = [self._target(e) for e in target.elts]
            body = self.expr(node.elt)
            inner = body
            for nm in reversed(names):
                inner = f"(({nm}) => ({inner}))"
            return f"({it}).map((__t) => ({inner})(" + ", ".join(f"__t[{i}]" for i in range(len(names))) + "))"
        body = self.expr(node.elt)
        expr = f"({var}) => ({body})"
        if node.generators[0].ifs:
            cond = " && ".join(self.expr(c) for c in node.generators[0].ifs)
            expr = f"({var}) => ({cond}) && ({body})"
        return f"({it}).map({expr})"

    def e_Compare(self, node):
        left = self.expr(node.left)
        out = []
        for op, comp in zip(node.ops, node.comparators):
            right = self.expr(comp)
            if isinstance(op, ast.In):
                out.append(f"IN({left}, {right})")
            elif isinstance(op, ast.NotIn):
                out.append(f"!IN({left}, {right})")
            elif isinstance(op, ast.Eq):
                out.append(f"({left} === {right})")
            elif isinstance(op, ast.NotEq):
                out.append(f"({left} !== {right})")
            elif isinstance(op, ast.Lt):
                out.append(f"({left} < {right})")
            elif isinstance(op, ast.LtE):
                out.append(f"({left} <= {right})")
            elif isinstance(op, ast.Gt):
                out.append(f"({left} > {right})")
            elif isinstance(op, ast.GtE):
                out.append(f"({left} >= {right})")
            elif isinstance(op, ast.Is):
                out.append(f"({left} === {right})")
            elif isinstance(op, ast.IsNot):
                out.append(f"({left} !== {right})")
            else:
                raise SystemExit(f"cmp {op}")
            left = right
        return "(" + " && ".join(out) + ")"

    def e_BoolOp(self, node):
        op = " && " if isinstance(node.op, ast.And) else " || "
        return "(" + op.join(self.expr(v) for v in node.values) + ")"

    def e_UnaryOp(self, node):
        if isinstance(node.op, ast.Not):
            return f"!({self.expr(node.operand)})"
        if isinstance(node.op, ast.USub):
            return f"-({self.expr(node.operand)})"
        raise SystemExit("unary op")

    def e_BinOp(self, node):
        l, r = self.expr(node.left), self.expr(node.right)
        if isinstance(node.op, ast.Add):
            return f"({l} + {r})"
        if isinstance(node.op, ast.Sub):
            return f"({l} - {r})"
        if isinstance(node.op, ast.Mult):
            return f"MUL({l}, {r})"
        if isinstance(node.op, ast.Div):
            return f"({l} / {r})"
        if isinstance(node.op, ast.FloorDiv):
            return f"Math.floor({l} / {r})"
        if isinstance(node.op, ast.Mod):
            return f"({l} % {r})"
        raise SystemExit("binop")

    def e_IfExp(self, node):
        return f"(({self.expr(node.test)}) ? ({self.expr(node.body)}) : ({self.expr(node.orelse)}))"

    def e_List(self, node):
        parts = []
        for e in node.elts:
            if isinstance(e, ast.Attribute) and isinstance(e.value, ast.Name) and e.value.id == "self":
                parts.append(f"this.{e.attr}.bind(this)")
            else:
                parts.append(self.expr(e))
        return "[" + ", ".join(parts) + "]"

    def e_Tuple(self, node):
        return "[" + ", ".join(self.expr(e) for e in node.elts) + "]"

    def e_Dict(self, node):
        pair_keys = any(isinstance(k, (ast.Tuple, ast.List)) for k in node.keys)
        items = []
        for k, v in zip(node.keys, node.values):
            if pair_keys:
                items.append("[" + self.expr(k) + ", " + self.expr(v) + "]")
            else:
                items.append(f"{self.expr(k)}: {self.expr(v)}")
        if pair_keys:
            return "[" + ", ".join(items) + "]"
        return "{" + ", ".join(items) + "}"

    def e_Subscript(self, node):
        base = self.expr(node.value)
        sl = node.slice
        if isinstance(sl, ast.Slice):
            lo = self.expr(sl.lower) if sl.lower else "0"
            hi = self.expr(sl.upper) if sl.upper else ""
            step = self.expr(sl.step) if sl.step else None
            if step:
                return f"SLICE({base}, {lo}, {hi}).filter((_, i) => i % {step} === 0)"
            return f"SLICE({base}, {lo}, {(hi if hi else 'undefined')})"
        return f"({base})[{self.expr(sl)}]"

    def e_ListComp(self, node):
        if len(node.generators) != 1:
            raise SystemExit("multi listcomp")
        g = node.generators[0]
        it = self.expr(g.iter)
        var = self._target(g.target)
        body = self.expr(node.elt)
        cond = ""
        if g.ifs:
            cond = ".filter((" + var + ") => " + " && ".join(self.expr(c) for c in g.ifs) + ")"
        return f"({it}){cond}.map(({var}) => ({body}))"

    def e_GeneratorExp(self, node):
        return self.genexp(node)

    def e_Lambda(self, node):
        args = ", ".join(a.arg for a in node.args.args)
        return f"(({args}) => ({self.expr(node.body)}))"

    # ------------------------------------------------------------- targets
    def _target(self, node):
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, (ast.Tuple, ast.List)):
            return "[" + ", ".join(self._target(e) for e in node.elts) + "]"
        if isinstance(node, ast.Starred):
            return "..." + self._target(node.value)
        raise SystemExit(f"target {type(node).__name__}")

    # ------------------------------------------------------------ statements
    def stmts(self, body, lvl):
        return "".join(self.stmt(s, lvl) for s in body)

    def stmt(self, node, lvl):
        pad = indent(lvl)
        self.mark_await(node)
        m = getattr(self, "s_" + type(node).__name__, None)
        if m is None:
            raise SystemExit(f"UNSUPPORTED STMT {type(node).__name__} line {node.lineno}")
        return m(node, lvl, pad)

    def s_Expr(self, node, lvl, pad):
        v = node.value
        if isinstance(v, ast.Constant) and isinstance(v.value, str):
            return ""  # docstring
        if isinstance(v, ast.Call) and isinstance(v.func, ast.Name) and v.func.id == "print":
            return f"{pad}/* {self.print_text(v)} */\n"
        return f"{pad}{self.expr(v)};\n"

    def print_text(self, call):
        out = []
        for a in call.args:
            if isinstance(a, (ast.Constant, ast.JoinedStr)):
                try:
                    out.append(self.str_parts(a))
                except SystemExit:
                    out.append("")
            else:
                out.append("{...}")
        return " ".join(out).replace("\n", " / ").strip()

    def s_Assign(self, node, lvl, pad):
        value = self.expr(node.value)
        targets = []
        for t in node.targets:
            if isinstance(t, ast.Subscript):
                targets.append(f"({self.expr(t.value)})[{self.expr(t.slice)}]")
            elif isinstance(t, ast.Attribute):
                targets.append(self.expr(t))
            else:
                targets.append(self._target(t))
        # destructuring из tuple
        if len(node.targets) == 1 and isinstance(node.targets[0], (ast.Tuple, ast.List)):
            return f"{pad}var [{', '.join(self._target(e) for e in node.targets[0].elts)}] = {value};\n"
        if len(targets) == 1:
            t = targets[0]
            decl = "var " if t.isidentifier() else ""
            return f"{pad}{decl}{t} = {value};\n"
        # цепочка a = b = c
        return "".join(f"{pad}{t} = {value};\n" for t in targets)

    def s_AnnAssign(self, node, lvl, pad):
        t = self._target(node.target)
        return f"{pad}var {t} = {self.expr(node.value)};\n" if node.value else ""

    def s_AugAssign(self, node, lvl, pad):
        if isinstance(node.target, ast.Subscript):
            t = f"({self.expr(node.target.value)})[{self.expr(node.target.slice)}]"
        elif isinstance(node.target, ast.Attribute):
            t = self.expr(node.target)
        else:
            t = self._target(node.target)
        op = {ast.Add: "+=", ast.Sub: "-=", ast.Mult: "*="}.get(type(node.op))
        if op is None:
            raise SystemExit("augassign")
        return f"{pad}{t} {op} {self.expr(node.value)};\n"

    def s_If(self, node, lvl, pad):
        out = f"{pad}if ({self.expr(node.test)}) {{\n{self.stmts(node.body, lvl+1)}{pad}}}"
        orelse = node.orelse
        while len(orelse) == 1 and isinstance(orelse[0], ast.If):
            sub = orelse[0]
            out += f" else if ({self.expr(sub.test)}) {{\n{self.stmts(sub.body, lvl+1)}{pad}}}"
            orelse = sub.orelse
        if orelse:
            out += f" else {{\n{self.stmts(orelse, lvl+1)}{pad}}}"
        return out + "\n"

    def s_While(self, node, lvl, pad):
        return f"{pad}while ({self.expr(node.test)}) {{\n{self.stmts(node.body, lvl+1)}{pad}}}\n"

    def s_For(self, node, lvl, pad):
        it = node.iter
        target = self._target(node.target)
        if isinstance(it, ast.Call) and isinstance(it.func, ast.Name) and it.func.id == "range":
            a = [self.expr(x) for x in it.args]
            iterjs = f"RANGE({', '.join(a)})"
        else:
            iterjs = self.expr(it)
        out = f"{pad}for (const {target} of {iterjs}) {{\n{self.stmts(node.body, lvl+1)}{pad}}}\n"
        if node.orelse:
            out += f"{pad}{{\n{self.stmts(node.orelse, lvl+1)}{pad}}}\n"
        return out

    def s_Try(self, node, lvl, pad):
        # В браузере нет исключений ФС: тело основное, обработчик — как fallback-ветка
        body = self.stmts(node.body, lvl)
        if not node.handlers:
            return body
        handler = node.handlers[0]
        hbody = self.stmts(handler.body, lvl)
        return f"{pad}try {{\n{self.stmts(node.body, lvl+1)}{pad}}} catch (__e) {{\n{hbody}{pad}}}\n"

    def s_With(self, node, lvl, pad):
        item = node.items[0]
        call = item.context_expr
        if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == "open"):
            raise SystemExit(f"with-not-open line {node.lineno}")
        path = self.expr(call.args[0])
        mode = self.expr(call.args[1]) if len(call.args) > 1 else '"r"'
        varname = item.optional_vars.id if item.optional_vars else "__f"
        body = node.body
        # читающий режим?
        if "'r'" in mode or '"r"' in mode:
            out = f"{pad}var {varname} = new FileHandle({path}, READ_FILE({path}) || \"\" );\n"
            for s in body:
                out += self.stmt(s, lvl)
            return out
        # пишущий режим: единственный оператор — f.write(X)
        writes = [s for s in body if isinstance(s, ast.Expr) and isinstance(s.value, ast.Call)
                  and isinstance(s.value.func, ast.Attribute) and s.value.func.attr == "write"]
        if len(writes) == 1:
            return f"{pad}WRITE_FILE({path}, {self.expr(writes[0].value.args[0])});\n"
        if not body:
            return f"{pad}WRITE_FILE({path}, \"\");\n"
        raise SystemExit(f"with-write weird line {node.lineno}")

    def s_Return(self, node, lvl, pad):
        return f"{pad}return{(' ' + self.expr(node.value)) if node.value else ''};\n"

    def s_Break(self, node, lvl, pad):
        return f"{pad}break;\n"

    def s_Continue(self, node, lvl, pad):
        return f"{pad}continue;\n"

    def s_Pass(self, node, lvl, pad):
        return ""

    def s_Raise(self, node, lvl, pad):
        return f"{pad}throw new Error('scenario raise');\n"

    def s_FunctionDef(self, node, lvl, pad):
        args = [a.arg for a in node.args.args if a.arg != "self"]
        if node.name == "show" and False:
            pass
        kw = ""
        if any(isinstance(d, ast.Constant) and isinstance(d.value, str) for d in node.args.defaults):
            pass
        defaults = node.args.defaults
        params = []
        offset = len(node.args.args) - len(defaults)
        for i, a in enumerate(node.args.args):
            if a.arg == "self":
                continue
            if i - offset >= 0 and defaults:
                d = defaults[i - offset]
                params.append(f"{a.arg} = {self.expr(d)}")
            else:
                params.append(a.arg)
        if node.args.kwarg:
            kw = "..."
        body = self.stmts(node.body, lvl + 1)
        if node.name == "__init__":
            params = [a.arg for a in node.args.args if a.arg != "self"]
            body = self.stmts(node.body, lvl + 1)
            return f"{pad}constructor({', '.join(params)}) {{\n{body}{pad}}}\n"

        if lvl == 0:
            head = f"{pad}async function {node.name}("
        else:
            head = f"{pad}async {node.name}("
        return head + ", ".join(params) + ((", " + kw) if kw else "") + ") {\n" + body + pad + "}\n"

    def s_ClassDef(self, node, lvl, pad):
        return ""

    def s_Import(self, node, lvl, pad):
        return ""

    def s_ImportFrom(self, node, lvl, pad):
        return ""


# ═══════════════════════════════════════════════════════════════════════════
# ГЕНЕРАЦИЯ
# ═══════════════════════════════════════════════════════════════════════════

t = T()
chunks = []

IMPORTS = (
    "import { RNG, sleep, time, joinPath, PATH_EXISTS, MKDIRS, READ_FILE, WRITE_FILE,\n"
    "  DELETE_FILE, SLICE, IN, ANY, ALL, SUM, ITEMS, GET, RANGE, LEN, PAD, PAD2,\n"
    "  CAPITALIZE, ISPRINTABLE, ISALPHA, showEndCredits, quote, DELETE_PATH, MUL,\n"
    "  ClipboardWatcher as RTClipboard, FileHandle } from './runtime.js';\n\n"
)

HELPERS_NOTE = """// ═══════════════════════════════════════════════════════════════════════════════
// DESKVENTURE: AI REMASTERED — сценарий
// Сгенерировано автоматически из оригинального Python-сценария (story/chapters.py).
// ВСЕ реплики, главы и ветвления сохранены дословно.
// Не редактируйте вручную: правки вносите в tools/transpile.py.
// ═══════════════════════════════════════════════════════════════════════════════
"""

# --- функции верхнего уровня
for node in tree.body:
    if isinstance(node, ast.FunctionDef):
        chunks.append(t.s_FunctionDef(node, 0, ""))

# --- классы глав
for node in tree.body:
    if not isinstance(node, ast.ClassDef):
        continue
    if node.name in SKIP_CLASSES:
        continue
    if not node.name.startswith("Chapter"):
        continue
    cap = node.name
    body = []
    for sub in node.body:
        if isinstance(sub, ast.FunctionDef):
            body.append(t.s_FunctionDef(sub, 1, "  "))
    chunks.append(f"export class {cap} {{\n" + "".join(body) + "}\n")


# --- последовательность титров из класса Credits
credits_seq = None
for node in tree.body:
    if isinstance(node, ast.ClassDef) and node.name == "Credits":
        for sub in node.body:
            if isinstance(sub, ast.FunctionDef) and sub.name == "_run_credits":
                for s in ast.walk(sub):
                    if isinstance(s, ast.Assign) and getattr(s.targets[0], "id", "") == "sequence":
                        credits_seq = s.value
if credits_seq is None:
    raise SystemExit("credits sequence not found")

seq_js = []
for el in credits_seq.elts:
    text = t.str_parts(el.elts[0])
    dur = el.elts[1].value
    seq_js.append([text, dur])
chunks.append("""// Титры: в браузерной версии показываются движком (js/game.js)
export class Credits {
  constructor(player_name) { this.player_name = player_name; }
  async show() { await showEndCredits(this.player_name); }
}
""")
chunks.append("export const CREDITS_SEQUENCE = " + json.dumps(seq_js, ensure_ascii=False, indent=1) + ";\n")

out = IMPORTS + HELPERS_NOTE + "\n" + "\n".join(chunks)
# ═══════════════════════════════════════════════════════════════════════════
# ПОСТ-ПРАВКИ: шаги, на которых оригинал ждал действий на реальном столе.
# В браузере действие игрока собирает движок (см. js/game.js → handlePendingStep),
# поэтому в сценарии остаётся только маркер ожидания.
# ═══════════════════════════════════════════════════════════════════════════
WAIT_STEP_PATCHES = [
    ("""    var start = time.time();
    while (!(PATH_EXISTS(filepath))) {
      sleep(1);""",
     """    var start = time.time();
    await this.desktop.wait_step();
    while (!(PATH_EXISTS(filepath))) {
      sleep(0.5);"""),
    ("""    var folder_path = joinPath(this.desktop.desktop_path, "Наш секрет");
    var start = time.time();
    while (!(PATH_EXISTS(folder_path))) {""",
     """    var folder_path = joinPath(this.desktop.desktop_path, "Наш секрет");
    var start = time.time();
    await this.desktop.wait_step();
    while (!(PATH_EXISTS(folder_path))) {"""),
    ("""    var spam_count = 0;
    var found = false;
""",
     """    var spam_count = 0;
    var found = false;
    await this.desktop.wait_step();
"""),
    ("""    var scan_progress = 50;
    while (true) {""",
     """    var scan_progress = 50;
    await this.desktop.wait_step();
    while (true) {"""),
    ("""    var start_content = clipboard.get_clipboard();""",
     """    var start_content = clipboard.get_clipboard();
    await this.desktop.wait_step();"""),
]


def post_patch(code):
    for old, new in WAIT_STEP_PATCHES:
        if new in code:
            continue
        if old not in code:
            raise SystemExit("WAIT_STEP patch target not found:\n" + old[:120])
        code = code.replace(old, new, 1)
    return code


out = post_patch(out)
open(OUT, "w", encoding="utf-8").write(out)
print(f"OK -> {OUT}  ({len(out)} bytes)")
