(function () {
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
})();
