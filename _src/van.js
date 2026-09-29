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

