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

  let state = null;
  let history = [];
  let historyIndex = -1;

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
    window.localStorage.setItem(THEME_KEY, theme);
    landingScreen.hidden = true;
    gameScreen.hidden = false;

    const saved = window.localStorage.getItem(SAVE_KEY);
    if (saved) {
      state = window.Game.GameState.fromJSON(JSON.parse(saved));
    } else {
      state = new window.Game.GameState();
      printLines(window.Rooms.ROOMS.deck.introLines);
    }
    renderSidebar();
    inputEl.focus();
  }

  document.getElementById('choose-mac').addEventListener('click', () => startGame('mac'));
  document.getElementById('choose-pc').addEventListener('click', () => startGame('pc'));
})();
