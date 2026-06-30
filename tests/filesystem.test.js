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

test('rm -r / fails gracefully instead of crashing', () => {
  const fs = sampleFs();
  const result = FS.rm(fs, [], '/', true);
  assert.equal(result.success, false);
  assert.equal(typeof result.error, 'string');
});

test('mv / fails gracefully instead of crashing', () => {
  const fs = sampleFs();
  const result = FS.mv(fs, [], '/', 'somewhere');
  assert.equal(result.success, false);
  assert.equal(typeof result.error, 'string');
});
