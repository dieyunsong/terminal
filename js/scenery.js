'use strict';

(function () {
  // Illustrated, animated SVG environments for each room of the yacht. Drawn in
  // vector code (no image assets, no dependencies). Motion is driven by CSS
  // classes defined in css/scenes.css (waves, flicker, sway, blink, steam...).
  // The active scene is chosen by body[data-room]; all six are injected once.

  function stars(count, w, h, maxY) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var x = Math.round(Math.random() * w);
      var y = Math.round(Math.random() * maxY);
      var r = (Math.random() * 1.6 + 0.6).toFixed(1);
      var d = (Math.random() * 4).toFixed(2);
      out += '<circle class="twinkle" cx="' + x + '" cy="' + y + '" r="' + r +
             '" fill="#fdf5e0" style="animation-delay:' + d + 's"/>';
    }
    return out;
  }

  // A wide wave band (two copies side by side) that scrolls horizontally.
  function waveBand(y, amp, fill, opacity, cls) {
    var d = 'M0 ' + y;
    for (var x = 0; x <= 3200; x += 160) {
      d += ' q 80 ' + (-amp) + ' 160 0';
    }
    d += ' V900 H0 Z';
    return '<path class="' + cls + '" d="' + d + '" fill="' + fill + '" opacity="' + opacity + '"/>';
  }

  var SVG_OPEN = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">';

  var SCENES = {

    // ---- Top Deck : dusk over open water, railing, string lights ----------
    deck:
      SVG_OPEN +
      '<defs><linearGradient id="deckSky" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#0b1a3f"/><stop offset="0.4" stop-color="#3a2a63"/>' +
        '<stop offset="0.62" stop-color="#9b4d6e"/><stop offset="0.74" stop-color="#e08a4c"/>' +
        '<stop offset="0.82" stop-color="#f2b56b"/><stop offset="1" stop-color="#0a1428"/></linearGradient>' +
        '<radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3d6"/>' +
        '<stop offset="0.5" stop-color="#ffcf87"/><stop offset="1" stop-color="#ffcf87" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#deckSky)"/>' +
      stars(70, 1600, 380) +
      '<circle cx="800" cy="560" r="120" fill="url(#sun)" class="glowPulse"/>' +
      '<circle cx="800" cy="560" r="60" fill="#fff0cf" opacity="0.9"/>' +
      // shimmering reflection + waves
      '<rect y="600" width="1600" height="300" fill="#12213f" opacity="0.5"/>' +
      waveBand(640, 16, '#20406e', 0.6, 'waveA') +
      waveBand(680, 22, '#16304f', 0.7, 'waveB') +
      waveBand(730, 26, '#0d2038', 0.85, 'waveA') +
      '<rect x="770" y="600" width="60" height="230" fill="#ffd79a" opacity="0.25" class="glowPulse"/>' +
      // deck railing (foreground)
      '<g stroke="#d9c9a3" stroke-width="7" opacity="0.9">' +
        '<line x1="0" y1="760" x2="1600" y2="760"/><line x1="0" y1="815" x2="1600" y2="815"/>' +
        '<line x1="120" y1="760" x2="120" y2="860"/><line x1="360" y1="760" x2="360" y2="860"/>' +
        '<line x1="600" y1="760" x2="600" y2="860"/><line x1="1000" y1="760" x2="1000" y2="860"/>' +
        '<line x1="1240" y1="760" x2="1240" y2="860"/><line x1="1480" y1="760" x2="1480" y2="860"/></g>' +
      // swaying string lights
      '<g class="sway" style="transform-origin:800px 40px">' +
        '<path d="M0 60 Q 400 160 800 90 T 1600 70" fill="none" stroke="#5a4a2a" stroke-width="3"/>' +
        '<circle cx="180" cy="118" r="9" fill="#ffdf8a" class="flick"/>' +
        '<circle cx="400" cy="132" r="9" fill="#ffe9a8" class="flick" style="animation-delay:.6s"/>' +
        '<circle cx="640" cy="112" r="9" fill="#ffdf8a" class="flick" style="animation-delay:1.1s"/>' +
        '<circle cx="900" cy="104" r="9" fill="#ffe9a8" class="flick" style="animation-delay:.3s"/>' +
        '<circle cx="1160" cy="96" r="9" fill="#ffdf8a" class="flick" style="animation-delay:.9s"/>' +
        '<circle cx="1420" cy="82" r="9" fill="#ffe9a8" class="flick" style="animation-delay:1.4s"/></g>' +
      '</svg>',

    // ---- Grand Hallway : ornate corridor, chandeliers, doors --------------
    hallway:
      SVG_OPEN +
      '<defs><radialGradient id="hallDepth" cx="0.5" cy="0.46" r="0.7">' +
        '<stop offset="0" stop-color="#5a4330"/><stop offset="0.4" stop-color="#33241a"/>' +
        '<stop offset="1" stop-color="#120b08"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#hallDepth)"/>' +
      // perspective floor + ceiling lines to a vanishing point (800,430)
      '<polygon points="0,900 1600,900 980,430 620,430" fill="#2a1c12"/>' +
      '<polygon points="0,900 620,430 640,430 40,900" fill="#7a5a34" opacity="0.5"/>' +
      '<polygon points="1600,900 980,430 960,430 1560,900" fill="#7a5a34" opacity="0.5"/>' +
      '<polygon points="0,0 1600,0 980,430 620,430" fill="#1a110b"/>' +
      // runner rug
      '<polygon points="700,900 900,900 852,430 748,430" fill="#7a2230" opacity="0.85"/>' +
      '<polygon points="726,900 874,900 840,470 760,470" fill="#a8323f" opacity="0.6"/>' +
      // doors along walls
      '<g fill="#3c2a1a" stroke="#caa25a" stroke-width="3">' +
        '<rect x="150" y="470" width="90" height="220"/><rect x="300" y="500" width="70" height="170"/>' +
        '<rect x="1360" y="470" width="90" height="220"/><rect x="1230" y="500" width="70" height="170"/></g>' +
      // wall sconces
      '<circle cx="270" cy="440" r="30" fill="#ffb761" class="flick" opacity="0.8"/>' +
      '<circle cx="1330" cy="440" r="30" fill="#ffb761" class="flick" opacity="0.8" style="animation-delay:.7s"/>' +
      // chandeliers, swinging
      chandelier(560, 60) + chandelier(800, 30) + chandelier(1040, 60) +
      '</svg>',

    // ---- The Study : bookshelves, desk, banker's lamp, globe --------------
    library:
      SVG_OPEN +
      '<defs><radialGradient id="studyGlow" cx="0.6" cy="0.6" r="0.6">' +
        '<stop offset="0" stop-color="#3a4a3a"/><stop offset="0.5" stop-color="#1c2a22"/>' +
        '<stop offset="1" stop-color="#0a120f"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#studyGlow)"/>' +
      // bookshelves left & right
      shelf(60) + shelf(210) + shelf(1240) + shelf(1390) +
      // tall window with rain streaks, moon outside
      '<rect x="640" y="120" width="320" height="420" rx="8" fill="#0c1830" stroke="#5a4a34" stroke-width="10"/>' +
      '<circle cx="860" cy="220" r="46" fill="#eaf0ff" opacity="0.85"/>' +
      '<line x1="800" y1="120" x2="800" y2="540" stroke="#5a4a34" stroke-width="6"/>' +
      '<line x1="640" y1="330" x2="960" y2="330" stroke="#5a4a34" stroke-width="6"/>' +
      '<g stroke="#9fb8e0" stroke-width="2" opacity="0.5">' +
        '<line class="rain" x1="700" y1="140" x2="690" y2="200"/>' +
        '<line class="rain" x1="760" y1="160" x2="750" y2="220" style="animation-delay:.5s"/>' +
        '<line class="rain" x1="880" y1="150" x2="870" y2="210" style="animation-delay:.9s"/>' +
        '<line class="rain" x1="920" y1="180" x2="910" y2="240" style="animation-delay:.3s"/></g>' +
      // desk + banker's lamp glow
      '<rect x="600" y="620" width="400" height="40" rx="6" fill="#3a2416"/>' +
      '<rect x="640" y="660" width="30" height="150" fill="#2a1a10"/><rect x="930" y="660" width="30" height="150" fill="#2a1a10"/>' +
      '<ellipse cx="800" cy="600" rx="180" ry="70" fill="#ffd98a" opacity="0.28" class="glowPulse"/>' +
      '<rect x="770" y="560" width="60" height="18" rx="9" fill="#1f6f4a"/>' +
      '<rect x="796" y="560" width="8" height="60" fill="#caa25a"/>' +
      // globe
      '<circle cx="1090" cy="600" r="40" fill="#2b6d8c" stroke="#caa25a" stroke-width="3"/>' +
      '<path d="M1060 590 q30 -20 60 6 M1058 610 q34 22 64 -4" stroke="#8fd0c0" stroke-width="2" fill="none"/>' +
      // dust motes
      '<g fill="#ffe9b8">' +
        '<circle class="floaty" cx="780" cy="560" r="3"/><circle class="floaty" cx="820" cy="600" r="2.5" style="animation-delay:2s"/>' +
        '<circle class="floaty" cx="740" cy="620" r="2" style="animation-delay:4s"/><circle class="floaty" cx="860" cy="580" r="2.5" style="animation-delay:6s"/></g>' +
      '</svg>',

    // ---- The Galley : steel kitchen, hanging pots, stove flame & steam ----
    galley:
      SVG_OPEN +
      '<defs><linearGradient id="galleyBg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#243642"/><stop offset="0.55" stop-color="#2c4150"/>' +
        '<stop offset="1" stop-color="#0f171d"/></linearGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#galleyBg)"/>' +
      // tiled back wall
      tiles() +
      // counter
      '<rect x="0" y="640" width="1600" height="60" fill="#c9d2d8"/>' +
      '<rect x="0" y="700" width="1600" height="200" fill="#2a3a44"/>' +
      // pendant lights
      pendant(360) + pendant(760) + pendant(1160) +
      // hanging pots
      '<g stroke="#9aa6ad" stroke-width="3" fill="#8a949b">' +
        '<line x1="560" y1="180" x2="560" y2="240" stroke="#6a747a"/><ellipse cx="560" cy="270" rx="34" ry="30"/>' +
        '<line x1="640" y1="180" x2="640" y2="220" stroke="#6a747a"/><ellipse cx="640" cy="250" rx="28" ry="26"/>' +
        '<line x1="1010" y1="180" x2="1010" y2="240" stroke="#6a747a"/><ellipse cx="1010" cy="272" rx="30" ry="28"/></g>' +
      // stove pot with flame + steam
      '<rect x="740" y="600" width="120" height="46" rx="8" fill="#3a4650"/>' +
      '<ellipse cx="800" cy="600" rx="64" ry="18" fill="#1a2228"/>' +
      '<g class="flick"><path d="M780 600 q -12 -34 12 -54 q -6 30 18 34 q 20 -12 8 -40 q 30 26 10 60 Z" fill="#ff9a3c" opacity="0.9"/></g>' +
      '<g fill="#dfeaf0" opacity="0.5">' +
        '<ellipse class="steam" cx="800" cy="560" rx="30" ry="46"/>' +
        '<ellipse class="steam" cx="770" cy="540" rx="22" ry="40" style="animation-delay:2s"/>' +
        '<ellipse class="steam" cx="830" cy="548" rx="24" ry="42" style="animation-delay:4s"/></g>' +
      '</svg>',

    // ---- The Vault : safe door, spotlight, gold bars, lasers --------------
    vault:
      SVG_OPEN +
      '<defs><radialGradient id="vaultLight" cx="0.5" cy="0.28" r="0.6">' +
        '<stop offset="0" stop-color="#3a4150"/><stop offset="0.5" stop-color="#171b24"/>' +
        '<stop offset="1" stop-color="#05070b"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#vaultLight)"/>' +
      // spotlight cone
      '<polygon points="800,0 640,900 960,900" fill="#8fb4d8" opacity="0.06" class="glowPulse"/>' +
      // steel wall panels
      '<g fill="none" stroke="#2c3542" stroke-width="3">' +
        '<rect x="120" y="120" width="1360" height="700"/><line x1="120" y1="350" x2="1480" y2="350"/>' +
        '<line x1="120" y1="580" x2="1480" y2="580"/><line x1="580" y1="120" x2="580" y2="820"/><line x1="1020" y1="120" x2="1020" y2="820"/></g>' +
      // circular vault door
      '<circle cx="800" cy="460" r="200" fill="#2f3946" stroke="#4a5666" stroke-width="14"/>' +
      '<circle cx="800" cy="460" r="150" fill="none" stroke="#3a4552" stroke-width="6"/>' +
      '<g class="spinSlow" style="transform-origin:800px 460px">' +
        '<circle cx="800" cy="460" r="60" fill="#3a4552" stroke="#caa25a" stroke-width="6"/>' +
        '<g stroke="#caa25a" stroke-width="10" stroke-linecap="round">' +
          '<line x1="800" y1="410" x2="800" y2="360"/><line x1="800" y1="510" x2="800" y2="560"/>' +
          '<line x1="750" y1="460" x2="700" y2="460"/><line x1="850" y1="460" x2="900" y2="460"/></g></g>' +
      // gold bars stacked, shimmering
      '<g>' +
        goldBar(520, 720) + goldBar(576, 720) + goldBar(548, 686) +
        goldBar(1000, 720) + goldBar(1056, 720) + goldBar(1028, 686) + '</g>' +
      // security lasers
      '<g stroke="#ff4d6d" stroke-width="2" opacity="0.55">' +
        '<line class="laser" x1="120" y1="250" x2="1480" y2="250"/>' +
        '<line class="laser" x1="120" y1="700" x2="1480" y2="700" style="animation-delay:1.2s"/></g>' +
      '</svg>',

    // ---- The Bridge : control panels, wheel, night ocean, radar -----------
    bridge:
      SVG_OPEN +
      '<defs><linearGradient id="bridgeSky" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#040a16"/><stop offset="0.5" stop-color="#0a1b30"/>' +
        '<stop offset="1" stop-color="#02060e"/></linearGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#bridgeSky)"/>' +
      // windscreen showing night ocean + moon
      '<rect x="120" y="80" width="1360" height="420" rx="10" fill="#061428"/>' +
      stars(40, 1600, 300) +
      '<circle cx="1180" cy="200" r="52" fill="#eef4ff" opacity="0.9"/>' +
      '<circle cx="1180" cy="200" r="90" fill="#eef4ff" opacity="0.12" class="glowPulse"/>' +
      waveBand(360, 14, '#123457', 0.7, 'waveA') +
      waveBand(410, 18, '#0a2340', 0.85, 'waveB') +
      '<line x1="120" y1="80" x2="120" y2="500" stroke="#22303f" stroke-width="8"/>' +
      '<line x1="800" y1="80" x2="800" y2="500" stroke="#22303f" stroke-width="8"/>' +
      '<line x1="1480" y1="80" x2="1480" y2="500" stroke="#22303f" stroke-width="8"/>' +
      // console dash
      '<rect x="0" y="560" width="1600" height="340" fill="#0c1620"/>' +
      '<rect x="0" y="540" width="1600" height="30" fill="#16242f"/>' +
      // radar screen
      '<circle cx="300" cy="700" r="90" fill="#03130d" stroke="#1f5a3f" stroke-width="4"/>' +
      '<circle cx="300" cy="700" r="60" fill="none" stroke="#1f5a3f" stroke-width="2"/>' +
      '<g class="spin" style="transform-origin:300px 700px"><path d="M300 700 L300 610 A90 90 0 0 1 388 700 Z" fill="#37c98a" opacity="0.35"/></g>' +
      // blinking control lights
      '<g>' + panelLights() + '</g>' +
      // ship wheel
      '<g class="spinSlow" style="transform-origin:800px 720px">' +
        '<circle cx="800" cy="720" r="90" fill="none" stroke="#8a5a2a" stroke-width="14"/>' +
        '<circle cx="800" cy="720" r="26" fill="#8a5a2a"/>' +
        '<g stroke="#a06a34" stroke-width="10" stroke-linecap="round">' +
          '<line x1="800" y1="720" x2="800" y2="600"/><line x1="800" y1="720" x2="800" y2="840"/>' +
          '<line x1="800" y1="720" x2="680" y2="720"/><line x1="800" y1="720" x2="920" y2="720"/>' +
          '<line x1="800" y1="720" x2="715" y2="635"/><line x1="800" y1="720" x2="885" y2="805"/>' +
          '<line x1="800" y1="720" x2="885" y2="635"/><line x1="800" y1="720" x2="715" y2="805"/></g></g>' +
      '</svg>'
  };

  function chandelier(x, delay) {
    return '<g class="swing" style="transform-origin:' + x + 'px 0px;animation-delay:' + (delay / 60) + 's">' +
      '<line x1="' + x + '" y1="0" x2="' + x + '" y2="120" stroke="#caa25a" stroke-width="3"/>' +
      '<ellipse cx="' + x + '" cy="150" rx="46" ry="22" fill="#caa25a" opacity="0.5"/>' +
      '<circle cx="' + (x - 30) + '" cy="150" r="7" fill="#ffe9a8" class="flick"/>' +
      '<circle cx="' + x + '" cy="160" r="7" fill="#ffe9a8" class="flick" style="animation-delay:.4s"/>' +
      '<circle cx="' + (x + 30) + '" cy="150" r="7" fill="#ffe9a8" class="flick" style="animation-delay:.8s"/>' +
      '<circle cx="' + x + '" cy="150" r="70" fill="#ffdf9a" opacity="0.14" class="glowPulse"/></g>';
  }

  function shelf(x) {
    var books = '';
    var colors = ['#7a2f2f', '#2f4a7a', '#2f7a52', '#7a682f', '#5a2f7a', '#7a4a2f'];
    for (var row = 0; row < 5; row++) {
      var bx = x;
      while (bx < x + 120) {
        var w = 10 + Math.round(Math.random() * 12);
        var h = 60 + Math.round(Math.random() * 18);
        books += '<rect x="' + bx + '" y="' + (170 + row * 110 - h) + '" width="' + w + '" height="' + h +
                 '" fill="' + colors[Math.floor(Math.random() * colors.length)] + '"/>';
        bx += w + 3;
      }
    }
    return '<rect x="' + (x - 12) + '" y="120" width="150" height="620" fill="#2a1a10"/>' +
      '<g>' + books + '</g>' +
      '<g stroke="#3a2416" stroke-width="6">' +
        '<line x1="' + (x - 12) + '" y1="170" x2="' + (x + 138) + '" y2="170"/>' +
        '<line x1="' + (x - 12) + '" y1="280" x2="' + (x + 138) + '" y2="280"/>' +
        '<line x1="' + (x - 12) + '" y1="390" x2="' + (x + 138) + '" y2="390"/>' +
        '<line x1="' + (x - 12) + '" y1="500" x2="' + (x + 138) + '" y2="500"/></g>';
  }

  function tiles() {
    var out = '<g stroke="#39515f" stroke-width="1.5" opacity="0.6">';
    for (var y = 120; y < 640; y += 60) out += '<line x1="0" y1="' + y + '" x2="1600" y2="' + y + '"/>';
    for (var x = 0; x < 1600; x += 60) out += '<line x1="' + x + '" y1="120" x2="' + x + '" y2="640"/>';
    return out + '</g>';
  }

  function pendant(x) {
    return '<g><line x1="' + x + '" y1="80" x2="' + x + '" y2="200" stroke="#5a6a72" stroke-width="3"/>' +
      '<path d="M' + (x - 34) + ' 240 Q' + x + ' 180 ' + (x + 34) + ' 240 Z" fill="#c9d2d8"/>' +
      '<circle cx="' + x + '" cy="238" r="8" fill="#fff2c8" class="flick"/>' +
      '<polygon points="' + (x - 34) + ',240 ' + (x + 34) + ',240 ' + (x + 120) + ',640 ' + (x - 120) + ',640" fill="#fff2c8" opacity="0.10" class="glowPulse"/></g>';
  }

  function goldBar(x, y) {
    return '<g class="shimmer"><polygon points="' + x + ',' + y + ' ' + (x + 48) + ',' + y + ' ' + (x + 44) + ',' + (y + 22) + ' ' + (x + 4) + ',' + (y + 22) + '" fill="#e8c25a"/>' +
      '<polygon points="' + (x + 4) + ',' + (y + 22) + ' ' + (x + 44) + ',' + (y + 22) + ' ' + (x + 44) + ',' + (y + 30) + ' ' + (x + 4) + ',' + (y + 30) + '" fill="#b9932f"/></g>';
  }

  function panelLights() {
    var out = '';
    var cols = ['#37c98a', '#ff6b6b', '#ffd23f', '#4db8ff'];
    for (var i = 0; i < 22; i++) {
      var x = 620 + (i % 11) * 60;
      var y = 620 + Math.floor(i / 11) * 46;
      out += '<circle class="blink" cx="' + x + '" cy="' + y + '" r="7" fill="' + cols[i % 4] +
             '" style="animation-delay:' + (Math.random() * 2).toFixed(2) + 's"/>';
    }
    return out;
  }

  function init() {
    var scene = document.getElementById('scene');
    if (!scene) return;
    var ids = ['deck', 'hallway', 'library', 'galley', 'vault', 'bridge'];
    var html = '';
    for (var i = 0; i < ids.length; i++) {
      html += '<div class="scene-room scene-' + ids[i] + '">' + SCENES[ids[i]] + '</div>';
    }
    scene.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Scenery = { init: init };
})();
