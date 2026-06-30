# Design Spec: "S/V Segfault" — A Terminal-Learning Murder Mystery

## Purpose

A browser-based game that teaches college students and faculty with zero
programming exposure the fundamentals of navigating a terminal, wrapped in a
short Agatha-Christie-style comedic murder mystery set on a luxury yacht.

Target audience: complete beginners (no assumed familiarity with command
lines, file systems, or programming concepts). Tone: light, comedic,
campus-appropriate (PG, no graphic content) — closer to a game of Clue than
a thriller.

## Platform & Runtime

- **Browser-based, fully simulated terminal.** No real files are touched, no
  install required. Works identically on Mac and PC since it's a web page.
- Plain **HTML/CSS/JS, no build step, no framework**. Deploys directly to
  GitHub Pages from the repo with zero config.
- Single-page app. A small JS-simulated file system (a nested object tree)
  represents the yacht's rooms/files. A command parser interprets the 11
  taught commands and gives friendly, specific error messages for typos or
  wrong usage (this is a teaching tool — errors should explain, not just
  fail).
- Progress (current room reached, Mac/PC theme choice) persisted to
  `localStorage` so a page refresh doesn't lose the player's place.

## Mac vs. PC Choice

The landing screen asks the player to choose Mac or PC. This choice is
**cosmetic only** — both paths teach the identical Unix-style command set
listed below. The choice swaps a CSS theme:
- **Mac**: macOS Terminal.app-style window chrome (traffic-light buttons,
  rounded corners, SF-like monospace font, light/dark theme typical of
  Terminal.app).
- **PC**: Windows Terminal-style window chrome (square window controls,
  Cascadia-Code-like monospace font, dark blue/black theme typical of
  Windows Terminal).

No command-set or puzzle content differs between the two paths.

## Commands Taught (grouped by difficulty tier = one room each)

1. **Tier 1 — Orientation**: `pwd`, `ls`, `clear`
2. **Tier 2 — Navigation**: `cd [folder]`, `cd ..`
3. **Tier 3 — Reading**: `cat [file]`
4. **Tier 4 — Creation**: `mkdir [folder]`, `touch [file]`
5. **Tier 5 — Organizing**: `cp [source] [dest]`, `mv [source] [dest]`
6. **Tier 6 — Deletion**: `rm [file]`, `rm -r [folder]`

A room is unlocked only after the player has successfully used every
command in the current tier at least once toward that room's objective(s).

## Story

**Setting**: The *S/V Segfault*, a luxury yacht owned by eccentric tech
billionaire **Reggie Sterling**, mid-engagement-party at sea. The yacht's
old-school AI butler system, **ARIA**, only accepts terminal commands — the
in-world justification for why the player investigates via a command line.

**Inciting incident**: Reggie vanishes mid-party. His cabin is locked from
the inside, there are signs of a struggle, and he's nowhere on the ship. The
crew, being mostly tech-illiterate, deputizes the player (the one guest who
isn't intimidated by a computer) to use ARIA's terminal to investigate
before the yacht reaches port.

**Suspects / the love triangle**: **Margot** (Reggie's fiancée), **Chef
Antoine** (the yacht's celebrity chef), and **Captain Vasquez**. Diary
entries, logs, and messages discovered via `cat` reveal — not a simple
affair — but a three-way entanglement: Margot and Antoine have been
secretly involved for months, but so have Antoine and the Captain. Each
suspect has a plausible motive once the tangle is revealed.

**Twist ending**: Reggie isn't dead. He'd figured out the love triangle and,
rather than confront it directly, staged his own disappearance (with ARIA's
help) to force a confession out of the three of them — a billionaire's idea
of couples therapy. The ending is played for comedy, not menace: the
"culprit" the player exposes is revealed to just be the most embarrassed
person on the boat, and Reggie pops out of a closet to a mortified silence.

## Room-by-Room Structure

Each room maps to a yacht location, a command tier, and a narrative beat.

1. **Main Deck** (`pwd`, `ls`, `clear`) — Player wakes up disoriented after
   the party. Uses `pwd` to confirm where they are, `ls` to see what's on
   deck (a dropped earring, a torn napkin, an overturned chair), `clear` to
   "clear their head" / reset the screen. Learns Reggie is missing.
2. **Guest Hallway** (`cd`, `cd ..`) — Navigate between guest cabins
   (subfolders) to check alibis; back out to the hallway between each.
3. **Library** (`cat`) — Read diaries, the captain's log, and notes that
   surface the love triangle and each suspect's motive.
4. **Galley** (`mkdir`, `touch`) — Set up an evidence locker: `mkdir` an
   `evidence` folder, `touch` new case files to log each clue found so far.
5. **Vault** (`cp`, `mv`) — Copy/move incriminating documents out of
   suspects' private folders into the evidence locker before they can be
   hidden.
6. **Bridge** (`rm`, `rm -r`) — A suspect is frantically deleting evidence.
   The player must `cp` the real evidence to safety before the suspect's
   `rm -r` wipes the folder, then make the final accusation — triggering
   the twist ending.

## Win Condition

On the Bridge, after the player has copied the evidence to safety, running
`cat` on the recovered file triggers the accusation cutscene and the comedic
reveal (Reggie is alive; the "culprit" is just deeply embarrassed).

## UI Elements

- Central simulated terminal (input + scrolling output).
- Persistent sidebar: current room/objective, list of clues collected so
  far, and a "help" affordance listing the commands valid in the current
  room (since this is a teaching tool for total beginners).
- Friendly inline error messages for invalid commands or wrong syntax,
  explaining what went wrong rather than a bare error.

## Deployment

- Plain static site, no build artifacts to manage.
- Pushed to `dieyunsong/terminal` on `main`.
- Served via GitHub Pages from the repo root (`index.html` at the project
  root), the simplest GitHub Pages configuration.

## Out of Scope (for this version)

- No real file system access — everything is simulated in-browser.
- No backend, accounts, or multiplayer.
- No audio.
- No mobile-specific layout (desktop/laptop browser is the target, since
  typing commands is core to the experience).
