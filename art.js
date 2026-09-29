/* ============================================================
   art.js — вся графика на canvas (газель, люди, препятствия, фон)
   Стиль: толстая тёмная обводка #1b1b1b, плоские яркие заливки.
   Все функции рисуют относительно текущей точки (0,0) — «земля под центром».
   ============================================================ */
const ART = {};
const INK = '#1b1b1b';

function outline(ctx, w = 3) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function fillOut(ctx, color, w = 3) { ctx.fillStyle = color; ctx.fill(); outline(ctx, w); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

/* ---------- головы (Лёха, Денис, Сергей) ---------- */
ART.head = function (ctx, who, x, y, s = 1, t = 0) {
  const rx = (who === 'den' ? 25 : who === 'ser' ? 14 : 14.5) * s;
  const ry = (who === 'den' ? 23 : who === 'ser' ? 19.5 : 16.5) * s;
  ctx.save(); ctx.translate(x, y);
  // лицо
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); fillOut(ctx, '#eab98e', 2.4 * s);
  if (who === 'den') { // щёки
    ctx.fillStyle = 'rgba(230,90,70,.45)';
    ctx.beginPath(); ctx.ellipse(rx * .5, ry * .35, 5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-rx * .5, ry * .35, 5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (who === 'ser') { // щетина и усы
    ctx.fillStyle = 'rgba(70,50,35,.55)';
    ctx.beginPath(); ctx.ellipse(0, ry * .5, rx * .8, ry * .4, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#4a3526'; ctx.fillRect(-7 * s, 5 * s, 14 * s, 3 * s);
  }
  // глаза (смотрят вперёд, вправо)
  const blink = Math.sin(t * 1.3 + rx) > .96 ? .2 : 1;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(rx * .15, -2 * s, 4 * s, 3.4 * s * blink, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rx * .68, -2 * s, 4 * s, 3.4 * s * blink, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(rx * .27, -1.5 * s, 1.7 * s, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(rx * .8, -1.5 * s, 1.7 * s, 0, 7); ctx.fill();
  if (who === 'ser') { // современные очки: тонкая прямоугольная оправа
    ctx.strokeStyle = '#1d2733'; ctx.lineWidth = 1.7 * s; ctx.fillStyle = 'rgba(190,225,250,.35)';
    [rx * .15, rx * .68].forEach(cx => { ctx.beginPath(); ctx.roundRect(cx - 5.6 * s, -6.4 * s, 11.2 * s, 8.6 * s, 2.4 * s); ctx.fill(); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(rx * .15 + 5.6 * s, -3 * s); ctx.lineTo(rx * .68 - 5.6 * s, -3 * s); ctx.moveTo(rx * .15 - 5.6 * s, -3 * s); ctx.lineTo(-rx, -5 * s); ctx.stroke();
  }
  // рот: у Лёхи уныло
  ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 2 * s; ctx.beginPath();
  if (who === 'lexa') { ctx.moveTo(rx * .1, 10 * s); ctx.quadraticCurveTo(rx * .4, 6 * s, rx * .75, 10 * s); }
  else { ctx.moveTo(rx * .1, 8 * s); ctx.quadraticCurveTo(rx * .4, 12 * s, rx * .75, 8 * s); }
  ctx.stroke();
  // нос
  ctx.strokeStyle = '#c48a60'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(rx * .9, 0); ctx.lineTo(rx * 1.1, 5 * s); ctx.lineTo(rx * .85, 6 * s); ctx.stroke();
  // каска
  ctx.beginPath(); ctx.ellipse(0, -ry * .3, rx + 3 * s, ry * .95, 0, Math.PI, Math.PI * 2); fillOut(ctx, '#f7f7f7', 2.4 * s);
  ctx.fillStyle = '#0a7fd6'; ctx.fillRect(-rx - 1 * s, -ry * .45, (rx + 1 * s) * 2, 4 * s);
  rrect(ctx, -rx - 6 * s, -ry * .3 - 1 * s, (rx + 6 * s) * 2 + 4 * s, 5 * s, 2 * s); fillOut(ctx, '#e6e6e6', 2 * s);
  ctx.restore();
};

/* ---------- человек целиком (для сцены «бугор») ---------- */
ART.person = function (ctx, who, x, y, s = 1, pose = 'stand', t = 0) {
  const w = who === 'den' ? 1.7 : who === 'ser' ? 1.08 : 1;
  const h = who === 'den' ? 1.05 : who === 'ser' ? 1.1 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * w, s * h);
  const bob = pose === 'jump' ? Math.sin(t * 20) * 2 : 0;
  // ноги
  const kick = pose === 'kick' ? Math.sin(Math.min(1, t * 3) * Math.PI) * 30 : 0;
  ctx.fillStyle = '#173b73';
  rrect(ctx, -12, -44, 10, 44, 3); fillOut(ctx, '#173b73', 2.4);
  ctx.save(); ctx.translate(6, -44); ctx.rotate(-kick * Math.PI / 180);
  rrect(ctx, -6, 0, 10, 44, 3); fillOut(ctx, '#173b73', 2.4); ctx.restore();
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-16, -6, 16, 6); ctx.fillRect(2, -6, 16, 6);
  // торс
  if (who === 'den') { ctx.beginPath(); ctx.ellipse(0, -64 + bob, 24, 30, 0, 0, 7); fillOut(ctx, '#2166b3', 2.6); } else { rrect(ctx, -18, -92 + bob, 36, 52, 8); fillOut(ctx, '#2166b3', 2.6); }
  ctx.fillStyle = '#d6dde6'; ctx.fillRect(-18, -66 + bob, 36, 5); ctx.fillRect(-18, -54 + bob, 36, 5);
  // руки
  const up = pose === 'jump' || pose === 'cheer';
  ctx.lineCap = 'round'; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(-16, -86 + bob); ctx.lineTo(up ? -30 : -24, up ? -118 + bob : -56 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -86 + bob); ctx.lineTo(up ? 30 : 24, up ? -118 + bob : -56 + bob); ctx.stroke();
  ctx.strokeStyle = '#2166b3'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(-16, -86 + bob); ctx.lineTo(up ? -30 : -24, up ? -118 + bob : -56 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -86 + bob); ctx.lineTo(up ? 30 : 24, up ? -118 + bob : -56 + bob); ctx.stroke();
  // голова
  ART.head(ctx, who, 0, -110 + bob, 1.05, t);
  ctx.restore();
};

/* ---------- колесо ---------- */
ART.wheel = function (ctx, x, y, r, rot, flat) {
  ctx.save(); ctx.translate(x, y);
  if (flat) { ctx.translate(0, r * .28); ctx.scale(1.1, .74); }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); fillOut(ctx, '#252525', 3);
  ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r * .58, 0, Math.PI * 2); fillOut(ctx, '#b9b2a2', 2.4);
  ctx.fillStyle = '#9c4f25';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(Math.cos(i * 2.1) * r * .3, Math.sin(i * 2.1) * r * .3, 3.5, 2.4, i, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#666';
  for (let i = 0; i < 5; i++) { const a = i * 1.2566; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .32, Math.sin(a) * r * .32, 1.8, 0, 7); ctx.fill(); }
  ctx.restore();
};

/* ---------- ржавчина ---------- */
function rust(ctx, x, y, rx, ry, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(156,79,37,.9)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(196,110,50,.9)'; ctx.beginPath(); ctx.ellipse(-rx * .2, -ry * .2, rx * .5, ry * .5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(90,45,20,.8)'; ctx.beginPath(); ctx.arc(rx * .3, ry * .3, Math.max(1.5, rx * .18), 0, 7); ctx.fill();
  ctx.restore();
}

/* ---------- ГАЗЕЛЬ (ГАЗ-2705 «Бизнес», белая, с вторым рядом пассажиров) ----------
   o: { t, wr (вращение колёс), sy (просадка кузова), bd (id поломки), crew, rattle }
   Смотрит вправо. (0,0) — земля под серединой. */
ART.drawVan = function (ctx, o) {
  const t = o.t || 0, bd = o.bd || null, sy = o.sy || 0, R = 24;
  // оторванный глушитель волочится
  if (bd === 'muffler') {
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-132, -28); ctx.lineTo(-148, -8); ctx.lineTo(-178, -2 + Math.sin(t * 30) * 2); ctx.stroke();
    ctx.strokeStyle = '#777'; ctx.lineWidth = 4; ctx.stroke();
  }
  // задние сдвоенные колёса: внутреннее видно чуть правее
  ART.wheel(ctx, -78, -R, R - 1, o.wr || 0, false);
  ctx.save(); ctx.translate(0, sy);

  // ----- кузов -----
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-129, -38); ctx.lineTo(-130, -120); ctx.quadraticCurveTo(-130, -136, -114, -137);
    ctx.lineTo(22, -140); ctx.quadraticCurveTo(52, -142, 62, -130);
    ctx.lineTo(97, -88); ctx.quadraticCurveTo(101, -83, 109, -82);
    ctx.lineTo(126, -74); ctx.quadraticCurveTo(133, -70, 133, -60); ctx.lineTo(133, -38); ctx.closePath();
  };
  body(); fillOut(ctx, '#f2f2ec', 3.6);
  ctx.save(); body(); ctx.clip();
  // нижняя часть (порог) темнее
  ctx.fillStyle = '#d4d3c6'; ctx.fillRect(-135, -56, 275, 20);
  // рёбра жёсткости и панели кузова
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-128, -76); ctx.lineTo(20, -76); ctx.stroke();
  // синяя полоса «Служба связи»
  ctx.fillStyle = '#0a7fd6'; ctx.fillRect(-128, -70, 152, 13);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Russo One",Arial'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('СЛУЖБА СВЯЗИ', -104, -63);
  // ржавчина
  rust(ctx, -84, -44, 24, 10); rust(ctx, 88, -46, 18, 9); rust(ctx, -122, -130, 12, 6); rust(ctx, -30, -44, 26, 6, .06);
  rust(ctx, 8, -132, 10, 4); rust(ctx, -124, -46, 8, 14); rust(ctx, 110, -78, 12, 5); rust(ctx, -50, -112, 6, 3);
  rust(ctx, 20, -54, 10, 5); rust(ctx, -96, -96, 5, 9);
  ctx.restore();
  // вмятина на кузове
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, -52); ctx.quadraticCurveTo(-24, -44, -6, -52); ctx.stroke();

  // ----- кабина: дверь, окно, зеркало -----
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(26, -132); ctx.lineTo(26, -40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(26, -40); ctx.lineTo(92, -40); ctx.stroke();
  ctx.fillStyle = '#444'; ctx.fillRect(36, -82, 12, 4); // ручка двери
  // тёмная стойка + лобовое (видно ребром)
  ctx.beginPath(); ctx.moveTo(60, -132); ctx.lineTo(99, -86); ctx.lineWidth = 9; ctx.strokeStyle = '#222'; ctx.stroke();
  // окно двери
  const cw = () => { ctx.beginPath(); ctx.moveTo(30, -128); ctx.lineTo(60, -128); ctx.lineTo(84, -98); ctx.lineTo(30, -98); ctx.closePath(); };
  cw(); ctx.fillStyle = '#86bce0'; ctx.fill();
  ctx.save(); cw(); ctx.clip();
  if (o.crew !== false) {
    const bob = Math.sin(t * 9) * (o.rattle || 0);
    ctx.fillStyle = '#2166b3'; ctx.beginPath(); ctx.ellipse(46, -90 + bob, 22, 14, 0, 0, 7); ctx.fill();
    ART.head(ctx, 'lexa', 50, -111 + bob, .7, t);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(76, -104); ctx.lineTo(66, -96); ctx.stroke(); // руль
  }
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(34, -126); ctx.lineTo(44, -126); ctx.lineTo(34, -104); ctx.closePath(); ctx.fill();
  ctx.restore();
  cw(); outline(ctx, 3);
  // зеркало заднего вида
  ctx.beginPath(); ctx.roundRect(78, -116, 9, 20, 3); fillOut(ctx, '#2b2b2b', 2.2);

  // ----- второй ряд пассажиров за водителем: Денис и Сергей -----
  const cut = (x, y, w, h, who, hs, shoulders) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.fillStyle = '#86bce0'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.clip();
    if (o.crew !== false) {
      const bob = Math.sin(t * 9 + x) * (o.rattle || 0);
      ctx.fillStyle = '#2166b3'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h + 2 + bob, shoulders, 20, 0, 0, 7); ctx.fill();
      ART.head(ctx, who, x + w / 2 + 3, y + h - 20 + bob, hs, t);
    }
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + 14, y + 3); ctx.lineTo(x + 4, y + 24); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); outline(ctx, 4.2);
    // резиновый уплотнитель и ржавый потёк под окном
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 11); ctx.stroke();
    rust(ctx, x + w * .6, y + h + 8, 9, 3.5);
  };
  cut(-80, -128, 44, 52, 'ser', .85, 21);
  cut(-30, -130, 50, 56, 'den', .95, 34);

  // ----- открытая дверь кабины -----
  if (bd === 'door') {
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(28, -98, 54, 58);
    ctx.save(); ctx.translate(86, -70); ctx.rotate(.55 + Math.sin(t * 8) * .12);
    ctx.beginPath(); ctx.roundRect(-58, -60, 58, 92, 4); fillOut(ctx, '#e8e8e0', 3); ctx.restore();
  }

  // ----- передок: капот, фара, чёрный бампер, решётка -----
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(100, -84); ctx.lineTo(128, -68); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(122, -68, 9, 6, -.35, 0, 7); fillOut(ctx, '#fff3a8', 2.4);
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(116, -73); ctx.lineTo(128, -63); ctx.moveTo(128, -73); ctx.lineTo(116, -63); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(110, -60, 26, 24, 5); fillOut(ctx, '#2b2b2b', 3);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(114, -55 + i * 5); ctx.lineTo(132, -55 + i * 5); ctx.stroke(); }
  ctx.fillStyle = '#eee'; ctx.fillRect(114, -43, 18, 6); ctx.fillStyle = '#c00'; ctx.font = 'bold 5px Arial'; ctx.textAlign = 'left'; ctx.fillText('А068РС48', 114.6, -39.8);
  ctx.fillStyle = '#9c4f25'; ctx.fillRect(112, -60, 10, 3); // ржавчина на бампере
  // антенна связи
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; const ax = -100 + Math.sin(t * 6) * 1.5;
  ctx.beginPath(); ctx.moveTo(-98, -138); ctx.lineTo(ax - 4, -172); ctx.stroke();
  ctx.beginPath(); ctx.arc(ax - 4, -174, 3.2, 0, 7); fillOut(ctx, '#e5252a', 1.8);
  ctx.restore();

  // ----- колёса поверх кузова, арки -----
  const wx = [-84, 88];
  wx.forEach((x, i) => {
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, -R + sy, R + 8, Math.PI, 0); ctx.fill();
    ART.wheel(ctx, x, -R, R, o.wr || 0, bd === 'flat' && i === 0);
  });
  // чёрные брызговики
  ctx.fillStyle = '#222'; ctx.fillRect(-120, -22, 5, 22);
};


