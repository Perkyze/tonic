/* Tonic — the Learn trail: eight illustrated landscapes, one per chapter.
   Each biome has its own sky, ground, trees and weather; clouds hide the seam between them.
   Trail.render(ci, avoid) returns the scenery for one chapter as an HTML string (SVG + weather + seam).
   Coordinates are in a 390 × 900 box per chapter; the coins are placed by app.js at Trail.stops(ci). */
(function () {
  'use strict';
  const S = window.SCN, f = S.f;
  const T = { rng: window.Theory.makeRng };
  const W = 390, H = 900;

  // Eight biomes. ac: the chapter colour (coins, banner, cards). seam: colour of the cloud bank below it.
  const BIOMES = [
    { name: 'Meadow', inX: 300, outX: 240, stops: [[285, 295], [125, 395], [255, 525], [120, 670]], ttl: 'L', txt: 'dark', tx: '#1d3a2a', ac: '#2f9e62',
      seam: '#effaf6', trail: ['#f7e9bd', '#e3cd8c'], draw: meadow, fx: fxButterflies },
    { name: 'Pine lake', inX: 240, outX: 100, stops: [[300, 295], [150, 395], [270, 530], [160, 680]], ttl: 'L', txt: 'dark', tx: '#163c37', ac: '#2a7f72',
      seam: '#fff4e2', trail: ['#e5f5ef', '#bfe0d6'], draw: pinelake, fx: fxFog },
    { name: 'Autumn woods', inX: 100, outX: 280, stops: [[110, 295], [265, 385], [130, 525], [265, 675]], ttl: 'R', txt: 'dark', tx: '#4a2410', ac: '#c4561c',
      seam: '#fff1d6', trail: ['#f7dcae', '#ddb77a'], draw: autumn, fx: fxLeaves },
    { name: 'Savanna', inX: 280, outX: 110, stops: [[290, 295], [140, 395], [260, 530], [120, 680]], ttl: 'L', txt: 'dark', tx: '#4b2a0b', ac: '#c2621f',
      seam: '#ffe3d6', trail: ['#f9e3b0', '#dcb873'], draw: savanna, fx: fxHaze },
    { name: 'Sunset coast', inX: 110, outX: 270, stops: [[100, 295], [255, 400], [120, 535], [270, 680]], ttl: 'R', txt: 'light', tx: '#fff', ac: '#e0567f',
      seam: '#c3cce2', trail: ['#c99263', '#a5734a'], draw: coast, fx: fxGlints },
    { name: 'Rainy moor', inX: 270, outX: 130, stops: [[290, 295], [150, 395], [270, 530], [140, 680]], ttl: 'L', txt: 'light', tx: '#fff', ac: '#5a7bd6',
      seam: '#eef3ff', trail: ['#93a3b8', '#93a3b8'], draw: moor, fx: fxRain },
    { name: 'Snowy peaks', inX: 130, outX: 220, stops: [[110, 295], [262, 395], [120, 530], [262, 680]], ttl: 'R', txt: 'dark', tx: '#1f2e57', ac: '#3f6fd8',
      seam: '#323a86', trail: ['#ffffff', '#b8cbec'], draw: peaks, fx: fxSnow },
    { name: 'Aurora', inX: 220, outX: null, stops: [[300, 315], [150, 430], [270, 560], [195, 700]], ttl: 'L', txt: 'light', tx: '#fff', ac: '#8f6bff',
      seam: null, trail: ['#c6b5ff', '#c6b5ff'], draw: aurora, fx: fxNight },
  ];

  // Stepping-stone layout: one S-curve that continues from biome to biome, 4 coins each (3 lessons + trophy)
  BIOMES.forEach((b, ci) => {
    b.stops = [0, 1, 2, 3].map((j) => [Math.round(195 + 88 * Math.sin((ci * 4 + j) * Math.PI / 4)), [300, 420, 540, 665][j]]);
    b.inX = 195;
    b.outX = ci < BIOMES.length - 1 ? 195 : null;
  });
  const shade = (h, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

  const sky = (id, a, b, h) => '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>' +
    '<rect width="' + W + '" height="' + (h + 40) + '" fill="url(#' + id + ')"/>';

  function trailSvg(b, d) {
    const [c, e] = b.trail;
    if (b.name === 'Sunset coast') return '<path d="' + d + '" stroke="#8a5d38" stroke-width="22" fill="none" stroke-linecap="round" opacity=".35"/>' +
      '<path d="' + d + '" stroke="' + c + '" stroke-width="18" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="' + e + '" stroke-width="18" fill="none" stroke-dasharray="2 7"/>';
    if (b.name === 'Rainy moor') return '<path d="' + d + '" stroke="rgba(0,0,0,.18)" stroke-width="17" fill="none" stroke-linecap="round" stroke-dasharray="1 19" transform="translate(0 3)"/>' +
      '<path d="' + d + '" stroke="' + c + '" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="1 19"/>';
    if (b.name === 'Aurora') return '<path d="' + d + '" stroke="#8f7bff" stroke-width="20" fill="none" opacity=".18" stroke-linecap="round"/>' +
      '<path d="' + d + '" stroke="' + c + '" stroke-width="12" fill="none" opacity=".25" stroke-linecap="round" stroke-dasharray="0.1 14"/>' +
      '<path d="' + d + '" stroke="#f1ebff" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="0.1 14"/>';
    return '<path d="' + d + '" stroke="' + e + '" stroke-width="24" fill="none" stroke-linecap="round"/>' +
      '<path d="' + d + '" stroke="' + c + '" stroke-width="18" fill="none" stroke-linecap="round"/>' +
      (b.name === 'Snowy peaks' ? '<path d="' + d + '" stroke="#c9d8f2" stroke-width="5" fill="none" stroke-dasharray="3 9" stroke-linecap="round"/>' : '');
  }

  // ---------- the eight scenes ----------
  function meadow(sc) {
    let s = sky('s1', '#aee3ff', '#fff3cc', 230) +
      '<g class="rays" opacity=".35">' + [...Array(12)].map((_, i) => '<rect x="327" y="10" width="6" height="40" rx="3" fill="#fff6b0" transform="rotate(' + i * 30 + ' 330 80)"/>').join('') + '</g>' +
      '<circle cx="330" cy="80" r="44" fill="#fff4a8" opacity=".45"/><circle cx="330" cy="80" r="27" fill="#ffe066"/>' +
      S.cloud(250, 50, 0.9, '#fff', 0.9) + S.cloud(60, 190, 0.7, '#fff', 0.8) +
      S.hills(205, 10, '#bfe8b0', 11, { freq: 0.8 }) + S.hills(228, 12, '#a6dd95', 12, { freq: 1.2 }) +
      S.hills(265, 14, '#8fd47f', 13) + S.hills(420, 18, '#80ca70', 14) + S.hills(600, 18, '#72be64', 15) + S.hills(780, 16, '#66b259', 16) +
      '<ellipse cx="310" cy="790" rx="70" ry="24" fill="#5aa8c9"/><ellipse cx="310" cy="786" rx="66" ry="20" fill="#83d4f2"/>' +
      '<ellipse cx="290" cy="784" rx="9" ry="4" fill="#4fae5c"/><ellipse cx="330" cy="792" rx="7" ry="3" fill="#4fae5c"/><circle cx="292" cy="783" r="2" fill="#ff8fbf"/>';
    sc.add(9, [10, 250, 380, 860], 34, 50, (x, y, r) => r() < 0.55 ? S.roundTree(x, y, 0.8 + r() * 0.5, '#ffb7d5', '#f08cb8', { dots: '#fff' }) : S.roundTree(x, y, 0.8 + r() * 0.5, '#5cbf5f', '#43a14b', { dots: r() < 0.4 ? '#ff6b6b' : null }));
    sc.add(8, [10, 260, 380, 880], 26, 30, (x, y, r) => S.bush(x, y, 0.9 + r() * 0.4, '#56b85a', '#3e9a47', r() < 0.5 ? '#fff' : null));
    sc.add(55, [5, 250, 385, 895], 16, 9, (x, y, r) => S.flower(x, y, ['#fff', '#ffd23f', '#ff8fbf', '#b49bff'][Math.floor(r() * 4)]));
    sc.add(20, [5, 250, 385, 895], 14, 12, (x, y, r) => S.tuft(x, y, '#4fa64f', 0.8 + r() * 0.5));
    return s;
  }

  function pinelake(sc) {
    let s = sky('s2', '#d7f2ed', '#a9dcd3', 230) + '<circle cx="320" cy="72" r="24" fill="#fff" opacity=".65"/>' +
      S.mountain(60, 230, 200, 110, '#a6d6cc', '#95cbc0') + S.mountain(210, 230, 240, 150, '#9bd0c5', '#8ac4b8') + S.mountain(360, 230, 200, 100, '#a6d6cc', '#95cbc0') +
      S.hills(232, 6, '#86c8b8', 21) + S.hills(380, 12, '#73b9a8', 22) + S.hills(560, 15, '#65ad9b', 23) + S.hills(760, 14, '#579f8d', 24) +
      '<path d="M-20 470 C40 440 150 455 175 520 C200 590 120 640 40 630 C0 625 -20 600 -20 600Z" fill="#5fa9b9"/>' +
      '<path d="M-20 476 C40 448 146 462 168 520 C190 584 118 630 40 622 C0 618 -20 596 -20 596Z" fill="#8fd3e2"/>' +
      [[30, 500], [90, 540], [50, 580], [120, 590]].map(([x, y]) => '<path d="M' + x + ' ' + y + ' h22" stroke="#c9eef5" stroke-width="2" stroke-linecap="round"/>').join('') +
      '<g class="boat"><path d="M52 560 h40 l-6 9 h-28z" fill="#e8553d"/><path d="M58 560 l12 -7 l14 7" stroke="#8a4b2a" stroke-width="2" fill="none"/></g>' +
      '<rect x="0" y="300" width="390" height="40" fill="#fff" opacity=".22" filter="url(#blur)"/><rect x="0" y="640" width="390" height="50" fill="#fff" opacity=".2" filter="url(#blur)"/>';
    const pc = [['#3d8f7f', '#2e7566'], ['#2f7d6e', '#24645a'], ['#4a9c8a', '#3a8574']];
    sc.add(34, [0, 240, 390, 890], 26, 22, (x, y, r) => { const c = pc[Math.floor(r() * 3)]; return S.pine(x, y, 0.7 + r() * 0.7, c[0], c[1]); });
    sc.add(10, [0, 250, 390, 890], 18, 16, (x, y, r) => S.rock(x, y, 0.6 + r() * 0.4, '#8fb5ab', '#769d93'));
    return s;
  }

  function autumn(sc) {
    let s = sky('s3', '#ffe2b4', '#ffc27c', 230) + '<circle cx="70" cy="95" r="40" fill="#ffd28a" opacity=".5"/><circle cx="70" cy="95" r="26" fill="#ffb347"/>' +
      S.cloud(150, 60, 0.6, '#fff1dc', 0.8) +
      S.hills(206, 12, '#eaa862', 31, { freq: 0.9 }) + S.hills(232, 10, '#e19750', 32) +
      S.hills(260, 12, '#d9944a', 33) + S.hills(420, 16, '#cd8742', 34) + S.hills(600, 18, '#c17a38', 35) + S.hills(780, 16, '#b26d2f', 36) +
      '<path d="M-20 610 C80 575 140 480 200 455 S330 370 410 340" stroke="#4f97b8" stroke-width="40" fill="none"/>' +
      '<path d="M-20 610 C80 575 140 480 200 455 S330 370 410 340" stroke="#71bad9" stroke-width="32" fill="none"/>' +
      '<path d="M-20 610 C80 575 140 480 200 455 S330 370 410 340" stroke="#a9ddf0" stroke-width="2" fill="none" stroke-dasharray="14 22"/>';
    // the bridge goes wherever the trail meets the river
    const river = S.curve([[-20, 610], [100, 555], [200, 455], [300, 385], [410, 340]]).samples;
    let best = [1e9, 0];
    sc.samples.forEach((p, i) => river.forEach((q) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < best[0]) best = [d, i]; }));
    const bp = sc.samples[best[1]], bn = sc.samples[Math.min(best[1] + 1, sc.samples.length - 1)], bq = sc.samples[Math.max(best[1] - 1, 0)];
    const ang = Math.atan2(bn[1] - bq[1], bn[0] - bq[0]) * 180 / Math.PI - 90;
    sc.bridge = '<g transform="translate(' + f(bp[0]) + ' ' + f(bp[1]) + ') rotate(' + f(ang) + ')"><rect x="-15" y="-28" width="30" height="56" fill="#9a6034"/>' +
      [...Array(8)].map((_, i) => '<rect x="-15" y="' + f(-28 + i * 7.4) + '" width="30" height="1.6" fill="#6e4021"/>').join('') +
      '<rect x="-18" y="-30" width="3.5" height="60" rx="1.5" fill="#6e4021"/><rect x="14.5" y="-30" width="3.5" height="60" rx="1.5" fill="#6e4021"/></g>';
    const tc = [['#ff9f43', '#e07f22'], ['#e8553d', '#bf3b28'], ['#ffcc4d', '#e6a92a'], ['#d9692b', '#b35018']];
    sc.add(16, [0, 250, 390, 880], 32, 44, (x, y, r) => { const c = tc[Math.floor(r() * 4)]; return S.roundTree(x, y, 0.8 + r() * 0.55, c[0], c[1], { trunk: '#5b3520' }); });
    sc.add(8, [0, 260, 390, 890], 16, 18, (x, y, r) => S.mushroom(x, y, 0.9 + r() * 0.5));
    sc.add(3, [0, 300, 390, 890], 20, 40, (x, y) => S.g(x, y, 1, '<ellipse cx="0" cy="-6" rx="10" ry="7" fill="#ff8a1f"/><ellipse cx="0" cy="-6" rx="4" ry="7" fill="#f07400"/><rect x="-1" y="-15" width="2.5" height="4" fill="#4f7d2b"/>'));
    sc.add(14, [0, 250, 390, 890], 14, 14, (x, y, r) => S.tuft(x, y, '#a85f22', 0.8 + r() * 0.4));
    return s;
  }

  function savanna(sc) {
    let s = sky('s4', '#ffd57e', '#ff985a', 230) + '<circle cx="300" cy="185" r="70" fill="#fff0b8" opacity=".35"/><circle cx="300" cy="185" r="44" fill="#fff0b8"/>' +
      '<path d="M0 230 V200 h40 l8 -18 h70 l10 18 h20 V230Z M230 230 V206 l12 -14 h60 l14 14 h74 V230Z" fill="#e08a55"/>' +
      S.hills(222, 4, '#e9b862', 41, { freq: 0.6 }) + S.hills(380, 10, '#ddab52', 42) + S.hills(570, 12, '#d09b45', 43) + S.hills(770, 12, '#c38c3a', 44) +
      '<ellipse cx="320" cy="790" rx="55" ry="15" fill="#6ea4b8"/><ellipse cx="320" cy="788" rx="50" ry="12" fill="#8fc6d6"/>' +
      '<path d="M60 770 l-10 -40 l10 6 l8 -12 l6 46z" fill="#b8763e"/><path d="M60 770 l8 -46 l6 46z" fill="#9c602f"/>';
    sc.add(9, [0, 240, 390, 870], 40, 70, (x, y, r) => S.acacia(x, y, 0.9 + r() * 0.6, '#7d8b3a', '#5f6c2b'));
    sc.add(34, [0, 240, 390, 895], 16, 14, (x, y, r) => S.tuft(x, y, r() < 0.5 ? '#f2cf6b' : '#c99a3d', 0.9 + r() * 0.6));
    sc.add(7, [0, 250, 390, 890], 18, 24, (x, y, r) => S.rock(x, y, 0.6 + r() * 0.5, '#c08a55', '#a37244'));
    return s;
  }

  function coast(sc) {
    let s = sky('s5', '#ff78a6', '#ffb36b', 230) +
      '<circle cx="280" cy="232" r="56" fill="#ffe2a1" opacity=".35"/><path d="M240 232 a40 40 0 0 1 80 0z" fill="#fff1a3"/>' +
      S.cloud(90, 70, 0.8, '#ffc1d8', 0.9) + S.cloud(200, 120, 0.6, '#ffd0b0', 0.8) +
      '<path d="M0 230 H390 V485 C330 470 300 420 230 380 S70 320 0 335Z" fill="#6c5ed6"/>' +
      '<path d="M0 230 H390 V260 H0Z" fill="#8a6ad8"/>' +
      [...Array(9)].map((_, i) => '<rect x="' + (262 - i * 2) + '" y="' + (242 + i * 9) + '" width="' + (36 + i * 4) + '" height="2.5" rx="1.2" fill="#ffd48a" opacity="' + (0.8 - i * 0.07) + '"/>').join('') +
      '<path d="M0 335 C70 320 230 380 230 380 S330 470 390 485" stroke="#fff" stroke-width="6" fill="none" opacity=".8"/>' +
      '<path d="M0 341 C70 326 230 386 230 386 S330 476 390 491 V900 H0Z" fill="#ffd9a0"/>' +
      S.hills(640, 10, '#ffcf8c', 51) + S.hills(800, 10, '#f7c37c', 52) +
      '<g class="boat"><path d="M318 312 h36 l-6 8 h-24z" fill="#fff"/><path d="M336 310 v-34 l16 30z" fill="#fff"/><path d="M334 310 v-26 l-12 24z" fill="#ffd2e2"/></g>' +
      '<ellipse cx="80" cy="820" rx="40" ry="11" fill="#7fd0e0" opacity=".8"/>';
    sc.add(10, [0, 360, 390, 880], 34, 50, (x, y, r) => S.palm(x, y, 0.85 + r() * 0.5, '#2f9a5f', '#1f7346', r() < 0.5 ? -1 : 1));
    sc.add(6, [0, 380, 390, 890], 18, 30, (x, y, r) => S.g(x, y, 0.8 + r() * 0.4, '<polygon points="0,-10 2.4,-3.3 9.5,-3.1 3.9,1.3 5.9,8.1 0,4.1 -5.9,8.1 -3.9,1.3 -9.5,-3.1 -2.4,-3.3" fill="' + (r() < 0.5 ? '#ff7a59' : '#ffb03b') + '"/>'));
    sc.add(2, [150, 560, 390, 880], 30, 80, (x, y) => S.g(x, y, 1, '<ellipse cx="0" cy="0" rx="16" ry="4" fill="#000" opacity=".12"/><rect x="-1" y="-30" width="2" height="30" fill="#8a5a30"/><path d="M-20 -26 Q0 -44 20 -26Z" fill="#ff5d8f"/><path d="M-7 -26 Q0 -44 7 -26Z" fill="#fff"/>'));
    return s;
  }

  function moor(sc) {
    let s = sky('s6', '#5d6e95', '#8798ba', 230) +
      S.cloud(60, 60, 1.6, '#4a5779') + S.cloud(200, 40, 1.9, '#455272') + S.cloud(340, 70, 1.5, '#4a5779') + S.cloud(130, 110, 1.2, '#56648a', 0.9) +
      S.hills(205, 12, '#5a6c92', 61, { freq: 0.8 }) + S.hills(230, 10, '#51648a', 62) +
      S.hills(250, 12, '#4f6e76', 63) + S.hills(410, 14, '#476671', 64) + S.hills(590, 16, '#405e69', 65) + S.hills(780, 14, '#39555f', 66);
    [[60, 470], [330, 610], [230, 820], [90, 860]].forEach(([x, y], i) => {
      s += '<ellipse cx="' + x + '" cy="' + y + '" rx="34" ry="9" fill="#8aa3c4" opacity=".55"/>' +
        '<ellipse class="ripple" style="animation-delay:' + (i * 0.7) + 's" cx="' + (x - 8) + '" cy="' + y + '" rx="10" ry="3" fill="none" stroke="#d9e4ff" stroke-width="1"/>' +
        '<ellipse class="ripple" style="animation-delay:' + (i * 0.7 + 1.3) + 's" cx="' + (x + 10) + '" cy="' + (y + 2) + '" rx="8" ry="2.4" fill="none" stroke="#d9e4ff" stroke-width="1"/>';
    });
    sc.at(330, 800, S.cottage(330, 800, 1.3, '#cdb9a0', '#5b4a63', true) + '<circle class="smoke" cx="345" cy="740" r="6" fill="#c9d2e6"/><circle class="smoke" style="animation-delay:2s" cx="345" cy="740" r="6" fill="#c9d2e6"/>');
    sc.add(9, [0, 250, 390, 870], 36, 52, (x, y, r) => S.willow(x, y, 0.9 + r() * 0.5, '#5a8a74', '#41705b'));
    sc.add(4, [0, 280, 390, 880], 22, 70, (x, y) => S.lamp(x, y, 1));
    sc.add(24, [0, 250, 390, 895], 14, 12, (x, y, r) => S.tuft(x, y, '#5f8577', 0.8 + r() * 0.6));
    return s;
  }

  function peaks(sc) {
    let s = sky('s7', '#9dbcf5', '#e4edff', 230) + '<circle cx="80" cy="70" r="20" fill="#fff" opacity=".8"/>' +
      S.mountain(70, 232, 230, 170, '#c4d4f3', '#a9bde6', '#fff') + S.mountain(250, 232, 280, 200, '#b9cbef', '#9fb5e2', '#fff') + S.mountain(380, 232, 190, 130, '#c4d4f3', '#a9bde6', '#fff') +
      S.hills(236, 6, '#f2f6ff', 71) + S.hills(400, 12, '#e8effc', 72) + S.hills(580, 14, '#dde7f9', 73) + S.hills(780, 14, '#d2def5', 74) +
      '<ellipse cx="320" cy="610" rx="80" ry="28" fill="#a8d3ec"/><ellipse cx="320" cy="607" rx="74" ry="23" fill="#c8e8f7"/>' +
      '<path d="M280 600 l30 6 M300 614 l40 -4 M330 600 l24 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    sc.at(70, 800, S.cottage(70, 800, 1.3, '#b5764a', '#e9f0ff', true) + '<circle class="smoke" cx="85" cy="740" r="6" fill="#fff"/><circle class="smoke" style="animation-delay:2s" cx="85" cy="740" r="6" fill="#fff"/>');
    sc.at(300, 820, S.snowman(300, 820, 1.2));
    sc.add(26, [0, 250, 390, 880], 28, 26, (x, y, r) => S.pine(x, y, 0.7 + r() * 0.7, '#2f6178', '#244c60', { snow: true, trunk: '#4a3528' }));
    sc.add(14, [0, 250, 390, 895], 14, 20, (x, y, r) => '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(10 + r() * 14) + '" ry="3" fill="#b9cbef" opacity=".6"/>');
    return s;
  }

  function aurora(sc) {
    let s = sky('s8', '#060a24', '#1d2156', 330);
    const r = T.rng(81);
    for (let i = 0; i < 70; i++) s += '<circle class="tw" style="animation-delay:' + f(r() * 3) + 's" cx="' + f(r() * W) + '" cy="' + f(r() * 300) + '" r="' + f(0.6 + r() * 1.3) + '" fill="#fff"/>';
    s += '<defs><linearGradient id="au" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3dffb0" stop-opacity="0"/><stop offset=".3" stop-color="#3dffb0"/><stop offset=".65" stop-color="#4cc9f0"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="aur" d="M-20 120 C60 60 140 160 220 90 S340 60 420 110 L420 150 C340 110 280 140 220 140 S60 110 -20 170Z" fill="url(#au)" opacity=".7" filter="url(#blur)"/>' +
      '<path class="aur" style="animation-delay:-3s" d="M-20 190 C80 130 170 210 250 160 S360 150 420 180 L420 205 C340 185 300 200 250 200 S80 180 -20 220Z" fill="url(#au)" opacity=".5" filter="url(#blur)"/>' +
      '<circle cx="335" cy="70" r="20" fill="#fff6d6"/><circle cx="344" cy="64" r="18" fill="#0a0f2e"/>' +
      S.mountain(60, 330, 240, 150, '#161c48', '#121740', '#3b4486') + S.mountain(260, 330, 300, 190, '#1a2152', '#151b46', '#3b4486') + S.mountain(390, 330, 180, 110, '#161c48', '#121740') +
      S.hills(330, 6, '#1d2457', 82) + S.hills(470, 12, '#191f4c', 83) + S.hills(640, 14, '#151a41', 84) + S.hills(810, 12, '#111536', 85) +
      '<defs><linearGradient id="beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd23f" stop-opacity=".45"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon points="185,690 120,430 160,430" fill="url(#beam)"/><polygon points="205,690 240,430 280,430" fill="url(#beam)"/>' +
      '<ellipse cx="195" cy="708" rx="64" ry="16" fill="#2a2f6e"/><ellipse cx="195" cy="704" rx="60" ry="13" fill="#363c86"/>';
    sc.add(14, [0, 340, 390, 880], 24, 30, (x, y, r) => S.crystal(x, y, 0.7 + r() * 0.6, r() < 0.5 ? '#b48cff' : '#5ee7ff'));
    sc.add(12, [0, 340, 390, 890], 26, 26, (x, y, r) => S.pine(x, y, 0.7 + r() * 0.6, '#0f1436', '#0b0f2b', { trunk: '#0b0f2b' }));
    sc.add(10, [0, 340, 390, 895], 18, 20, (x, y, r) => S.rock(x, y, 0.6 + r() * 0.4, '#262c66', '#1e2356'));
    return s;
  }

  // ---------- weather overlays ----------
  function fxButterflies() { return [[18, 40], [62, 52], [40, 74], [80, 86]].map(([l, t], i) => '<span class="bfly" style="left:' + l + '%;top:' + t + '%;animation-delay:-' + i * 2.2 + 's">🦋</span>').join(''); }
  function fxFog() { return [30, 58, 84].map((t, i) => '<div class="fog" style="top:' + t + '%;animation-delay:-' + i * 4 + 's"></div>').join(''); }
  function fxLeaves() {
    const r = T.rng(5), c = ['#ff9f43', '#e8553d', '#ffcc4d', '#d9692b'];
    return [...Array(16)].map((_, i) => '<i class="leaf" style="left:' + f(r() * 95) + '%;background:' + c[i % 4] + ';animation-duration:' + f(7 + r() * 6) + 's;animation-delay:-' + f(r() * 12) + 's"></i>').join('');
  }
  const BIRD = '<svg viewBox="0 0 18 8"><path d="M0 2 Q4 -1 9 5 Q13 -1 18 2" stroke="#3a2410" stroke-width="1.6" fill="none"/></svg>';
  function fxHaze() { return '<div class="haze"></div>' + [[10, 0], [13, 0.6], [11, 1.2]].map(([t, d]) => '<span class="bird" style="top:' + t + '%;animation-duration:16s;animation-delay:-' + (d + 4) + 's">' + BIRD + '</span>').join(''); }
  function fxGlints() {
    const r = T.rng(9);
    return [...Array(14)].map(() => '<i class="glint" style="left:' + f(10 + r() * 85) + '%;top:' + f(30 + r() * 18) + '%;animation-delay:-' + f(r() * 2.4) + 's"></i>').join('') +
      [[14, 2], [17, 2.5]].map(([t, d]) => '<span class="bird" style="top:' + t + '%;animation-duration:20s;animation-delay:-' + d * 3 + 's">' + BIRD.replace('#3a2410', '#fff') + '</span>').join('');
  }
  function fxRain() { return '<div class="rain"></div><div class="rain b"></div><div class="flash"></div>'; }
  function fxSnow() { return '<div class="snow"></div><div class="snow b"></div>'; }
  function fxNight() { return '<div class="shoot"></div>'; }
  function seam(c, seed) {
    const r = T.rng(300 + seed);
    let s = '<svg viewBox="0 0 390 150" preserveAspectRatio="none"><defs><linearGradient id="sg' + seed + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity="0"/>' +
      '<stop offset=".35" stop-color="' + c + '" stop-opacity=".9"/><stop offset=".65" stop-color="' + c + '" stop-opacity=".9"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="390" height="150" fill="url(#sg' + seed + ')"/>';
    for (let x = -20; x < 420; x += 26 + r() * 18) s += '<circle cx="' + f(x) + '" cy="' + f(62 + r() * 26) + '" r="' + f(20 + r() * 18) + '" fill="' + c + '" opacity="' + f(0.75 + r() * 0.25) + '"/>';
    return s + '</svg>';
  }


  // The Tonic eighth-note as a little character
  function mascot() {
    const ink = '#15122b';
    return '<svg viewBox="0 0 80 100" aria-hidden="true">' +
      '<ellipse cx="34" cy="96" rx="22" ry="4" fill="rgba(0,0,0,.18)"/>' +
      '<rect x="48" y="8" width="8" height="64" rx="4" fill="#c9960a"/><path d="M54 8c14 3 20 13 15 27-2-9-7-13-15-14z" fill="#c9960a"/>' +
      '<ellipse cx="33" cy="72" rx="23" ry="18" transform="rotate(-18 33 72)" fill="#ffd23f"/>' +
      '<ellipse cx="26" cy="64" rx="8" ry="4" transform="rotate(-18 26 64)" fill="rgba(255,255,255,.35)"/>' +
      '<circle cx="25" cy="70" r="4.2" fill="' + ink + '"/><circle cx="41" cy="65" r="4.2" fill="' + ink + '"/>' +
      '<circle cx="26.3" cy="68.6" r="1.4" fill="#fff"/><circle cx="42.3" cy="63.6" r="1.4" fill="#fff"/>' +
      '<path d="M27 74q6 6 12 0" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="18" cy="78" r="3.4" fill="#ff7a9a" opacity=".55"/><circle cx="47" cy="72" r="3.4" fill="#ff7a9a" opacity=".55"/></svg>';
  }

  // Scenery for chapter ci. avoid: extra [x0, y0, x1, y1] boxes to keep clear (e.g. the mascot).
  function render(ci, avoid) {
    const b = BIOMES[ci];
    const pts = [[b.inX, ci ? -10 : 150]].concat(b.stops);
    if (b.outX !== null) pts.push([b.outX, H + 10]);
    const cv = S.curve(pts);
    const boxes = b.stops.map(([x, y]) => [x - 50, y - 50, x + 50, y + 40]).concat(avoid || []);
    const sc = S.Scatter(100 + ci * 17, cv.samples, boxes);
    sc.samples = cv.samples;
    sc.density = 0.55;  // calm scenery so the coins read first
    sc.pad = 16;        // and a clear lane along the trail
    const scene = b.draw(sc);
    const svg = '<svg class="tr-bg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>' +
      '<filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>' +
      '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      scene + trailSvg(b, cv.d) + (sc.bridge || '') + sc.svg() + '</svg>';
    return svg + '<div class="tr-fx" aria-hidden="true">' + b.fx() + '</div>' +
      (b.seam ? '<div class="tr-seam" aria-hidden="true">' + seam(b.seam, ci) + '</div>' : '');
  }

  window.Trail = { W, H, BIOMES, render, mascot, shade, stops: (ci) => BIOMES[ci].stops };
})();
