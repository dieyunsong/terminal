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

function completeDeck(state) {
  state.handleInput('cat earring.txt');
  state.handleInput('cat napkin.txt');
  state.handleInput('cat overturned-chair.txt');
}

test('reading the three deck clues unlocks the hallway', () => {
  const state = new GameState();
  state.handleInput('cat earring.txt');
  state.handleInput('cat napkin.txt');
  const result = state.handleInput('cat overturned-chair.txt');
  assert.equal(result.roomChanged, true);
  assert.ok(state.completedRooms.has('deck'));
  state.handleInput('cd ..');
  const enter = state.handleInput('cd hallway');
  assert.deepEqual(state.cwdPath, ['hallway']);
  assert.match(enter.outputLines.join(' '), /hallway/i);
});

test('cd <room> jumps straight to an unlocked room without cd .. first', () => {
  const state = new GameState();
  completeDeck(state);
  // Standing in /deck, go directly to the hallway (a sibling room) in one step.
  const enter = state.handleInput('cd hallway');
  assert.deepEqual(state.cwdPath, ['hallway']);
  assert.match(enter.outputLines.join(' '), /hallway/i);
});

test('cd <room> still refuses a locked room', () => {
  const state = new GameState();
  completeDeck(state);
  const blocked = state.handleInput('cd bridge'); // far ahead, still locked
  assert.deepEqual(state.cwdPath, ['deck']);
  assert.match(blocked.outputLines[0], /ARIA/);
});

test('a completed room shows a go-to-next-room objective', () => {
  const state = new GameState();
  completeDeck(state);
  assert.match(state.getSidebarInfo().objective, /cd hallway/);
});

test('clear alone does not complete the deck', () => {
  const state = new GameState();
  state.handleInput('pwd');
  state.handleInput('ls');
  state.handleInput('clear');
  assert.equal(state.completedRooms.has('deck'), false);
});

test('visiting all three cabins completes the hallway tier', () => {
  const state = new GameState();
  completeDeck(state);
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
  completeDeck(state);
  state.handleInput('cd ..');
  state.handleInput('cd hallway');
  state.handleInput('cd margot-cabin');
  state.handleInput('cd ..');
  state.handleInput('cd antoine-cabin');
  state.handleInput('cd ..');
  state.handleInput('cd vasquez-cabin');
  state.handleInput('cd ..');
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

function playThroughToAccusation() {
  const state = playThroughToVault();
  state.handleInput('cp will-amendment.txt /galley/evidence');
  state.handleInput('mv ledger.txt /galley/evidence');
  state.handleInput('cd ..');
  state.handleInput('cd bridge');
  state.handleInput('rm bridge-logs.txt');
  state.handleInput('rm -r red-herrings');
  return state;
}

test('full playthrough ends by accusing Reggie and winning', () => {
  const state = playThroughToAccusation();
  assert.ok(state.completedRooms.has('bridge'));
  const result = state.handleInput('accuse reggie');
  assert.equal(result.won, true);
  assert.equal(state.won, true);
  assert.match(result.outputLines.join(' '), /THE END/);
});

test('accusing the wrong suspect does not win and gives a nudge', () => {
  const state = playThroughToAccusation();
  const result = state.handleInput('accuse margot');
  assert.equal(result.won, false);
  assert.equal(state.won, false);
  assert.match(result.outputLines[0], /ARIA/);
  // still able to accuse correctly afterward
  const win = state.handleInput('accuse Reggie');
  assert.equal(win.won, true);
});

test('accusing before the bridge is cleared is refused', () => {
  const state = playThroughToVault();
  state.handleInput('cp will-amendment.txt /galley/evidence');
  state.handleInput('mv ledger.txt /galley/evidence');
  const result = state.handleInput('accuse reggie');
  assert.equal(result.won, false);
  assert.match(result.outputLines[0], /ARIA/);
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

test('hint returns a room hint and reports remaining count', () => {
  const state = new GameState();
  assert.equal(state.getSidebarInfo().hintsRemaining, 3);
  const r1 = state.handleInput('hint');
  assert.equal(r1.roomChanged, false);
  assert.equal(r1.clearScreen, false);
  assert.match(r1.outputLines[0], /ARIA/);
  assert.match(r1.outputLines[0], /2 hints left/);
  assert.equal(state.getSidebarInfo().hintsRemaining, 2);
});

test('hint is capped at three per room', () => {
  const state = new GameState();
  state.handleInput('hint');
  const second = state.handleInput('hint');
  assert.match(second.outputLines[0], /1 hint left/);
  const third = state.handleInput('hint');
  assert.match(third.outputLines[0], /0 hints left/);
  const fourth = state.handleInput('hint');
  assert.match(fourth.outputLines[0], /every hint/i);
  assert.equal(state.getSidebarInfo().hintsRemaining, 0);
});

test('hint does not count as a command toward room completion', () => {
  const state = new GameState();
  state.handleInput('hint');
  assert.equal(state.completedRooms.has('deck'), false, 'a hint alone must not complete the deck');
  assert.equal(state.commandsUsedThisRoom.size, 0);
});

test('each room has its own independent hint budget', () => {
  const state = new GameState();
  completeDeck(state); // read the three deck clues
  state.handleInput('cd ..'); state.handleInput('cd hallway');
  assert.equal(state.getSidebarInfo().hintsRemaining, 3, 'hallway starts with a fresh 3 hints');
});

test('hintsUsed survives a toJSON/fromJSON round-trip', () => {
  const state = new GameState();
  state.handleInput('hint');
  const restored = GameState.fromJSON(state.toJSON());
  assert.equal(restored.getSidebarInfo().hintsRemaining, 2);
});
