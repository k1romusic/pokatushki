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

