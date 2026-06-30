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