/* ---------- препятствия ---------- */
ART.drawPit = function (ctx, o) {
  ctx.fillStyle = '#1d1208'; ctx.beginPath(); ctx.moveTo(-o.w / 2, 4); ctx.quadraticCurveTo(0, 70, o.w / 2, 4); ctx.closePath(); fillOut(ctx, '#1d1208', 3);
  ctx.fillStyle = '#3a2814'; ctx.beginPath(); ctx.ellipse(0, 10, o.w / 2 - 10, 6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-o.w / 2 - 12, 4); ctx.lineTo(-o.w / 2 - 12, -26); ctx.stroke();
};
ART.drawPuddle = function (ctx, o) {
  ctx.beginPath(); ctx.ellipse(0, 3, o.w / 2, 11, 0, 0, 7); fillOut(ctx, '#5b8db0', 3);
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(-10, 1, 26, 4, 0, 0, Math.PI); ctx.stroke();
};
ART.drawBump = function (ctx, o) {
  ctx.beginPath(); ctx.moveTo(-o.w / 2, 4); ctx.quadraticCurveTo(0, -34, o.w / 2, 4); ctx.closePath(); fillOut(ctx, '#f2c94c', 3);
  ctx.save(); ctx.clip(); ctx.fillStyle = '#222';
  for (let i = -3; i < 4; i++) { ctx.fillRect(i * 20 - 5, -40, 10, 50); } ctx.restore();
  ctx.beginPath(); ctx.moveTo(-o.w / 2, 4); ctx.quadraticCurveTo(0, -34, o.w / 2, 4); outline(ctx, 3);
};
ART.drawCones = function (ctx, o) {
  for (let i = 0; i < 3; i++) {
    const x = -30 + i * 30; ctx.save(); ctx.translate(x, 2);
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-5, -34); ctx.lineTo(5, -34); ctx.lineTo(11, 0); ctx.closePath(); fillOut(ctx, '#ff7a1a', 2.6);
    ctx.fillStyle = '#fff'; ctx.fillRect(-7.5, -22, 15, 6);
    ctx.restore();
  }
};
ART.drawCow = function (ctx, o, t) {
  ctx.save(); if (o.scared) ctx.scale(-1, 1);
  const leg = o.scared ? Math.sin(t * 20) * 6 : 0;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK;
  [[-24, 0], [-12, 0], [14, 0], [26, 0]].forEach((p, i) => { rrect(ctx, p[0] - 4 + (i % 2 ? leg : -leg), -22, 8, 22, 2); fillOut(ctx, '#f4f4f4', 2.4); });
  rrect(ctx, -36, -56, 76, 40, 14); fillOut(ctx, '#f7f7f7', 3);
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(-12, -40, 10, 7, .3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(16, -30, 8, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(48, -46, 16, 13, 0, 0, 7); fillOut(ctx, '#f7f7f7', 3);
  ctx.fillStyle = '#f1a9a0'; ctx.beginPath(); ctx.ellipse(56, -42, 8, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(46, -50, 2.2, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, -60); ctx.lineTo(38, -70); ctx.moveTo(52, -60); ctx.lineTo(56, -70); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-36, -46); ctx.quadraticCurveTo(-48, -38, -44, -20); ctx.stroke();
  ctx.restore();
};
ART.drawSignPost = function (ctx, text, color, x = 0) {
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, -80); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, -100, 24, 0, 7); fillOut(ctx, '#fff', 3.4);
  ctx.beginPath(); ctx.arc(x, -100, 19, 0, 7); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#111'; ctx.font = 'bold 20px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, -99); ctx.textAlign = 'left';
};
ART.drawDps = function (ctx, o, t) {
  ART.drawSignPost(ctx, '40', '#e5252a', -520);
  // будка
  rrect(ctx, -30, -90, 70, 90, 6); fillOut(ctx, '#3a6fb0', 3);
  ctx.fillStyle = '#fff'; ctx.fillRect(-30, -60, 70, 8);
  ctx.fillStyle = '#9fd0ee'; ctx.fillRect(-20, -80, 50, 14); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.strokeRect(-20, -80, 50, 14);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Russo One",Arial'; ctx.fillText('ДПС', -14, -46);
  // мигалка
  ctx.fillStyle = Math.floor(t * 4) % 2 ? '#e5252a' : '#2a5bd6'; ctx.beginPath(); ctx.arc(5, -98, 7, Math.PI, 0); ctx.fill();
  // полицейский с жезлом
  ART.person(ctx, 'ser', 70, 0, .7, 'stand', t);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(80, -46); ctx.lineTo(96, -70); ctx.stroke();
};
/* ---------- бабулька (x,y — ноги; kind 0..2 — разные бабушки) ---------- */
ART.babka = function (ctx, kind, x, y, t, wave) {
  const coats = ['#8a4b32', '#4b5d7a', '#6b3f6b'], scarves = ['#d9382b', '#9aa0a6', '#2d8a5a'];
  const coat = coats[kind % 3], scarf = scarves[kind % 3];
  ctx.save(); ctx.translate(x, y);
  const sway = Math.sin(t * 1.6 + kind * 2) * 1.2;
  // ноги в тёплых колготках и ботах
  ctx.fillStyle = '#7a6a5a'; ctx.fillRect(-11, -16, 8, 16); ctx.fillRect(3, -16, 8, 16); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.strokeRect(-11, -16, 8, 16); ctx.strokeRect(3, -16, 8, 16);
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-14, -5, 12, 5); ctx.fillRect(2, -5, 12, 5);
  // пальто-колокол
  ctx.beginPath(); ctx.moveTo(-14, -80 + sway); ctx.quadraticCurveTo(-26, -40, -22, -18); ctx.lineTo(22, -18); ctx.quadraticCurveTo(26, -40, 14, -80 + sway); ctx.closePath(); fillOut(ctx, coat, 3);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-1, -78, 2, 60);
  ctx.fillStyle = '#e8d29a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -66 + i * 14, 2, 0, 7); ctx.fill(); }
  // руки
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13, -74); ctx.lineTo(-20, -46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13, -74); ctx.lineTo(wave ? 24 : 20, wave ? -100 + Math.sin(t * 10) * 8 : -46); ctx.stroke();
  ctx.strokeStyle = coat; ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(-13, -74); ctx.lineTo(-20, -46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13, -74); ctx.lineTo(wave ? 24 : 20, wave ? -100 + Math.sin(t * 10) * 8 : -46); ctx.stroke();
  ctx.fillStyle = '#eab98e'; ctx.beginPath(); ctx.arc(-20, -44, 4.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(wave ? 24 : 20, wave ? -102 + Math.sin(t * 10) * 8 : -44, 4.5, 0, 7); ctx.fill();
  // голова
  ctx.save(); ctx.translate(0, -92 + sway);
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 15, 0, 0, 7); fillOut(ctx, '#eab98e', 2.6);
  // платок, завязан под подбородком
  ctx.beginPath(); ctx.moveTo(-15, 2); ctx.quadraticCurveTo(-18, -20, 0, -19); ctx.quadraticCurveTo(18, -20, 15, 2); ctx.quadraticCurveTo(9, -8, 0, -9); ctx.quadraticCurveTo(-9, -8, -15, 2); fillOut(ctx, scarf, 2.6);
  ctx.beginPath(); ctx.moveTo(-9, 12); ctx.lineTo(9, 12); ctx.lineTo(0, 22); ctx.closePath(); fillOut(ctx, scarf, 2.2);
  if (kind === 0) { ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-9 + i * 4.5, -13 + (i % 2) * 3, 1.4, 0, 7); ctx.fill(); } }
  // лицо: очки, морщины, недовольный рот
  ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.quadraticCurveTo(0, -8, 6, -6); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -1, 3.6, 0, 7); ctx.arc(5, -1, 3.6, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-5, -1, 3.6, 0, 7); ctx.moveTo(1.6, -1); ctx.lineTo(-1.6, -1); ctx.moveTo(8.6, -1); ctx.arc(5, -1, 3.6, 0, 7); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-4.4, -1, 1.2, 0, 7); ctx.arc(5.6, -1, 1.2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c48a60'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(1, 1); ctx.lineTo(3, 6); ctx.lineTo(0, 6); ctx.stroke();
  ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-4, 9); ctx.quadraticCurveTo(0, 7, 4, 9); ctx.stroke();
  ctx.restore();
  // предметы: сумка, палка, тележка
  if (kind === 0) { ctx.beginPath(); ctx.roundRect(-38, -40, 20, 24, 3); fillOut(ctx, '#3a8ee0', 2.4); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-34, -40); ctx.quadraticCurveTo(-28, -50, -22, -40); ctx.stroke(); }
  if (kind === 1) { ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(26, -50); ctx.lineTo(30, 0); ctx.stroke(); ctx.strokeStyle = '#a56a2b'; ctx.lineWidth = 3; ctx.stroke(); }
  if (kind === 2) { ctx.beginPath(); ctx.roundRect(24, -48, 22, 34, 3); fillOut(ctx, '#c9a227', 2.4); ctx.beginPath(); ctx.arc(30, -10, 4, 0, 7); ctx.arc(42, -10, 4, 0, 7); fillOut(ctx, '#333', 1.8); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(24, -46); ctx.lineTo(18, -62); ctx.stroke(); }
  ctx.restore();
};

