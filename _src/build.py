#!/usr/bin/env python3
"""Собирает index.html и style.css из _src (один раз; дальше правьте готовые файлы)."""
import re, pathlib
src = pathlib.Path(__file__).parent
root = src.parent
r = lambda n: (src / n).read_text(encoding='utf-8')

boss = r('boss.svg')
wheel = r('wheel.svg')
lexa = r('lexa.svg')
lexa = lexa.replace('<svg id="lexa" class="person"', '<svg id="lexa" class="lx person"', 1)

def clone(name):
    c = lexa.replace(' id="lexa"', '', 1).replace(' id="lexaProp"', '')
    c = c.replace('>ЛЁХА<', '>%s<' % name, 1)
    if name == 'ДЕНИС':  # круглый: вместо прямой спецовки — пузо-шарик
        c = c.replace('<path d="M78 164 Q76 150 98 146 L144 146 Q166 150 164 164 L156 280 L86 280 Z" fill="#2166b3"/>',
                      '<ellipse cx="121" cy="226" rx="70" ry="68" fill="#2166b3"/>')
    if name == 'СЕРЁГА':  # современные очки
        glasses = ('<g fill="rgba(190,225,250,.35)" stroke="#1d2733" stroke-width="2.6"><rect x="96" y="99" width="24" height="17" rx="4.5"/>'
                   '<rect x="120" y="99" width="24" height="17" rx="4.5"/><path d="M120 105 h0 M96 104 L88 102 M144 104 L152 102" fill="none"/></g>')
        c = c.replace('<!-- каска -->', glasses + '<!-- каска -->', 1)
    return c

html = r('template.html')
html = html.replace('<!--BOSS-->', boss).replace('<!--WHEEL-->', wheel)
html = html.replace('<!--LEXA-->', lexa)
html = html.replace('<!--DEN-->', clone('ДЕНИС')).replace('<!--SER-->', clone('СЕРЁГА'))
(root / 'index.html').write_text(html, encoding='utf-8')

css = r('own.css') + '\n/* ---- персонажи (из «Замотай Лёху») ---- */\n' + r('chars.css') + '\n/* ---- заголовок ---- */\nh1,.mk{' + '' + '}\n'
title = r('title.css')
# title.css содержит правило "h1,.mk{...}" и @keyframes flame
css += title
(root / 'style.css').write_text(css, encoding='utf-8')
print('OK', len(html), len(css))
