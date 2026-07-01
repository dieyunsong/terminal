# S/V Segfault — A Terminal Murder Mystery

A browser-based game that teaches complete beginners (college students and
faculty with zero programming background) the fundamentals of navigating a
terminal, wrapped in a short, comedic Agatha-Christie-style murder mystery
on a luxury yacht.

Play it by opening `index.html` in a browser (or see "Run locally" below).
No installation needed for players — it's a static site with no backend.

## How to play

Choose Mac or PC on the landing screen (this only changes the look of the
terminal window — both paths teach the exact same commands). Then explore
the yacht room by room, typing real terminal commands into ARIA, the
yacht's onboard assistant, to investigate the disappearance of yacht owner
Reggie Sterling. Each room teaches a small batch of commands; once you've
used them all, the next room unlocks.

| Room | Commands taught |
| --- | --- |
| Main Deck | `pwd`, `ls`, `clear` |
| Guest Hallway | `cd [folder]`, `cd ..` |
| Library | `cat [file]` |
| Galley | `mkdir [folder]`, `touch [file]` |
| Vault | `cp [source] [dest]`, `mv [source] [dest]` |
| Bridge | `rm [file]`, `rm -r [folder]` |

## Run locally

No build step and no dependencies. From the project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Run the tests

The game logic (virtual filesystem, command parser, room/story content,
and game-state orchestration) is unit tested with Node's built-in test
runner — no `npm install` required:

```bash
npm test
```

## Project structure

- `js/filesystem.js` — a small simulated virtual file system (pure logic, no DOM).
- `js/commands.js` — parses typed input into filesystem operations and friendly output.
- `js/rooms.js` — all story/room content: narration, files, and per-room unlock conditions.
- `js/game.js` — `GameState`: ties the above together, gates room progression, tracks the win condition.
- `js/terminal-ui.js` — DOM glue: renders the terminal, sidebar, and persists progress to `localStorage`.
- `css/` — layout plus the cosmetic Mac/PC terminal themes.
- `tests/` — one test file per `js/` module.

## Deployment

This is a static site with no build step, deployed via GitHub Pages from
the repository root.
