# S/V Segfault Terminal Mystery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based, no-build-step terminal-command teaching game ("S/V Segfault") that walks a complete beginner through `pwd`, `ls`, `cd`, `cd ..`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `rm -r`, and `clear` via a 6-room Agatha-Christie-style comedic murder mystery on a luxury yacht.

**Architecture:** Pure-logic modules (`filesystem.js`, `commands.js`, `rooms.js`, `game.js`) hold a simulated virtual file system, a command parser, story/room content, and game-state orchestration respectively, with zero DOM dependency so they're unit-testable directly under Node. A thin `terminal-ui.js` wires that logic to the DOM (input box, scrollback, sidebar, localStorage). `index.html` + 3 CSS files provide markup and the cosmetic Mac/PC terminal skin.

**Tech Stack:** Vanilla HTML/CSS/JS, no framework, no bundler, no npm dependencies. Tests use Node's built-in `node:test` + `node:assert/strict` (Node v20+, already installed) — runnable with zero `npm install`. Deployed as a static site via GitHub Pages from the repo root.

## Global Constraints

- No build step: plain HTML/CSS/JS only, deployable by serving the repo root as-is.
- No external dependencies of any kind (no npm packages, including devDependencies).
- The taught command set is exactly: `pwd`, `ls`, `cd [folder]`, `cd ..`, `mkdir [folder]`, `touch [file]`, `cp [source] [dest]`, `mv [source] [dest]`, `rm [file]`, `rm -r [folder]`, `cat [file]`, `clear` — identical on both the Mac and PC paths.
- The Mac/PC landing-screen choice is cosmetic only (CSS theme), never changes game logic or commands.
- Tone is PG and comedic (Clue-style), no graphic content — this is for a college class/workshop audience including faculty.
- Target repo: `https://github.com/dieyunsong/terminal.git`, branch `main`, GitHub Pages served from the repo root (`index.html` at top level).
- The design spec lives at `docs/superpowers/specs/2026-06-30-yacht-terminal-mystery-design.md` — every requirement in it must map to a task below.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `js/` (empty dir, populated in later tasks)
- Create: `css/` (empty dir, populated in later tasks)
- Create: `tests/` (empty dir, populated in later tasks)

**Interfaces:**
- Produces: an `npm test` script that later tasks' test files plug into.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "sv-segfault-terminal-mystery",
  "version": "1.0.0",
  "private": true,
  "description": "A browser-based terminal-command murder mystery game for complete beginners.",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
```

- [ ] **Step 3: Create the empty working directories**

Run: `mkdir -p js css tests`

- [ ] **Step 4: Verify `npm test` runs cleanly with zero tests**

Run: `npm test`
Expected: Node's test runner reports `# tests 0` (or similar zero-test summary) and exits 0 — confirms the script wiring works before any real tests exist.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore
git commit -m "Scaffold project: package.json, gitignore, working dirs"
```

---

## Task 2: Filesystem engine (`js/filesystem.js`)

**Files:**
- Create: `js/filesystem.js`
- Test: `tests/filesystem.test.js`

**Interfaces:**
- Produces (consumed by `js/commands.js`, `js/rooms.js`, `js/game.js`, and their tests):
  - A filesystem node is `{ type: 'dir', name: string, children: { [name]: node } }` or `{ type: 'file', name: string, content: string }`.
  - A "cwd path" is an array of folder-name strings from the root, e.g. `[]` is root, `['hallway','margot-cabin']` is two levels deep.
  - `resolvePath(cwdPath, inputPath) -> string[]` — turns an absolute (`/a/b`) or relative (`a/b`, `..`) path string into a segments array, without touching the filesystem.
  - `getNode(fs, segments) -> node | null`
  - `getParent(fs, segments) -> dirNode | null`
  - `pwd(cwdPath) -> string` (e.g. `"/hallway/margot-cabin"`, `"/"` for root)
  - `ls(fs, cwdPath) -> { success: boolean, entries?: string[], error?: string }` (dir entries suffixed with `/`, alphabetically sorted)
  - `cd(fs, cwdPath, target) -> { success: boolean, newCwdPath?: string[], error?: string }`
  - `mkdir(fs, cwdPath, name) -> { success: boolean, error?: string }`
  - `touch(fs, cwdPath, name) -> { success: boolean, error?: string }`
  - `cp(fs, cwdPath, source, destination) -> { success: boolean, error?: string }` (supports copying files or whole directories)
  - `mv(fs, cwdPath, source, destination) -> { success: boolean, error?: string }`
  - `rm(fs, cwdPath, name, recursive) -> { success: boolean, error?: string }` (errors on a directory unless `recursive` is true)
  - `cat(fs, cwdPath, name) -> { success: boolean, content?: string, error?: string }`

- [ ] **Step 1: Write the failing tests**

Create `tests/filesystem.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const FS = require('../js/filesystem.js');

function sampleFs() {
  return {
    type: 'dir', name: '/', children: {
      foo: {
        type: 'dir', name: 'foo', children: {
          'a.txt': { type: 'file', name: 'a.txt', content: 'hello' }
        }
      },
      'b.txt': { type: 'file', name: 'b.txt', content: 'world' }
    }
  };
}

test('pwd shows root', () => {
  assert.equal(FS.pwd([]), '/');
});

test('pwd shows nested path', () => {
  assert.equal(FS.pwd(['foo', 'bar']), '/foo/bar');
});

test('ls lists entries with trailing slash for dirs, sorted', () => {
  const fs = sampleFs();
  const result = FS.ls(fs, []);
  assert.equal(result.success, true);
  assert.deepEqual(result.entries, ['b.txt', 'foo/']);
});

test('cd into existing folder succeeds', () => {
  const fs = sampleFs();
  const result = FS.cd(fs, [], 'foo');
  assert.equal(result.success, true);
  assert.deepEqual(result.newCwdPath, ['foo']);
});

test('cd into missing folder fails', () => {
  const fs = sampleFs();
  const result = FS.cd(fs, [], 'nope');
  assert.equal(result.success, false);
});

test('cd .. moves up one level', () => {
  const fs = sampleFs();
  const result = FS.cd(fs, ['foo'], '..');
  assert.equal(result.success, true);
  assert.deepEqual(result.newCwdPath, []);
});

test('cd into a file fails', () => {
  const fs = sampleFs();
  const result = FS.cd(fs, [], 'b.txt');
  assert.equal(result.success, false);
});

test('mkdir creates a new folder', () => {
  const fs = sampleFs();
  const result = FS.mkdir(fs, [], 'newdir');
  assert.equal(result.success, true);
  assert.equal(fs.children.newdir.type, 'dir');
});

test('mkdir fails if name already exists', () => {
  const fs = sampleFs();
  const result = FS.mkdir(fs, [], 'foo');
  assert.equal(result.success, false);
});

test('touch creates an empty file', () => {
  const fs = sampleFs();
  const result = FS.touch(fs, [], 'new.txt');
  assert.equal(result.success, true);
  assert.equal(fs.children['new.txt'].content, '');
});

test('touch on an existing file is a no-op success', () => {
  const fs = sampleFs();
  const result = FS.touch(fs, [], 'b.txt');
  assert.equal(result.success, true);
  assert.equal(fs.children['b.txt'].content, 'world');
});

test('cp copies a file into a destination folder', () => {
  const fs = sampleFs();
  const result = FS.cp(fs, [], 'b.txt', 'foo');
  assert.equal(result.success, true);
  assert.equal(fs.children.foo.children['b.txt'].content, 'world');
  assert.equal(fs.children['b.txt'].content, 'world');
});

test('cp fails if source does not exist', () => {
  const fs = sampleFs();
  const result = FS.cp(fs, [], 'missing.txt', 'foo');
  assert.equal(result.success, false);
});

test('cp can copy an entire folder', () => {
  const fs = sampleFs();
  FS.mkdir(fs, [], 'dest');
  const result = FS.cp(fs, [], 'foo', 'dest');
  assert.equal(result.success, true);
  assert.equal(fs.children.dest.children.foo.children['a.txt'].content, 'hello');
  assert.equal(fs.children.foo.children['a.txt'].content, 'hello');
});

