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

test('deck completes only once all three deck clues have been read', () => {
  const room = Rooms.ROOMS.deck;
  assert.equal(room.checkCompletion({ filesRead: new Set(['earring.txt', 'napkin.txt']) }), false);
  assert.equal(
    room.checkCompletion({ filesRead: new Set(['earring.txt', 'napkin.txt', 'overturned-chair.txt']) }),
    true
  );
});

test('every room exposes an objective string', () => {
  for (const id of Rooms.ROOM_ORDER) {
    assert.equal(typeof Rooms.ROOMS[id].objective, 'string');
    assert.ok(Rooms.ROOMS[id].objective.length > 0, id + ' should have an objective');
  }
});

test('ACCUSATION names Reggie as the culprit', () => {
  assert.equal(Rooms.ACCUSATION.correct, 'reggie');
  assert.ok(Rooms.ACCUSATION.suspects.includes('reggie'));
  assert.equal(Rooms.ACCUSATION.suspects.length, 4);
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

test('every room provides exactly three hints', () => {
  for (const id of Rooms.ROOM_ORDER) {
    const hints = Rooms.ROOMS[id].hints;
    assert.ok(Array.isArray(hints), id + ' should have a hints array');
    assert.equal(hints.length, 3, id + ' should have 3 hints');
    hints.forEach((h) => assert.equal(typeof h, 'string'));
  }
});