/* ---------- остановка транспорта: павильон, знак, скамейка и три бабульки ---------- */
ART.drawStop = function (ctx, o, t) {
  // столб со знаком «остановка автобуса» и табличка
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-136, 4); ctx.lineTo(-136, -150); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-160, -196, 48, 48, 5); fillOut(ctx, '#2a7ed8', 3.4);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-152, -186, 32, 26, 4); ctx.fill();
  ctx.fillStyle = '#2a7ed8'; ctx.fillRect(-148, -182, 24, 14); ctx.fillStyle = '#fff'; ctx.fillRect(-146, -180, 8, 8); ctx.fillRect(-134, -180, 8, 8);
  ctx.beginPath(); ctx.arc(-144, -158, 3, 0, 7); ctx.arc(-128, -158, 3, 0, 7); ctx.fillStyle = '#222'; ctx.fill();
  ctx.beginPath(); ctx.roundRect(-198, -146, 124, 30, 5); fillOut(ctx, '#fff', 3);
  ctx.fillStyle = '#1b3a8a'; ctx.font = 'bold 13px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ОСТАНОВКА', -136, -136); ctx.fillText('ТРАНСПОРТА', -136, -122); ctx.textAlign = 'left';
  // павильон
  ctx.fillStyle = 'rgba(150,210,235,.45)'; ctx.fillRect(-60, -120, 170, 116); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-60, -120, 170, 116);
  ctx.beginPath(); ctx.moveTo(-72, -118); ctx.lineTo(122, -118); ctx.lineTo(112, -134); ctx.lineTo(-62, -134); ctx.closePath(); fillOut(ctx, '#2f6fb8', 3.4);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -118); ctx.lineTo(-8, -4); ctx.moveTo(52, -118); ctx.lineTo(52, -4); ctx.stroke();
  // скамейка
  ctx.fillStyle = '#9b6b3a'; ctx.fillRect(-4, -30, 100, 9); ctx.strokeRect(-4, -30, 100, 9); ctx.beginPath(); ctx.moveTo(4, -21); ctx.lineTo(4, 0); ctx.moveTo(88, -21); ctx.lineTo(88, 0); ctx.stroke();
  // три бабульки
  if (!o.boarded) {
    ART.babka(ctx, 0, 6, 0, t, true);
    ART.babka(ctx, 1, 52, 0, t, false);
    ART.babka(ctx, 2, 100, 0, t, false);
  }
  if (o.angry) { ctx.font = '34px serif'; ctx.fillText('🦯', 60 + o.angry * 260, -60 - Math.sin(o.angry * 3) * 60); }
};

