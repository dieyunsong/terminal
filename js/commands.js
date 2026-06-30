(function () {
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
})();
