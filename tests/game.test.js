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