ART.drawBugorSign = function (ctx, o, t) {
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -180); ctx.lineTo(48, -100); ctx.lineTo(-48, -100); ctx.closePath(); fillOut(ctx, '#ffd24a', 4);
  ctx.beginPath(); ctx.moveTo(0, -168); ctx.lineTo(38, -105); ctx.lineTo(-38, -105); ctx.closePath(); ctx.strokeStyle = '#e5252a'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-26, -110); ctx.quadraticCurveTo(0, -160, 26, -110); ctx.closePath(); ctx.fill();
  rrect(ctx, -80, -90, 160, 30, 6); fillOut(ctx, '#fff', 3);
  ctx.fillStyle = '#c00'; ctx.font = 'bold 20px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('БУГОР ➜', 0, -74); ctx.textAlign = 'left';
};

/* ---------- бонусы (эмодзи с ореолом) ---------- */
ART.drawPickup = function (ctx, icon, t) {
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(0, 0, 27 + Math.sin(t * 5) * 2, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, 0, 3); ctx.textAlign = 'left';
};

/* ---------- ларёк шаурмы ---------- */
ART.drawShawarma = function (ctx, t) {
  rrect(ctx, -90, -140, 180, 140, 8); fillOut(ctx, '#f6d365', 3.4);
  ctx.fillStyle = '#d9382b'; ctx.fillRect(-98, -158, 196, 30); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.strokeRect(-98, -158, 196, 30);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ШАУРМА 24', 0, -142);
  ctx.fillStyle = '#5b3a1e'; rrect(ctx, -68, -110, 96, 58, 4); fillOut(ctx, '#5b3a1e', 3);
  // вертел
  ctx.save(); ctx.translate(-20, -80); ctx.fillStyle = '#c47a35'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 26, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (let i = -3; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14, i * 6); ctx.lineTo(14, i * 6 + Math.sin(t * 4 + i) * 2); ctx.stroke(); } ctx.restore();
  ctx.font = '30px serif'; ctx.fillText('🌯', 52, -70);
  ctx.fillStyle = '#fff'; ctx.fillRect(30, -22, 44, 10); ctx.textAlign = 'left';
};
/* ---------- кафе «Эдем» ---------- */
ART.drawEden = function (ctx, t) {
  rrect(ctx, -130, -150, 260, 150, 6); fillOut(ctx, '#e9e2c9', 3.4);
  ctx.beginPath(); ctx.moveTo(-140, -150); ctx.lineTo(0, -190); ctx.lineTo(140, -150); ctx.closePath(); fillOut(ctx, '#8a4b2c', 3.4);
  rrect(ctx, -100, -140, 200, 34, 8); fillOut(ctx, '#2f7d3a', 3.4);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('кафе «ЭДЕМ»', 8, -123);
  ctx.font = '22px serif'; ctx.fillText('🍎', -88, -122);
  ctx.fillStyle = '#9fd0ee'; ctx.fillRect(-110, -96, 70, 60); ctx.fillRect(40, -96, 70, 60);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-110, -96, 70, 60); ctx.strokeRect(40, -96, 70, 60);
  rrect(ctx, -22, -80, 44, 80, 4); fillOut(ctx, '#7a4a2a', 3);
  // пластиковые стулья
  [[-150, '#e5252a'], [150, '#e5252a']].forEach(([x, c]) => { ctx.fillStyle = c; ctx.fillRect(x - 12, -26, 24, 5); ctx.fillRect(x - 12, -46, 4, 22); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x - 12, -26, 24, 5); });
  ctx.textAlign = 'left';
};
/* ---------- ворота объекта ---------- */
ART.drawGate = function (ctx, label, t) {
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  ctx.fillStyle = '#7d8a96'; ctx.fillRect(-100, -180, 16, 180); ctx.strokeRect(-100, -180, 16, 180);
  ctx.fillRect(84, -180, 16, 180); ctx.strokeRect(84, -180, 16, 180);
  rrect(ctx, -110, -230, 220, 54, 8); fillOut(ctx, '#0a7fd6', 3.4);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 30px "Russo One",Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, -203); ctx.textAlign = 'left';
  ctx.font = '40px serif'; ctx.fillText('🏁', 120, -30);
};

