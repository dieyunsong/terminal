'use strict';

(function () {
  // Cartoon SVG avatars for the cast, each with an idle blink + gentle bob.
  // ARIA sits in the terminal titlebar; the three suspects fill the sidebar's
  // "Aboard the yacht" panel; Reggie is revealed when the case is solved.
  // Pure vector, no assets.

  function face(id, ring, bg, inner) {
    // A round framed portrait with two blinking eyes baked into `inner`.
    return '<svg viewBox="0 0 100 100" class="avatar avatar-' + id + '" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="48" fill="' + ring + '"/>' +
      '<circle cx="50" cy="50" r="43" fill="' + bg + '"/>' +
      '<clipPath id="clip-' + id + '"><circle cx="50" cy="50" r="43"/></clipPath>' +
      '<g clip-path="url(#clip-' + id + ')">' + inner + '</g></svg>';
  }

  // An eye with an eyelid that periodically blinks (CSS scales the lid down).
  function eyes(cx1, cx2, cy, r) {
    function eye(cx) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#22201d"/>' +
        '<circle cx="' + (cx + r * 0.3) + '" cy="' + (cy - r * 0.3) + '" r="' + (r * 0.35) + '" fill="#fff"/>' +
        '<rect class="lid" x="' + (cx - r - 1) + '" y="' + (cy - r - 1) + '" width="' + (2 * r + 2) + '" height="' + (2 * r + 2) + '"/>';
    }
    return eye(cx1) + eye(cx2);
  }

  var AVATARS = {
    aria: function () {
      return '<svg viewBox="0 0 100 100" class="avatar avatar-aria" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="50" cy="50" r="46" fill="none" stroke="#7fd6ff" stroke-width="2" class="ring-pulse"/>' +
        '<circle cx="50" cy="50" r="34" fill="#0e2a3a"/>' +
        '<circle cx="50" cy="50" r="34" fill="url(#ariaGlow)" opacity="0.6"/>' +
        '<defs><radialGradient id="ariaGlow" cx="0.5" cy="0.4" r="0.6">' +
          '<stop offset="0" stop-color="#9fe8ff"/><stop offset="1" stop-color="#0e2a3a" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="40" cy="46" r="5" fill="#bff0ff" class="ariaEye"/>' +
        '<circle cx="60" cy="46" r="5" fill="#bff0ff" class="ariaEye"/>' +
        '<path d="M40 62 Q50 70 60 62" fill="none" stroke="#bff0ff" stroke-width="3" stroke-linecap="round"/></svg>';
    },
    margot: function () {
      var inner =
        '<rect x="0" y="0" width="100" height="100" fill="#f0c9a8"/>' +
        // auburn bob
        '<path d="M8 52 Q10 8 50 6 Q90 8 92 52 Q92 30 74 22 Q60 40 40 22 Q26 30 8 52 Z" fill="#7a3b28"/>' +
        '<path d="M8 52 Q6 84 20 96 L20 54 Q14 50 8 52 Z" fill="#7a3b28"/>' +
        '<path d="M92 52 Q94 84 80 96 L80 54 Q86 50 92 52 Z" fill="#7a3b28"/>' +
        eyes(38, 62, 50, 5) +
        '<path d="M32 42 Q38 38 44 42" fill="none" stroke="#5a2b1c" stroke-width="2"/>' +
        '<path d="M56 42 Q62 38 68 42" fill="none" stroke="#5a2b1c" stroke-width="2"/>' +
        '<path d="M42 68 Q50 74 58 68 Q50 72 42 68 Z" fill="#c0392b"/>' +
        '<circle cx="24" cy="66" r="4" fill="#f4f0e6"/>'; // pearl earring
      return face('margot', '#caa25a', '#f0c9a8', inner);
    },
    antoine: function () {
      var inner =
        '<rect x="0" y="0" width="100" height="100" fill="#e9b98f"/>' +
        // chef toque
        '<rect x="26" y="18" width="48" height="20" rx="6" fill="#fbfbf7"/>' +
        '<circle cx="34" cy="16" r="12" fill="#fbfbf7"/><circle cx="50" cy="12" r="14" fill="#fbfbf7"/><circle cx="66" cy="16" r="12" fill="#fbfbf7"/>' +
        eyes(38, 62, 48, 5) +
        '<path d="M34 40 Q40 37 46 40" fill="none" stroke="#3a2416" stroke-width="2"/>' +
        '<path d="M54 40 Q60 37 66 40" fill="none" stroke="#3a2416" stroke-width="2"/>' +
        // mustache
        '<path d="M36 64 Q50 58 64 64 Q50 70 36 64 Z" fill="#3a2416"/>' +
        '<circle cx="30" cy="60" r="4" fill="#e08a6a" opacity="0.6"/><circle cx="70" cy="60" r="4" fill="#e08a6a" opacity="0.6"/>' +
        '<path d="M44 76 Q50 80 56 76" fill="none" stroke="#8a4a34" stroke-width="2"/>';
      return face('antoine', '#caa25a', '#e9b98f', inner);
    },
    vasquez: function () {
      var inner =
        '<rect x="0" y="0" width="100" height="100" fill="#c98f6a"/>' +
        // captain hat
        '<rect x="22" y="26" width="56" height="10" rx="3" fill="#0e1c3a"/>' +
        '<path d="M24 26 Q50 6 76 26 Z" fill="#12244a"/>' +
        '<rect x="42" y="18" width="16" height="10" fill="#caa25a"/>' +
        '<circle cx="50" cy="22" r="3" fill="#ffe9a8"/>' +
        eyes(38, 62, 50, 5) +
        '<path d="M32 42 Q40 39 46 43" fill="none" stroke="#2a1a10" stroke-width="3"/>' +
        '<path d="M54 43 Q60 39 68 42" fill="none" stroke="#2a1a10" stroke-width="3"/>' +
        // beard
        '<path d="M30 60 Q50 96 70 60 Q66 74 50 76 Q34 74 30 60 Z" fill="#4a3524"/>' +
        '<path d="M42 66 Q50 70 58 66" fill="none" stroke="#2a1a10" stroke-width="2"/>';
      return face('vasquez', '#caa25a', '#c98f6a', inner);
    },
    reggie: function () {
      var inner =
        '<rect x="0" y="0" width="100" height="100" fill="#eab98f"/>' +
        '<path d="M20 40 Q50 14 80 40 Q70 26 50 24 Q30 26 20 40 Z" fill="#d9d2c8"/>' + // silver hair sides
        eyes(38, 62, 46, 5) +
        '<path d="M32 38 Q40 34 46 38" fill="none" stroke="#8a7a5a" stroke-width="2"/>' +
        '<path d="M54 38 Q60 34 68 38" fill="none" stroke="#8a7a5a" stroke-width="2"/>' +
        // huge grin
        '<path d="M34 60 Q50 82 66 60 Q50 68 34 60 Z" fill="#fff"/>' +
        '<path d="M34 60 Q50 66 66 60" fill="none" stroke="#8a4a34" stroke-width="2"/>' +
        // kazoo
        '<rect x="60" y="70" width="22" height="8" rx="3" fill="#e8c25a" transform="rotate(12 60 74)"/>';
      return face('reggie', '#e8c25a', '#eab98f', inner);
    }
  };

  function card(id, name, role) {
    return '<div class="cast-member cast-' + id + '">' +
      '<div class="cast-portrait">' + AVATARS[id]() + '</div>' +
      '<div class="cast-meta"><span class="cast-name">' + name + '</span>' +
      '<span class="cast-role">' + role + '</span></div></div>';
  }

  function init() {
    var ariaSlot = document.getElementById('aria-avatar');
    if (ariaSlot) ariaSlot.innerHTML = AVATARS.aria();

    var cast = document.getElementById('cast');
    if (cast) {
      cast.innerHTML =
        card('margot', 'Margot', 'The fiancée') +
        card('antoine', 'Antoine', 'The chef') +
        card('vasquez', 'Vasquez', 'The captain') +
        card('reggie', 'Reggie', 'The host');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Avatars = { init: init };
})();
