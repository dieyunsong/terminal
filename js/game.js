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