/* ---------- фон и декорации ---------- */
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

ART.drawBackground = function (ctx, camX, camY, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6db8f2'); g.addColorStop(.6, '#cdeaff'); g.addColorStop(1, '#f2f8ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(1050, 110, 46, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,243,176,.3)'; ctx.beginPath(); ctx.arc(1050, 110, 68, 0, 7); ctx.fill();
  // облака
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 330 - camX * .05 - t * 6) % 2000 + 2000) % 2000 - 300, cy = 70 + hash(i) * 120;
    ctx.beginPath(); ctx.ellipse(cx, cy, 64, 22, 0, 0, 7); ctx.ellipse(cx + 36, cy - 14, 40, 22, 0, 0, 7); ctx.ellipse(cx - 34, cy - 8, 36, 18, 0, 0, 7); ctx.fill();
  }
  // дальние холмы
  const off = camY * .12;
  ctx.fillStyle = '#9ec7b0'; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) { const wx = x + camX * .18; ctx.lineTo(x, 380 - off + Math.sin(wx * .0035) * 50 + Math.sin(wx * .011) * 18); }
  ctx.lineTo(W, H); ctx.fill();
  ctx.fillStyle = '#7fb08f'; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) { const wx = x + camX * .32; ctx.lineTo(x, 430 - off * 1.4 + Math.sin(wx * .0048 + 2) * 40 + Math.sin(wx * .015) * 14); }
  ctx.lineTo(W, H); ctx.fill();
  // мачты связи и ЛЭП на дальнем плане
  for (let k = -1; k < 8; k++) {
    const i = Math.floor((camX * .32) / 300) + k, x = i * 300 - camX * .32;
    const baseY = 430 - off * 1.4 + Math.sin((i * 300) * .0048 + 2) * 40 + Math.sin((i * 300) * .015) * 14 + 8;
    ctx.strokeStyle = '#4c5a66'; ctx.lineWidth = 2.4;
    if (i % 4 === 0) { // мачта
      ctx.beginPath(); ctx.moveTo(x - 10, baseY); ctx.lineTo(x, baseY - 120); ctx.lineTo(x + 10, baseY); ctx.moveTo(x - 6, baseY - 40); ctx.lineTo(x + 6, baseY - 40); ctx.moveTo(x - 4, baseY - 80); ctx.lineTo(x + 4, baseY - 80); ctx.stroke();
      ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#e5252a' : '#7a2a2a'; ctx.beginPath(); ctx.arc(x, baseY - 124, 3, 0, 7); ctx.fill();
    } else { // опора ЛЭП
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - 60); ctx.moveTo(x - 14, baseY - 54); ctx.lineTo(x + 14, baseY - 54); ctx.stroke();
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 14, baseY - 54); ctx.quadraticCurveTo(x + 150, baseY - 30, x + 286, baseY - 54); ctx.stroke();
    }
  }
};

