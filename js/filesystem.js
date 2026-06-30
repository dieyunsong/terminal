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
  if (!srcParent) return { success: false, error: 'Cannot move the root.' };
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
  if (!parent) return { success: false, error: 'Cannot delete the root.' };
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
