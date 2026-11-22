#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверяет, что ВСЕ реплики из оригинального сценария попали в js/chapters.js дословно."""
import ast
import json
import re
import sys

src = open('chapters.txt', encoding='utf-8-sig').read().replace('\r\n', '\n')
tree = ast.parse(src)
js = open('js/chapters.js', encoding='utf-8').read()

def unescape(jsstr):
    # берём содержимое JS-литерала и превращаем в python-строку
    return json.loads('"' + jsstr.replace('"', '\\"').replace('\\"', '\\"') + '"') if False else jsstr

# только РЕПЛИКИ: строки внутри вызовов и f-строк (докстринги/комментарии не в счёт)
py_strings = []

DOCSTRING_NODES = set()
for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Module)):
        body = getattr(node, 'body', [])
        if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) \
           and isinstance(body[0].value.value, str):
            DOCSTRING_NODES.add(id(body[0].value))

def collect(node):
    for sub in ast.walk(node):
        if isinstance(sub, ast.Constant) and isinstance(sub.value, str):
            if id(sub) in DOCSTRING_NODES:
                continue
            if len(sub.value.strip()) > 3:
                py_strings.append(sub.value)
        if isinstance(sub, ast.JoinedStr):
            for v in sub.values:
                if isinstance(v, ast.Constant) and isinstance(v.value, str) and len(v.value.strip()) > 3:
                    py_strings.append(v.value)

# собираем из всех вызовов + присваиваний строк в функции
for node in ast.walk(tree):
    if isinstance(node, ast.Call):
        collect(node)
    if isinstance(node, ast.Assign) and node.value is not None:
        collect(node.value)
    if isinstance(node, ast.Return) and node.value is not None:
        collect(node.value)

# уникальные
seen = set()
uniq = [x for x in py_strings if not (x in seen or seen.add(x))]

missing = []
checked = 0
for text in uniq:
    checked += 1
    # ищем в JS как экранированную строку
    esc = (text.replace('\\', '\\\\').replace('"', '\\"')
               .replace('\n', '\\n').replace('\t', '\\t'))
    if esc in js:
        continue
    esc_bt = (text.replace('\\', '\\\\').replace('`', '\\`')
                  .replace('${', '\\${').replace('\n', '\\n'))
    if esc_bt in js:
        continue
    missing.append(text)

print(f"проверено уникальных строк: {checked}")
print(f"не найдено в JS: {len(missing)}")
for m in missing[:20]:
    print('  ---')
    print('  ' + m[:160].replace('\n', ' / '))
sys.exit(0 if not missing else 1)