test('mv moves a file into a destination folder and removes the original', () => {
  const fs = sampleFs();
  const result = FS.mv(fs, [], 'b.txt', 'foo');
  assert.equal(result.success, true);
  assert.equal(fs.children.foo.children['b.txt'].content, 'world');
  assert.equal(fs.children['b.txt'], undefined);
});

test('rm deletes a file', () => {
  const fs = sampleFs();
  const result = FS.rm(fs, [], 'b.txt', false);
  assert.equal(result.success, true);
  assert.equal(fs.children['b.txt'], undefined);
});

test('rm without -r fails on a folder', () => {
  const fs = sampleFs();
  const result = FS.rm(fs, [], 'foo', false);
  assert.equal(result.success, false);
});

test('rm -r deletes a folder and its contents', () => {
  const fs = sampleFs();
  const result = FS.rm(fs, [], 'foo', true);
  assert.equal(result.success, true);
  assert.equal(fs.children.foo, undefined);
});

test('cat returns file content', () => {
  const fs = sampleFs();
  const result = FS.cat(fs, [], 'b.txt');
  assert.equal(result.success, true);
  assert.equal(result.content, 'world');
});

test('cat fails on a folder', () => {
  const fs = sampleFs();
  const result = FS.cat(fs, [], 'foo');
  assert.equal(result.success, false);
});

test('resolvePath handles absolute paths', () => {
  assert.deepEqual(FS.resolvePath(['foo'], '/b.txt'), ['b.txt']);
});

