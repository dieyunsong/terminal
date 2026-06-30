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