/* придорожные декорации, привязаны к миру; y — высота земли в этой точке */
ART.drawScenery = function (ctx, x, y, i) {
  const r = hash(i), r2 = hash(i + 50);
  ctx.save(); ctx.translate(x, y);
  if (r < .35) { // куст
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath(); ctx.ellipse(0, -14, 26 + r2 * 12, 18 + r2 * 6, 0, 0, 7); ctx.ellipse(-20, -8, 18, 12, 0, 0, 7); ctx.ellipse(22, -8, 18, 12, 0, 0, 7); fillOut(ctx, '#4a9a3a', 2.6);
  } else if (r < .55) { // столб километровый
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; rrect(ctx, -9, -50, 18, 50, 3); fillOut(ctx, '#fff', 2.6);
    ctx.fillStyle = '#e5252a'; ctx.fillRect(-9, -50, 18, 10);
  } else if (r < .75) { // берёза
    ctx.fillStyle = '#eee'; ctx.fillRect(-4, -110, 8, 110); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.strokeRect(-4, -110, 8, 110);
    ctx.fillStyle = '#222'; ctx.fillRect(-4, -70, 8, 3); ctx.fillRect(-4, -40, 8, 3);
    ctx.fillStyle = '#7dbf4a'; ctx.beginPath(); ctx.ellipse(0, -120, 32, 34, 0, 0, 7); fillOut(ctx, '#7dbf4a', 2.6);
  } else if (r < .9) { // столб связи
    ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -120); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, -112); ctx.lineTo(18, -112); ctx.stroke();
  } else { // стог
    ctx.fillStyle = '#e8c65a'; ctx.beginPath(); ctx.ellipse(0, -22, 34, 26, 0, Math.PI, 0); ctx.lineTo(34, 0); ctx.lineTo(-34, 0); ctx.closePath(); fillOut(ctx, '#e8c65a', 2.6);
  }
  ctx.restore();
};