test('resolvePath handles relative paths with ..', () => {
  assert.deepEqual(FS.resolvePath(['foo', 'bar'], '../baz'), ['foo', 'baz']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Error: Cannot find module '../js/filesystem.js'` (the module doesn't exist yet).

- [ ] **Step 3: Implement `js/filesystem.js`**

```js
'use strict';

function splitPath(pathStr) {
  return pathStr.split('/').filter((seg) => seg.length > 0 && seg !== '.');
}

function resolvePath(cwdPath, inputPath) {
  const isAbsolute = inputPath.startsWith('/');
  const segments = isAbsolute ? [] : cwdPath.slice();
  const parts = splitPath(inputPath);
  for (const part of parts) {
    if (part === '..') {
      if (segments.length > 0) segments.pop();
    } else {
      segments.push(part);
    }
  }
  return segments;
}

function getNode(fs, segments) {
  let node = fs;
  for (const seg of segments) {
    if (node.type !== 'dir' || !node.children[seg]) return null;
    node = node.children[seg];
  }
  return node;
}

function getParent(fs, segments) {
  if (segments.length === 0) return null;
  const parent = getNode(fs, segments.slice(0, -1));
  if (!parent || parent.type !== 'dir') return null;
  return parent;
}

function pwd(cwdPath) {
  return '/' + cwdPath.join('/');
}

function ls(fs, cwdPath) {
  const node = getNode(fs, cwdPath);
  if (!node || node.type !== 'dir') {
    return { success: false, error: 'Not a folder.' };
  }
  const entries = Object.keys(node.children)
    .sort()
    .map((name) => (node.children[name].type === 'dir' ? name + '/' : name));
  return { success: true, entries };
}

function cd(fs, cwdPath, target) {
  if (!target) {
    return { success: false, error: 'cd requires a folder name.' };
  }
  const segments = resolvePath(cwdPath, target);
  const node = getNode(fs, segments);
  if (!node) {
    return { success: false, error: `No such folder: ${target}` };
  }
  if (node.type !== 'dir') {
    return { success: false, error: `${target} is a file, not a folder.` };
  }
  return { success: true, newCwdPath: segments };
}

function mkdir(fs, cwdPath, name) {
  if (!name) return { success: false, error: 'mkdir requires a folder name.' };
  if (name.includes('/')) return { success: false, error: 'Folder name cannot contain /.' };
  const parent = getNode(fs, cwdPath);
  if (!parent || parent.type !== 'dir') return { success: false, error: 'Current location is not a folder.' };
  if (parent.children[name]) return { success: false, error: `${name} already exists.` };
  parent.children[name] = { type: 'dir', name, children: {} };
  return { success: true };
}

function touch(fs, cwdPath, name) {
  if (!name) return { success: false, error: 'touch requires a file name.' };
  if (name.includes('/')) return { success: false, error: 'File name cannot contain /.' };
  const parent = getNode(fs, cwdPath);
  if (!parent || parent.type !== 'dir') return { success: false, error: 'Current location is not a folder.' };
  if (!parent.children[name]) {
    parent.children[name] = { type: 'file', name, content: '' };
  }
  return { success: true };
}

function deepCopy(node, newName) {
  if (node.type === 'file') {
    return { type: 'file', name: newName, content: node.content };
  }
  const children = {};
  for (const key of Object.keys(node.children)) {
    children[key] = deepCopy(node.children[key], key);
  }
  return { type: 'dir', name: newName, children };
}

function resolveDestination(fs, cwdPath, srcName, destination) {
  const destSegments = resolvePath(cwdPath, destination);
  const destNode = getNode(fs, destSegments);
  if (destNode && destNode.type === 'dir') {
    return { parentSegments: destSegments, finalName: srcName };
  }
  return { parentSegments: destSegments.slice(0, -1), finalName: destSegments[destSegments.length - 1] };
}

function cp(fs, cwdPath, source, destination) {
  if (!source || !destination) return { success: false, error: 'cp requires a source and a destination.' };
  const srcSegments = resolvePath(cwdPath, source);
  const srcNode = getNode(fs, srcSegments);
  if (!srcNode) return { success: false, error: `No such file or folder: ${source}` };
  const srcName = srcSegments[srcSegments.length - 1];
  const { parentSegments, finalName } = resolveDestination(fs, cwdPath, srcName, destination);
  const destParent = getNode(fs, parentSegments);
  if (!destParent || destParent.type !== 'dir') return { success: false, error: `No such destination folder: ${destination}` };
  if (destParent.children[finalName]) return { success: false, error: `${finalName} already exists at the destination.` };
  destParent.children[finalName] = deepCopy(srcNode, finalName);
  return { success: true };
}

function mv(fs, cwdPath, source, destination) {
  if (!source || !destination) return { success: false, error: 'mv requires a source and a destination.' };
  const srcSegments = resolvePath(cwdPath, source);
  const srcNode = getNode(fs, srcSegments);
  if (!srcNode) return { success: false, error: `No such file or folder: ${source}` };
  const srcParent = getParent(fs, srcSegments);
  const srcName = srcSegments[srcSegments.length - 1];
  const { parentSegments, finalName } = resolveDestination(fs, cwdPath, srcName, destination);
  const destParent = getNode(fs, parentSegments);
  if (!destParent || destParent.type !== 'dir') return { success: false, error: `No such destination folder: ${destination}` };
  if (destParent.children[finalName]) return { success: false, error: `${finalName} already exists at the destination.` };
  destParent.children[finalName] = srcNode;
  srcNode.name = finalName;
  delete srcParent.children[srcName];
  return { success: true };
}

function rm(fs, cwdPath, name, recursive) {
  if (!name) return { success: false, error: 'rm requires a file or folder name.' };
  const segments = resolvePath(cwdPath, name);
  const node = getNode(fs, segments);
  if (!node) return { success: false, error: `No such file or folder: ${name}` };
  if (node.type === 'dir' && !recursive) {
    return { success: false, error: `${name} is a folder. Use rm -r ${name} to delete it.` };
  }
  const parent = getParent(fs, segments);
  delete parent.children[segments[segments.length - 1]];
  return { success: true };
}

function cat(fs, cwdPath, name) {
  if (!name) return { success: false, error: 'cat requires a file name.' };
  const segments = resolvePath(cwdPath, name);
  const node = getNode(fs, segments);
  if (!node) return { success: false, error: `No such file: ${name}` };
  if (node.type !== 'file') return { success: false, error: `${name} is a folder, not a file.` };
  return { success: true, content: node.content };
}

const filesystem = { resolvePath, getNode, getParent, pwd, ls, cd, mkdir, touch, cp, mv, rm, cat };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = filesystem;
}
if (typeof window !== 'undefined') {
  window.Filesystem = filesystem;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in `tests/filesystem.test.js` green, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "Add virtual filesystem engine with full test coverage"
```

---

## Task 3: Command parser (`js/commands.js`)

**Files:**
- Create: `js/commands.js`
- Test: `tests/commands.test.js`

**Interfaces:**
- Consumes: every function from Task 2's `js/filesystem.js` (`pwd`, `ls`, `cd`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `cat`).
- Produces (consumed by `js/game.js` and its tests):
  - `executeCommand(fs, cwdPath, rawInput) -> CommandResult` where
    `CommandResult = { commandName: string, success: boolean, outputLines: string[], newCwdPath: string[] | null, clearScreen: boolean, catFile?: string }`.
  - `commandName` values: `'pwd'`, `'ls'`, `'clear'`, `'cd'` (for `cd <name>`), `'cd..'` (for `cd ..`), `'mkdir'`, `'touch'`, `'cp'`, `'mv'`, `'rm'`, `'rm-r'` (for `rm -r <name>`), `'cat'`, `'unknown'`, or `''` for empty input.
  - `catFile` is set to the filename argument only on a successful `cat`, for callers that need to know which file was read.

- [ ] **Step 1: Write the failing tests**

Create `tests/commands.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { executeCommand } = require('../js/commands.js');

function sampleFs() {
  return {
    type: 'dir', name: '/', children: {
      foo: { type: 'dir', name: 'foo', children: {} },
      'b.txt': { type: 'file', name: 'b.txt', content: 'world' }
    }
  };
}

test('pwd returns current path', () => {
  const result = executeCommand(sampleFs(), ['foo'], 'pwd');
  assert.equal(result.commandName, 'pwd');
  assert.deepEqual(result.outputLines, ['/foo']);
});

test('ls lists entries', () => {
  const result = executeCommand(sampleFs(), [], 'ls');
  assert.equal(result.success, true);
  assert.deepEqual(result.outputLines, ['b.txt', 'foo/']);
});

test('clear signals clearScreen and prints nothing', () => {
  const result = executeCommand(sampleFs(), [], 'clear');
  assert.equal(result.clearScreen, true);
  assert.deepEqual(result.outputLines, []);
});

test('cd reports commandName "cd" for a named folder', () => {
  const result = executeCommand(sampleFs(), [], 'cd foo');
  assert.equal(result.commandName, 'cd');
  assert.deepEqual(result.newCwdPath, ['foo']);
});

test('cd .. reports commandName "cd.."', () => {
  const result = executeCommand(sampleFs(), ['foo'], 'cd ..');
  assert.equal(result.commandName, 'cd..');
  assert.deepEqual(result.newCwdPath, []);
});

test('cd into a missing folder fails with an ARIA-voiced error', () => {
  const result = executeCommand(sampleFs(), [], 'cd nowhere');
  assert.equal(result.success, false);
  assert.match(result.outputLines[0], /ARIA/);
});

test('mkdir creates a folder and reports success', () => {
  const fs = sampleFs();
  const result = executeCommand(fs, [], 'mkdir newdir');
  assert.equal(result.success, true);
  assert.equal(fs.children.newdir.type, 'dir');
});

test('touch creates a file', () => {
  const fs = sampleFs();
  const result = executeCommand(fs, [], 'touch new.txt');
  assert.equal(result.success, true);
  assert.equal(fs.children['new.txt'].type, 'file');
});

test('cp copies a file', () => {
  const fs = sampleFs();
  const result = executeCommand(fs, [], 'cp b.txt foo');
  assert.equal(result.success, true);
  assert.equal(fs.children.foo.children['b.txt'].content, 'world');
});

test('mv moves a file', () => {
  const fs = sampleFs();
  const result = executeCommand(fs, [], 'mv b.txt foo');
  assert.equal(result.success, true);
  assert.equal(fs.children['b.txt'], undefined);
});

test('rm deletes a file and reports commandName "rm"', () => {
  const fs = sampleFs();
  const result = executeCommand(fs, [], 'rm b.txt');
  assert.equal(result.commandName, 'rm');
  assert.equal(result.success, true);
  assert.equal(fs.children['b.txt'], undefined);
});

test('rm -r parses the -r flag and reports commandName "rm-r"', () => {
  const fs = sampleFs();
  const result = executeCommand(fs, [], 'rm -r foo');
  assert.equal(result.commandName, 'rm-r');
  assert.equal(result.success, true);
  assert.equal(fs.children.foo, undefined);
});

test('cat returns content and reports catFile', () => {
  const result = executeCommand(sampleFs(), [], 'cat b.txt');
  assert.equal(result.success, true);
  assert.equal(result.catFile, 'b.txt');
  assert.deepEqual(result.outputLines, ['world']);
});

test('unknown command returns a friendly ARIA-voiced error', () => {
  const result = executeCommand(sampleFs(), [], 'frobnicate');
  assert.equal(result.success, false);
  assert.equal(result.commandName, 'unknown');
  assert.match(result.outputLines[0], /ARIA/);
});

test('empty input is a harmless no-op', () => {
  const result = executeCommand(sampleFs(), [], '   ');
  assert.equal(result.commandName, '');
  assert.deepEqual(result.outputLines, []);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Error: Cannot find module '../js/commands.js'`.

- [ ] **Step 3: Implement `js/commands.js`**

```js
'use strict';

const FS = (typeof require !== 'undefined') ? require('./filesystem.js') : window.Filesystem;

function tokenize(raw) {
  return raw.trim().split(/\s+/).filter(Boolean);
}

function executeCommand(fs, cwdPath, rawInput) {
  const tokens = tokenize(rawInput);
  if (tokens.length === 0) {
    return { commandName: '', success: false, outputLines: [], newCwdPath: null, clearScreen: false };
  }
  const name = tokens[0].toLowerCase();
  const args = tokens.slice(1);

  switch (name) {
    case 'pwd':
      return { commandName: 'pwd', success: true, outputLines: [FS.pwd(cwdPath)], newCwdPath: null, clearScreen: false };

    case 'ls': {
      const result = FS.ls(fs, cwdPath);
      if (!result.success) {
        return { commandName: 'ls', success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      const output = result.entries.length > 0 ? result.entries : ['(nothing here)'];
      return { commandName: 'ls', success: true, outputLines: output, newCwdPath: null, clearScreen: false };
    }

    case 'clear':
      return { commandName: 'clear', success: true, outputLines: [], newCwdPath: null, clearScreen: true };

    case 'cd': {
      const target = args[0];
      const commandName = target === '..' ? 'cd..' : 'cd';
      const result = FS.cd(fs, cwdPath, target);
      if (!result.success) {
        return { commandName, success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName, success: true, outputLines: [], newCwdPath: result.newCwdPath, clearScreen: false };
    }

    case 'mkdir': {
      const result = FS.mkdir(fs, cwdPath, args[0]);
      if (!result.success) {
        return { commandName: 'mkdir', success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName: 'mkdir', success: true, outputLines: [`Created folder: ${args[0]}`], newCwdPath: null, clearScreen: false };
    }

    case 'touch': {
      const result = FS.touch(fs, cwdPath, args[0]);
      if (!result.success) {
        return { commandName: 'touch', success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName: 'touch', success: true, outputLines: [`Created file: ${args[0]}`], newCwdPath: null, clearScreen: false };
    }

    case 'cp': {
      const result = FS.cp(fs, cwdPath, args[0], args[1]);
      if (!result.success) {
        return { commandName: 'cp', success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName: 'cp', success: true, outputLines: [`Copied ${args[0]} to ${args[1]}`], newCwdPath: null, clearScreen: false };
    }

    case 'mv': {
      const result = FS.mv(fs, cwdPath, args[0], args[1]);
      if (!result.success) {
        return { commandName: 'mv', success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName: 'mv', success: true, outputLines: [`Moved ${args[0]} to ${args[1]}`], newCwdPath: null, clearScreen: false };
    }

    case 'rm': {
      const recursive = args[0] === '-r';
      const target = recursive ? args[1] : args[0];
      const commandName = recursive ? 'rm-r' : 'rm';
      const result = FS.rm(fs, cwdPath, target, recursive);
      if (!result.success) {
        return { commandName, success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName, success: true, outputLines: [`Deleted: ${target}`], newCwdPath: null, clearScreen: false };
    }

    case 'cat': {
      const result = FS.cat(fs, cwdPath, args[0]);
      if (!result.success) {
        return { commandName: 'cat', success: false, outputLines: [`ARIA: ${result.error}`], newCwdPath: null, clearScreen: false };
      }
      return { commandName: 'cat', success: true, outputLines: [result.content], newCwdPath: null, clearScreen: false, catFile: args[0] };
    }

    default:
      return {
        commandName: 'unknown',
        success: false,
        outputLines: [`ARIA: I don't recognize "${name}". Try one of: pwd, ls, cd, mkdir, touch, cp, mv, rm, cat, clear.`],
        newCwdPath: null,
        clearScreen: false
      };
  }
}

const commands = { executeCommand, tokenize };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = commands;
}
if (typeof window !== 'undefined') {
  window.Commands = commands;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in both `tests/filesystem.test.js` and `tests/commands.test.js` green.

- [ ] **Step 5: Commit**

```bash
git add js/commands.js tests/commands.test.js
git commit -m "Add command parser with ARIA-voiced errors and full test coverage"
```

---

## Task 4: Room & story content (`js/rooms.js`)

**Files:**
- Create: `js/rooms.js`
- Test: `tests/rooms.test.js`

**Interfaces:**
- Consumes: `getNode` from Task 2's `js/filesystem.js` (passed in as the `FS` argument to `checkCompletion`, not required directly).
- Produces (consumed by `js/game.js`, `js/terminal-ui.js`, and their tests):
  - `ROOM_ORDER: string[]` — `['deck', 'hallway', 'library', 'galley', 'vault', 'bridge']`, tier order.
  - `ROOMS: { [id]: Room }` where `Room = { id, title, introLines: string[], helpLines: string[], completeLines: string[], checkCompletion(trackers, fs, FS) -> boolean }`. `trackers = { commandsUsedThisRoom: Set, visitedCabins: Set, filesRead: Set }`.
  - `CABIN_FLAVOR: { [cwdPathJoinedBySlash]: string }` — auto-printed flavor text for the three hallway cabins.
  - `WIN_TEXT: string[]` — the final twist-ending lines.
  - `buildInitialFilesystem() -> fsNode` — builds a fresh copy of the yacht's filesystem tree each call (so two `GameState`s never share mutable state).

- [ ] **Step 1: Write the failing tests**

Create `tests/rooms.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Rooms = require('../js/rooms.js');
const FS = require('../js/filesystem.js');

test('ROOM_ORDER lists all six rooms in tier order', () => {
  assert.deepEqual(Rooms.ROOM_ORDER, ['deck', 'hallway', 'library', 'galley', 'vault', 'bridge']);
});

test('every room id in ROOM_ORDER has a matching ROOMS entry', () => {
  for (const id of Rooms.ROOM_ORDER) {
    assert.ok(Rooms.ROOMS[id], `missing room definition for ${id}`);
  }
});

test('deck completes only once pwd, ls, and clear have all been used', () => {
  const room = Rooms.ROOMS.deck;
  assert.equal(room.checkCompletion({ commandsUsedThisRoom: new Set(['pwd', 'ls']) }), false);
  assert.equal(room.checkCompletion({ commandsUsedThisRoom: new Set(['pwd', 'ls', 'clear']) }), true);
});

test('hallway completes only once all three cabins are visited', () => {
  const room = Rooms.ROOMS.hallway;
  assert.equal(room.checkCompletion({ visitedCabins: new Set(['margot-cabin']) }), false);
  assert.equal(
    room.checkCompletion({ visitedCabins: new Set(['margot-cabin', 'antoine-cabin', 'vasquez-cabin']) }),
    true
  );
});

test('library completes only once all three documents are read', () => {
  const room = Rooms.ROOMS.library;
  assert.equal(room.checkCompletion({ filesRead: new Set(['margot-diary.txt']) }), false);
  assert.equal(
    room.checkCompletion({ filesRead: new Set(['margot-diary.txt', 'captains-log.txt', 'antoine-note.txt']) }),
    true
  );
});

test('galley completes once evidence/case-notes.txt exists', () => {
  const fs = Rooms.buildInitialFilesystem();
  const room = Rooms.ROOMS.galley;
  assert.equal(room.checkCompletion({}, fs, FS), false);
  FS.mkdir(fs, ['galley'], 'evidence');
  FS.touch(fs, ['galley', 'evidence'], 'case-notes.txt');
  assert.equal(room.checkCompletion({}, fs, FS), true);
});

test('vault completes once the will is copied and the ledger is moved', () => {
  const fs = Rooms.buildInitialFilesystem();
  FS.mkdir(fs, ['galley'], 'evidence');
  const room = Rooms.ROOMS.vault;
  assert.equal(room.checkCompletion({}, fs, FS), false);
  FS.cp(fs, ['vault'], 'will-amendment.txt', '/galley/evidence');
  assert.equal(room.checkCompletion({}, fs, FS), false);
  FS.mv(fs, ['vault'], 'ledger.txt', '/galley/evidence');
  assert.equal(room.checkCompletion({}, fs, FS), true);
});

test('bridge completes once the decoy file and red-herrings folder are removed', () => {
  const fs = Rooms.buildInitialFilesystem();
  const room = Rooms.ROOMS.bridge;
  assert.equal(room.checkCompletion({}, fs, FS), false);
  FS.rm(fs, ['bridge'], 'bridge-logs.txt', false);
  assert.equal(room.checkCompletion({}, fs, FS), false);
  FS.rm(fs, ['bridge'], 'red-herrings', true);
  assert.equal(room.checkCompletion({}, fs, FS), true);
});

test('buildInitialFilesystem returns a fresh independent tree each call', () => {
  const fsA = Rooms.buildInitialFilesystem();
  const fsB = Rooms.buildInitialFilesystem();
  FS.mkdir(fsA, ['galley'], 'evidence');
  assert.equal(fsB.children.galley.children.evidence, undefined);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Error: Cannot find module '../js/rooms.js'`.

- [ ] **Step 3: Implement `js/rooms.js`**

```js
'use strict';

const ROOM_ORDER = ['deck', 'hallway', 'library', 'galley', 'vault', 'bridge'];

const CABIN_FLAVOR = {
  'hallway/margot-cabin':
    "Margot's cabin: a half-packed suitcase, a guidebook to Paris dog-eared on 'Best Bakeries,' and a framed photo of her and Reggie -- with a second, smaller photo tucked behind it that you can't quite see from here.",
  'hallway/antoine-cabin':
    "Antoine's cabin: surprisingly tidy for a chef. A single rose in a water glass. A notebook of recipes, one page titled simply 'For M.' Another page, suspiciously, titled 'For V.'",
  'hallway/vasquez-cabin':
    "Captain Vasquez's cabin: nautical charts, a ship-in-a-bottle, and a takeout container from the galley that absolutely was not 'standard crew rations.'"
};

function buildInitialFilesystem() {
  return {
    type: 'dir',
    name: '/',
    children: {
      deck: {
        type: 'dir',
        name: 'deck',
        children: {
          'earring.txt': {
            type: 'file', name: 'earring.txt',
            content: "A single pearl earring, half-hidden under a deck chair. Doesn't look like Margot's usual style -- too understated for an heiress."
          },
          'napkin.txt': {
            type: 'file', name: 'napkin.txt',
            content: 'A cocktail napkin, the ink smeared: "meet me after the toast -- A."'
          },
          'overturned-chair.txt': {
            type: 'file', name: 'overturned-chair.txt',
            content: 'A deck chair, knocked on its side. Reggie was sitting here twenty minutes ago, mid-toast, champagne in hand. Now: gone.'
          }
        }
      },
      hallway: {
        type: 'dir',
        name: 'hallway',
        children: {
          'margot-cabin': { type: 'dir', name: 'margot-cabin', children: {} },
          'antoine-cabin': { type: 'dir', name: 'antoine-cabin', children: {} },
          'vasquez-cabin': { type: 'dir', name: 'vasquez-cabin', children: {} }
        }
      },
      library: {
        type: 'dir',
        name: 'library',
        children: {
          'margot-diary.txt': {
            type: 'file', name: 'margot-diary.txt',
            content: "Dear diary, I don't know how to tell Reggie. It's not just nerves about the wedding. It's Antoine. The way he plates a tomato like it's a sonnet. I think I'm in love with my own caterer."
          },
          'captains-log.txt': {
            type: 'file', name: 'captains-log.txt',
            content: "Captain's Log, Day 4: Crew morale fine. Personal note: I should stop leaving notes for Antoine in the galley. Someone will find them. --V."
          },
          'antoine-note.txt': {
            type: 'file', name: 'antoine-note.txt',
            content: 'To whoever finds this -- yes, I have been seeing both of them. Margot, I adore you. Vasquez, I adore you differently but also a lot. I am one (1) chef. This is not sustainable. --A.'
          }
        }
      },
      galley: { type: 'dir', name: 'galley', children: {} },
      vault: {
        type: 'dir',
        name: 'vault',
        children: {
          'will-amendment.txt': {
            type: 'file', name: 'will-amendment.txt',
            content: 'AMENDMENT TO LAST WILL AND TESTAMENT OF REGINALD STERLING III: Effective immediately, all yacht-related assets are bequeathed to M. Sterling (fiancee), pending marriage. Drafted in suspicious haste, two days ago, by a lawyer nobody recognizes.'
          },
          'ledger.txt': {
            type: 'file', name: 'ledger.txt',
            content: "Galley Expense Ledger -- Captain V. requested 4 'private' dinners for two this month, all charged to 'crew morale.' All four nights match Antoine's days off."
          }
        }
      },
      bridge: {
        type: 'dir',
        name: 'bridge',
        children: {
          'bridge-logs.txt': {
            type: 'file', name: 'bridge-logs.txt',
            content: 'Automated bridge log: nothing of note. (Someone has clearly edited this file. ARIA flags it as fabricated.)'
          },
          'red-herrings': {
            type: 'dir',
            name: 'red-herrings',
            children: {
              'fake-confession.txt': {
                type: 'file', name: 'fake-confession.txt',
                content: "'I did it -- the Captain.' Signed, definitely not the Captain, definitely not written in Margot's handwriting."
              },
              'rumor.txt': {
                type: 'file', name: 'rumor.txt',
                content: 'Overheard: "I heard the parrot did it." There is no parrot on this yacht.'
              }
            }
          }
        }
      }
    }
  };
}

const ROOMS = {
  deck: {
    id: 'deck',
    title: 'Main Deck',
    introLines: [
      'You wake up on the Main Deck of the S/V Segfault, the taste of champagne and confusion in your mouth.',
      "The party noise has stopped. Reggie Sterling -- yacht owner, tech billionaire, your host for tonight's engagement gala -- is nowhere to be seen. His chair lies overturned.",
      'A voice crackles from a nearby speaker: "Good evening. I am ARIA, the vessel\'s onboard assistant. I do not do small talk. I do, however, take commands. Try `pwd` to confirm your location."'
    ],
    helpLines: ['pwd - show where you are', 'ls - list what is around you', 'clear - clear the screen'],
    completeLines: ['ARIA: Deck systems reviewed. The Guest Hallway is now accessible. Try `cd ..` and then `cd hallway`.'],
    checkCompletion(trackers) {
      return ['pwd', 'ls', 'clear'].every((c) => trackers.commandsUsedThisRoom.has(c));
    }
  },
  hallway: {
    id: 'hallway',
    title: 'Guest Hallway',
    introLines: [
      'The hallway is lined with three cabin doors: margot-cabin, antoine-cabin, vasquez-cabin.',
      'ARIA: "Check each cabin. Use `cd [folder]` to enter, `cd ..` to step back out."'
    ],
    helpLines: ['cd [folder] - enter a cabin', 'cd .. - step back into the hallway'],
    completeLines: ['ARIA: All three cabins checked. The Library is now accessible. Try `cd ..` and then `cd library`.'],
    checkCompletion(trackers) {
      return trackers.visitedCabins.size >= 3;
    }
  },
  library: {
    id: 'library',
    title: 'Library',
    introLines: [
      'Shelves of nautical novels and one very out-of-place filing cabinet.',
      'ARIA: "Three documents in here are worth your time. Use `cat [file]` to read each one."'
    ],
    helpLines: ['ls - see what is in here', 'cat [file] - read a file'],
    completeLines: ['ARIA: Well. That escalated. The Galley is now accessible. Try `cd ..` and then `cd galley`.'],
    checkCompletion(trackers) {
      const need = ['margot-diary.txt', 'captains-log.txt', 'antoine-note.txt'];
      return need.every((f) => trackers.filesRead.has(f));
    }
  },
  galley: {
    id: 'galley',
    title: 'Galley',
    introLines: [
      'Pots still simmering, no chef in sight.',
      'ARIA: "Standard procedure: create an evidence folder, then log a case file inside it. `mkdir evidence`, then `cd evidence`, then `touch case-notes.txt`."'
    ],
    helpLines: ['mkdir [folder] - create a folder', 'cd [folder] - enter it', 'touch [file] - create a file'],
    completeLines: ['ARIA: Evidence locker established. The Vault is now accessible. Try `cd ..` and then `cd vault`.'],
    checkCompletion(trackers, fs, FS) {
      const evidence = FS.getNode(fs, ['galley', 'evidence']);
      if (!evidence || evidence.type !== 'dir') return false;
      const notes = FS.getNode(fs, ['galley', 'evidence', 'case-notes.txt']);
      return !!notes && notes.type === 'file';
    }
  },
  vault: {
    id: 'vault',
    title: 'Vault',
    introLines: [
      'A small safe room. Two documents sit on the table: will-amendment.txt and ledger.txt.',
      'ARIA: "Copy the will amendment to the evidence locker in case the original disappears: `cp will-amendment.txt /galley/evidence`. Then move the ledger there for safekeeping: `mv ledger.txt /galley/evidence`."'
    ],
    helpLines: [
      'cp [source] [dest] - copy a file',
      'mv [source] [dest] - move a file',
      'tip: /galley/evidence is a full path that works from anywhere'
    ],
    completeLines: ['ARIA: Evidence secured. The Bridge is now accessible. Try `cd ..` and then `cd bridge`.'],
    checkCompletion(trackers, fs, FS) {
      const willCopy = FS.getNode(fs, ['galley', 'evidence', 'will-amendment.txt']);
      const ledgerStillInVault = FS.getNode(fs, ['vault', 'ledger.txt']);
      const ledgerMoved = FS.getNode(fs, ['galley', 'evidence', 'ledger.txt']);
      return !!willCopy && !ledgerStillInVault && !!ledgerMoved;
    }
  },
  bridge: {
    id: 'bridge',
    title: 'Bridge',
    introLines: [
      'The bridge. A fabricated log file and a folder of planted red herrings are cluttering the console.',
      'ARIA: "Clear the noise: `rm bridge-logs.txt`, then `rm -r red-herrings`."'
    ],
    helpLines: ['rm [file] - delete a file', 'rm -r [folder] - delete a folder and everything in it'],
    completeLines: [
      'ARIA: Noise cleared.',
      'ARIA: "Return to the evidence locker and read what you recovered: `cd /galley/evidence`, then `cat will-amendment.txt`."'
    ],
    checkCompletion(trackers, fs, FS) {
      const logsGone = FS.getNode(fs, ['bridge', 'bridge-logs.txt']);
      const herringsGone = FS.getNode(fs, ['bridge', 'red-herrings']);
      return !logsGone && !herringsGone;
    }
  }
};

const WIN_TEXT = [
  'You read the ledger aloud. The room goes silent. Margot, Antoine, and Captain Vasquez stare at each other -- then at you.',
  '"It was an inside job," you say, "in more ways than one."',
  'Suddenly, the linen closet door creaks open. Out steps REGGIE STERLING, very much alive, holding a kazoo and an enormous grin.',
  '"I KNEW one of you would crack!" he announces. "Wait -- none of you cracked. You all just... fell in love with the chef. Antoine, what IS in that risotto?"',
  'Margot, Antoine, and Vasquez are mortified beyond words.',
  'ARIA: "Captain\'s log update: yacht engagement, indefinitely postponed. Group therapy session: scheduled."',
  '',
  'THE END.'
];

const rooms = { ROOM_ORDER, ROOMS, CABIN_FLAVOR, WIN_TEXT, buildInitialFilesystem };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = rooms;
}
if (typeof window !== 'undefined') {
  window.Rooms = rooms;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests across `tests/filesystem.test.js`, `tests/commands.test.js`, `tests/rooms.test.js` green.

- [ ] **Step 5: Commit**

```bash
git add js/rooms.js tests/rooms.test.js
git commit -m "Add room/story content and completion checks for all six tiers"
```

---

## Task 5: GameState orchestration (`js/game.js`)

**Files:**
- Create: `js/game.js`
- Test: `tests/game.test.js`

**Interfaces:**
- Consumes: `js/filesystem.js` (`pwd`, `getNode` via the `FS` object), `js/commands.js` (`executeCommand`), `js/rooms.js` (`ROOM_ORDER`, `ROOMS`, `CABIN_FLAVOR`, `WIN_TEXT`, `buildInitialFilesystem`).
- Produces (consumed by `js/terminal-ui.js`):
  - `class GameState` with:
    - `new GameState()` — starts on the deck (`cwdPath = ['deck']`), nothing completed.
    - `handleInput(raw: string) -> { outputLines: string[], clearScreen: boolean, roomChanged: boolean, won: boolean }`
    - `getSidebarInfo() -> { title: string, helpLines: string[], cluesCollected: string[], cwd: string }`
    - `toJSON() -> plainObject` / `static fromJSON(plainObject) -> GameState` for localStorage round-tripping.

- [ ] **Step 1: Write the failing tests**

Create `tests/game.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameState } = require('../js/game.js');

test('a new game starts on the deck', () => {
  const state = new GameState();
  assert.deepEqual(state.cwdPath, ['deck']);
});

test('cd to hallway is blocked before the deck tier is complete', () => {
  const state = new GameState();
  state.handleInput('cd ..');
  const result = state.handleInput('cd hallway');
  assert.deepEqual(state.cwdPath, []);
  assert.match(result.outputLines[0], /ARIA/);
});

test('completing pwd, ls, and clear unlocks the hallway', () => {
  const state = new GameState();
  state.handleInput('pwd');
  state.handleInput('ls');
  const result = state.handleInput('clear');
  assert.equal(result.roomChanged, true);
  assert.ok(state.completedRooms.has('deck'));
  state.handleInput('cd ..');
  const enter = state.handleInput('cd hallway');
  assert.deepEqual(state.cwdPath, ['hallway']);
  assert.match(enter.outputLines.join(' '), /hallway/i);
});

test('visiting all three cabins completes the hallway tier', () => {
  const state = new GameState();
  state.handleInput('pwd');
  state.handleInput('ls');
  state.handleInput('clear');
  state.handleInput('cd ..');
  state.handleInput('cd hallway');
  state.handleInput('cd margot-cabin');
  state.handleInput('cd ..');
  state.handleInput('cd antoine-cabin');
  state.handleInput('cd ..');
  const result = state.handleInput('cd vasquez-cabin');
  assert.ok(state.completedRooms.has('hallway'));
  assert.match(result.outputLines.join(' '), /Vasquez/);
});

function playThroughToVault() {
  const state = new GameState();
  state.handleInput('pwd');
  state.handleInput('ls');
  state.handleInput('clear');
  state.handleInput('cd ..');
  state.handleInput('cd hallway');
  state.handleInput('cd margot-cabin');
  state.handleInput('cd ..');
  state.handleInput('cd antoine-cabin');
  state.handleInput('cd ..');
  state.handleInput('cd vasquez-cabin');
  state.handleInput('cd ..');
  state.handleInput('cd library');
  state.handleInput('cat margot-diary.txt');
  state.handleInput('cat captains-log.txt');
  state.handleInput('cat antoine-note.txt');
  state.handleInput('cd ..');
  state.handleInput('cd galley');
  state.handleInput('mkdir evidence');
  state.handleInput('cd evidence');
  state.handleInput('touch case-notes.txt');
  state.handleInput('cd ..');
  state.handleInput('cd ..');
  state.handleInput('cd vault');
  return state;
}

test('full playthrough reaches the win condition', () => {
  const state = playThroughToVault();
  state.handleInput('cp will-amendment.txt /galley/evidence');
  state.handleInput('mv ledger.txt /galley/evidence');
  assert.ok(state.completedRooms.has('vault'));
  state.handleInput('cd ..');
  state.handleInput('cd bridge');
  state.handleInput('rm bridge-logs.txt');
  state.handleInput('rm -r red-herrings');
  assert.ok(state.completedRooms.has('bridge'));
  state.handleInput('cd /galley/evidence');
  const result = state.handleInput('cat will-amendment.txt');
  assert.equal(result.won, true);
  assert.equal(state.won, true);
});

test('cat-ing the win file before the bridge tier is done does not trigger the win', () => {
  const state = playThroughToVault();
  state.handleInput('cp will-amendment.txt /galley/evidence');
  state.handleInput('mv ledger.txt /galley/evidence');
  state.handleInput('cd /galley/evidence');
  const result = state.handleInput('cat will-amendment.txt');
  assert.equal(result.won, false);
  assert.equal(state.won, false);
});

test('toJSON and fromJSON round-trip game state', () => {
  const state = playThroughToVault();
  const data = state.toJSON();
  const restored = GameState.fromJSON(data);
  assert.deepEqual(restored.cwdPath, state.cwdPath);
  assert.deepEqual(Array.from(restored.completedRooms), Array.from(state.completedRooms));
});

test('getSidebarInfo reflects the current room', () => {
  const state = new GameState();
  const info = state.getSidebarInfo();
  assert.equal(info.title, 'Main Deck');
  assert.equal(info.cwd, '/deck');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Error: Cannot find module '../js/game.js'`.

- [ ] **Step 3: Implement `js/game.js`**

```js
'use strict';

const FS = (typeof require !== 'undefined') ? require('./filesystem.js') : window.Filesystem;
const Commands = (typeof require !== 'undefined') ? require('./commands.js') : window.Commands;
const Rooms = (typeof require !== 'undefined') ? require('./rooms.js') : window.Rooms;

class GameState {
  constructor() {
    this.fs = Rooms.buildInitialFilesystem();
    this.cwdPath = ['deck'];
    this.completedRooms = new Set();
    this.commandsUsedThisRoom = new Set();
    this.visitedCabins = new Set();
    this.filesRead = new Set();
    this.introShown = new Set(['deck']);
    this.won = false;
    this.lastCompletedRoomId = null;
  }

  currentRoomId() {
    return this.cwdPath[0] || null;
  }

  canEnterRoom(roomId) {
    const idx = Rooms.ROOM_ORDER.indexOf(roomId);
    if (idx === -1) return false;
    return idx <= this.completedRooms.size;
  }

  trackers() {
    return {
      commandsUsedThisRoom: this.commandsUsedThisRoom,
      visitedCabins: this.visitedCabins,
      filesRead: this.filesRead
    };
  }

  getSidebarInfo() {
    const roomId = this.currentRoomId() || 'deck';
    const room = Rooms.ROOMS[roomId] || Rooms.ROOMS.deck;
    return {
      title: room.title,
      helpLines: room.helpLines,
      cluesCollected: Array.from(this.filesRead),
      cwd: FS.pwd(this.cwdPath)
    };
  }

  handleInput(raw) {
    const result = Commands.executeCommand(this.fs, this.cwdPath, raw);
    const outputLines = result.outputLines.slice();
    const clearScreen = result.clearScreen;

    if (result.newCwdPath !== null) {
      const targetRoomId = result.newCwdPath[0];
      if (targetRoomId && targetRoomId !== this.currentRoomId() && !this.canEnterRoom(targetRoomId)) {
        return {
          outputLines: ["ARIA: Not yet. There's more to investigate before that area unlocks."],
          clearScreen: false,
          roomChanged: false,
          won: this.won
        };
      }

      this.cwdPath = result.newCwdPath;

      if (targetRoomId && !this.introShown.has(targetRoomId)) {
        outputLines.push('');
        outputLines.push(...Rooms.ROOMS[targetRoomId].introLines);
        this.introShown.add(targetRoomId);
      }

      const cabinKey = this.cwdPath.join('/');
      if (Rooms.CABIN_FLAVOR[cabinKey]) {
        outputLines.push(Rooms.CABIN_FLAVOR[cabinKey]);
        if (this.cwdPath[0] === 'hallway' && this.cwdPath.length === 2) {
          this.visitedCabins.add(this.cwdPath[1]);
        }
      }
    }

    if (result.success && result.commandName) {
      this.commandsUsedThisRoom.add(result.commandName);
    }

    if (result.success && result.commandName === 'cat' && result.catFile) {
      this.filesRead.add(result.catFile);

      if (
        this.completedRooms.has('bridge') &&
        this.cwdPath.join('/') === 'galley/evidence' &&
        result.catFile === 'will-amendment.txt'
      ) {
        this.won = true;
        return { outputLines: Rooms.WIN_TEXT, clearScreen: false, roomChanged: false, won: true };
      }
    }

    const roomChanged = this.checkRoomProgress();
    if (roomChanged) {
      const completedRoom = Rooms.ROOMS[this.lastCompletedRoomId];
      outputLines.push('');
      outputLines.push(...completedRoom.completeLines);
    }

    return { outputLines, clearScreen, roomChanged, won: this.won };
  }

  checkRoomProgress() {
    const roomId = this.currentRoomId();
    if (!roomId || this.completedRooms.has(roomId)) return false;
    const room = Rooms.ROOMS[roomId];
    const isDone = room.checkCompletion(this.trackers(), this.fs, FS);
    if (!isDone) return false;
    this.completedRooms.add(roomId);
    this.lastCompletedRoomId = roomId;
    this.commandsUsedThisRoom = new Set();
    return true;
  }

  toJSON() {
    return {
      fs: this.fs,
      cwdPath: this.cwdPath,
      completedRooms: Array.from(this.completedRooms),
      commandsUsedThisRoom: Array.from(this.commandsUsedThisRoom),
      visitedCabins: Array.from(this.visitedCabins),
      filesRead: Array.from(this.filesRead),
      introShown: Array.from(this.introShown),
      won: this.won
    };
  }

  static fromJSON(data) {
    const state = new GameState();
    state.fs = data.fs;
    state.cwdPath = data.cwdPath;
    state.completedRooms = new Set(data.completedRooms);
    state.commandsUsedThisRoom = new Set(data.commandsUsedThisRoom);
    state.visitedCabins = new Set(data.visitedCabins);
    state.filesRead = new Set(data.filesRead);
    state.introShown = new Set(data.introShown);
    state.won = data.won;
    return state;
  }
}

const game = { GameState };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = game;
}
if (typeof window !== 'undefined') {
  window.Game = game;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — every test across all four test files green, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add js/game.js tests/game.test.js
git commit -m "Add GameState orchestration: room gating, win condition, persistence"
```

---

## Task 6: HTML structure (`index.html`)

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: nothing yet (CSS in Task 7, JS wiring in Task 8) — this task only produces markup with the exact element IDs Task 8's `terminal-ui.js` will query.
- Produces (consumed by Task 7's CSS selectors and Task 8's `terminal-ui.js`): the element IDs `landing-screen`, `game-screen`, `choose-mac`, `choose-pc`, `terminal-window`, `terminal-titlebar`, `terminal-output`, `terminal-input-line`, `terminal-prompt`, `terminal-input`, `sidebar`, `sidebar-room-title`, `sidebar-cwd`, `sidebar-help`, `sidebar-clues`.

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>S/V Segfault -- A Terminal Murder Mystery</title>
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/theme-mac.css">
<link rel="stylesheet" href="css/theme-pc.css">
</head>
<body>

<section id="landing-screen">
  <h1>S/V SEGFAULT</h1>
  <p class="tagline">A Terminal Murder Mystery</p>
  <p>Learn the command line. Solve the case. Survive the love triangle.</p>
  <p>Are you playing on a Mac or a PC?</p>
  <div class="platform-choice">
    <button id="choose-mac" type="button">Mac</button>
    <button id="choose-pc" type="button">PC</button>
  </div>
</section>

<section id="game-screen" hidden>
  <div id="terminal-window">
    <div id="terminal-titlebar">
      <span id="terminal-title">ARIA Terminal</span>
    </div>
    <div id="terminal-output" aria-live="polite"></div>
    <div id="terminal-input-line">
      <span id="terminal-prompt">$</span>
      <input id="terminal-input" type="text" autocomplete="off" spellcheck="false" aria-label="Terminal command input">
    </div>
  </div>
  <aside id="sidebar">
    <h2 id="sidebar-room-title"></h2>
    <p id="sidebar-cwd"></p>
    <h3>Useful commands here</h3>
    <ul id="sidebar-help"></ul>
    <h3>Clues collected</h3>
    <ul id="sidebar-clues"></ul>
  </aside>
</section>

<script src="js/filesystem.js"></script>
<script src="js/commands.js"></script>
<script src="js/rooms.js"></script>
<script src="js/game.js"></script>
<script src="js/terminal-ui.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `python3 -c "import xml.dom.minidom, re; html = open('index.html').read(); assert html.count('<section') == html.count('</section>'); print('balanced sections OK')"`
Expected: `balanced sections OK` (a quick sanity check that tags balance; full visual verification happens in Task 8 once the JS is wired up).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add HTML structure for landing screen and terminal game screen"
```

---

## Task 7: Styling (`css/base.css`, `css/theme-mac.css`, `css/theme-pc.css`)

**Files:**
- Create: `css/base.css`
- Create: `css/theme-mac.css`
- Create: `css/theme-pc.css`

**Interfaces:**
- Consumes: the element IDs from Task 6's `index.html`.
- Produces: the `theme-mac` / `theme-pc` CSS classes that Task 8's `terminal-ui.js` adds to `<body>` based on the player's landing-screen choice.

- [ ] **Step 1: Create `css/base.css`**

```css
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, 'Segoe UI', sans-serif;
  background: #1e1e1e;
  color: #eee;
  height: 100vh;
}

#landing-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 2rem;
}

#landing-screen h1 {
  font-size: 2.5rem;
  letter-spacing: 0.1em;
  margin-bottom: 0;
}

.tagline {
  font-style: italic;
  opacity: 0.8;
}

.platform-choice {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.platform-choice button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #888;
  background: #2a2a2a;
  color: #eee;
}

.platform-choice button:hover {
  background: #3a3a3a;
}

#game-screen {
  display: flex;
  height: 100vh;
}

#terminal-window {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: #111;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
}

#terminal-titlebar {
  padding: 0.5rem 1rem;
  background: #2a2a2a;
}

#terminal-output {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  white-space: pre-wrap;
}

.output-line {
  margin-bottom: 0.35rem;
}

.command-echo {
  color: #8fd3ff;
}

#terminal-input-line {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-top: 1px solid #333;
}

#terminal-prompt {
  margin-right: 0.5rem;
  color: #8fd3ff;
}

#terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #eee;
  font-family: inherit;
  font-size: inherit;
}

#sidebar {
  flex: 1;
  background: #1a1a1a;
  padding: 1rem;
  overflow-y: auto;
  border-left: 1px solid #333;
}

#sidebar h2 {
  margin-top: 0;
}

#sidebar ul {
  padding-left: 1.2rem;
}
```

- [ ] **Step 2: Create `css/theme-mac.css`**

```css
.theme-mac #terminal-window {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.theme-mac #terminal-titlebar {
  background: #3a3a3a;
  display: flex;
  align-items: center;
  padding-left: 0.75rem;
}

.theme-mac #terminal-titlebar::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f56;
  box-shadow: 18px 0 0 #ffbd2e, 36px 0 0 #27c93f;
  margin-right: 2.5rem;
}

.theme-mac #terminal-window,
.theme-mac #terminal-output,
.theme-mac #terminal-input {
  font-family: 'Menlo', 'SF Mono', 'Courier New', monospace;
}
```

- [ ] **Step 3: Create `css/theme-pc.css`**

```css
.theme-pc #terminal-window {
  border-radius: 0;
  border: 1px solid #444;
}

.theme-pc #terminal-titlebar {
  background: #012456;
  color: #fff;
}

.theme-pc #terminal-output {
  background: #012456;
  color: #f2f2f2;
}

.theme-pc #terminal-input {
  background: #012456;
  color: #f2f2f2;
}

.theme-pc #terminal-window,
.theme-pc #terminal-output,
.theme-pc #terminal-input {
  font-family: 'Cascadia Code', 'Consolas', monospace;
}
```

- [ ] **Step 4: Commit**

```bash
git add css/base.css css/theme-mac.css css/theme-pc.css
git commit -m "Add base layout and Mac/PC cosmetic terminal themes"
```

---

## Task 8: Terminal UI glue (`js/terminal-ui.js`) + full playthrough verification

**Files:**
- Create: `js/terminal-ui.js`

**Interfaces:**
- Consumes: `window.Game.GameState` (Task 5), `window.Rooms.ROOMS` (Task 4), the DOM element IDs from Task 6, `window.localStorage`.
- Produces: a fully playable game in the browser. Nothing downstream depends on this file's internals (it's the top of the dependency graph).

- [ ] **Step 1: Implement `js/terminal-ui.js`**

```js
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
```

- [ ] **Step 2: Commit the implementation**

```bash
git add js/terminal-ui.js
git commit -m "Wire GameState to the DOM: input, scrollback, sidebar, persistence"
```

- [ ] **Step 3: Serve the site locally**

Run: `python3 -m http.server 8000` in the project root, in the background (or a separate terminal) — this is required because `index.html` loads multiple `<script>` files and some browsers block `file://` module-style loads with CORS errors; serving over HTTP avoids that.

- [ ] **Step 4: Manually verify the full playthrough in a browser**

Open `http://localhost:8000/` in a browser and play the entire game end to end, confirming each beat:

1. Landing screen shows the title and Mac/PC buttons. Click **Mac** — confirm the terminal window gets rounded corners and traffic-light dots; reload and click **PC** instead — confirm square corners and a dark-blue Windows-Terminal-style window. (Use a private/incognito window or clear `localStorage` between the two checks so the saved game doesn't carry over.)
2. On the Main Deck: type `pwd` (expect `/deck`), `ls` (expect the three deck files listed), `clear` (expect the scrollback to wipe) — confirm the sidebar then shows "Guest Hallway is now accessible" and the prompt still responds.
3. Type `cd hallway` directly without `cd ..` first — confirm it errors with `ARIA: No such folder: hallway` (it's not a child of `deck`). Then `cd ..` then `cd hallway` — confirm you arrive and see the hallway intro text.
4. `cd margot-cabin`, `cd ..`, `cd antoine-cabin`, `cd ..`, `cd vasquez-cabin` — confirm each shows its flavor text, and after the third cabin the Library unlocks.
5. `cd ..`, `cd library`, then `cat margot-diary.txt`, `cat captains-log.txt`, `cat antoine-note.txt` — confirm each prints its content and the Galley unlocks after the third.
6. `cd ..`, `cd galley`, `mkdir evidence`, `cd evidence`, `touch case-notes.txt` — confirm the Vault unlocks.
7. `cd ..`, `cd ..`, `cd vault`, `cp will-amendment.txt /galley/evidence`, `mv ledger.txt /galley/evidence` — confirm the Bridge unlocks.
8. `cd ..`, `cd bridge`, `rm bridge-logs.txt`, `rm -r red-herrings` — confirm ARIA tells you to return to the evidence locker.
9. `cd /galley/evidence`, `cat will-amendment.txt` — confirm the full `WIN_TEXT` twist ending prints.
10. Reload the page mid-game (after step 5, say) — confirm `localStorage` restores your exact room and filesystem state rather than restarting from the deck.

If any step doesn't match, fix the relevant module (most likely `js/terminal-ui.js` or a room definition in `js/rooms.js`) and re-run this whole manual check from the top before proceeding.

---

## Task 9: README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (documentation only).

- [ ] **Step 1: Create `README.md`**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add README with play/run/test instructions"
```

---

## Task 10: Push to GitHub and enable Pages

**Files:** none (repo/remote operations only).

- [ ] **Step 1: Add the GitHub remote (if not already present)**

Run: `git remote -v`
If `origin` is not listed, run: `git remote add origin https://github.com/dieyunsong/terminal.git`

- [ ] **Step 2: Push to `main`**

Run: `git push -u origin main`
Expected: the push succeeds and `main` on `dieyunsong/terminal` now has the full commit history from Tasks 1–9.

- [ ] **Step 3: Confirm with the user before changing repo settings, then enable GitHub Pages**

This step changes a shared setting on the user's GitHub repo (visible to anyone who visits the repo's Pages settings), so confirm with the user first. Once confirmed, run:

```bash
gh api -X POST repos/dieyunsong/terminal/pages -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/"
```

Expected: a JSON response describing the new Pages site, including a `html_url` like `https://dieyunsong.github.io/terminal/`. If the API call fails because Pages is already enabled, that's fine — confirm the existing configuration instead with `gh api repos/dieyunsong/terminal/pages`.

- [ ] **Step 4: Verify the live site**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://dieyunsong.github.io/terminal/`
Expected: `200` (note GitHub Pages deploys can take a minute or two after first enabling — if it returns `404`, wait ~60 seconds and retry before concluding something is wrong).

---

## Self-Review Notes

- **Spec coverage:** premise/framing (Task 4 intro text), story & twist (Task 4 `WIN_TEXT`), all 6 rooms mapped to all 11 commands + `clear` (Tasks 2–5), Mac/PC cosmetic-only theme (Tasks 6–8), localStorage persistence (Tasks 5, 8), sidebar with objective/clues/help (Tasks 6, 8), deployment to `dieyunsong/terminal` via GitHub Pages from repo root (Task 10) — every section of the design spec has a corresponding task.
- **Placeholder scan:** no TODO/TBD markers; every step has complete, runnable code or an exact command with expected output.
- **Type/name consistency:** verified `CommandResult` field names (`commandName`, `success`, `outputLines`, `newCwdPath`, `clearScreen`, `catFile`) are used identically across `commands.js`, `game.js`, and all three test files; verified `checkCompletion(trackers, fs, FS)` signature and the `trackers` shape (`commandsUsedThisRoom`, `visitedCabins`, `filesRead`) match between `rooms.js` and `game.js`; verified room ids (`deck`, `hallway`, `library`, `galley`, `vault`, `bridge`) and cabin names (`margot-cabin`, `antoine-cabin`, `vasquez-cabin`) are spelled identically everywhere they appear (filesystem seed, `CABIN_FLAVOR` keys, gating logic, tests).
