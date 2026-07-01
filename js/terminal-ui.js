'use strict';

(function () {
  const SAVE_KEY = 'yacht-mystery-save-v1';
  const THEME_KEY = 'yacht-mystery-theme-v1';

  const landingScreen = document.getElementById('landing-screen');
  const gameScreen = document.getElementById('game-screen');
  const outputEl = document.getElementById('terminal-output');
  const inputEl = document.getElementById('terminal-input');
  const sidebarTitle = document.getElementById('sidebar-room-title');
  const sidebarCwd = document.getElementById('sidebar-cwd');
  const sidebarHelp = document.getElementById('sidebar-help');
  const sidebarClues = document.getElementById('sidebar-clues');
  const audioToggle = document.getElementById('audio-toggle');

  let state = null;
  let history = [];
  let historyIndex = -1;
  let currentRoom = null;

  // Move the player's environment to whichever room they're currently standing in.
  // cwdPath[0] is the top-level room id; when at root (between rooms) we keep the
  // last scene so the backdrop doesn't flicker mid-transition.
  function applyScene() {
    const room = state && state.cwdPath && state.cwdPath.length ? state.cwdPath[0] : null;
    if (room && room !== currentRoom) {
      currentRoom = room;
      document.body.dataset.room = room;
    }
  }

  function printLines(lines) {
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = 'output-line';
      div.textContent = line;
      outputEl.appendChild(div);
    }
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function printCommandEcho(raw) {
    const div = document.createElement('div');
    div.className = 'output-line command-echo';
    div.textContent = '$ ' + raw;
    outputEl.appendChild(div);
  }

  function renderSidebar() {
    const info = state.getSidebarInfo();
    sidebarTitle.textContent = info.title;
    sidebarCwd.textContent = info.cwd;

    sidebarHelp.innerHTML = '';
    for (const line of info.helpLines) {
      const li = document.createElement('li');
      li.textContent = line;
      sidebarHelp.appendChild(li);
    }

    sidebarClues.innerHTML = '';
    for (const clue of info.cluesCollected) {
      const li = document.createElement('li');
      li.textContent = clue;
      sidebarClues.appendChild(li);
    }
  }

  function persist() {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state.toJSON()));
  }

  function handleSubmit() {
    const raw = inputEl.value;
    if (raw.trim().length === 0) {
      inputEl.value = '';
      return;
    }
    printCommandEcho(raw);
    history.push(raw);
    historyIndex = history.length;
    inputEl.value = '';

    const result = state.handleInput(raw);
    if (result.clearScreen) {
      outputEl.innerHTML = '';
    } else {
      printLines(result.outputLines);
    }
    applyScene();
    renderSidebar();
    persist();
  }

  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex > 0) {
        historyIndex -= 1;
        inputEl.value = history[historyIndex];
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        inputEl.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        inputEl.value = '';
      }
    }
  });

  function startGame(theme) {
    document.body.classList.add(theme === 'mac' ? 'theme-mac' : 'theme-pc');
    document.body.classList.add('in-game');
    window.localStorage.setItem(THEME_KEY, theme);
    landingScreen.hidden = true;
    gameScreen.hidden = false;
    if (audioToggle) audioToggle.hidden = false;

    const saved = window.localStorage.getItem(SAVE_KEY);
    state = null;
    if (saved) {
      try {
        state = window.Game.GameState.fromJSON(JSON.parse(saved));
      } catch (err) {
        // A corrupt or version-incompatible save shouldn't brick the game with a
        // blank screen — discard it and start a fresh voyage instead.
        window.localStorage.removeItem(SAVE_KEY);
        state = null;
      }
    }
    if (!state) {
      state = new window.Game.GameState();
      printLines(window.Rooms.ROOMS.deck.introLines);
    }
    applyScene();
    renderSidebar();
    inputEl.focus();

    // Ambient ocean + wind. Must be kicked off from this user gesture (the theme
    // click) so the browser permits audio playback.
    if (window.Ambience) window.Ambience.start();
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      if (!window.Ambience) return;
      const muted = window.Ambience.toggleMute();
      audioToggle.classList.toggle('muted', muted);
      audioToggle.setAttribute('aria-pressed', String(!muted));
      inputEl.focus();
    });
  }

  document.getElementById('choose-mac').addEventListener('click', () => startGame('mac'));
  document.getElementById('choose-pc').addEventListener('click', () => startGame('pc'));
})();
