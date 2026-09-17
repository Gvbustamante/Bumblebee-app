/**
 * Definición de modos y sub-modos de juego.
 * Los flags booleanos controlan qué muestra y qué evalúa el Game screen.
 */

export const MODES = {
  spellingBee: {
    id: 'spellingBee',
    label: 'Spelling Bee',
    emoji: '🐝',
    color: 'purple',
    wordsKey: 'SPELLING_BEE_WORDS',
    subModes: [
      {
        id: 'imageWord',
        label: 'Image + Word',
        description: 'See the picture and the word',
        emoji: '👀',
        preview: { showImg: true, showTxt: true, showLetters: false },
        showImage: true,
        showWord: true,
        showLetters: false,
        requireSpelling: false,
        requireReading: false,
      },
      {
        id: 'imageSpelling',
        label: 'Image + Spelling',
        description: 'See the picture, spell each letter, then read',
        emoji: '✏️',
        preview: { showImg: true, showTxt: false, showLetters: true },
        showImage: true,
        showWord: false,
        showLetters: true,
        requireSpelling: true,
        requireReading: true,
      },
      {
        id: 'imageOnly',
        label: 'Image Only',
        description: 'See the picture, say the word',
        emoji: '🖼️',
        preview: { showImg: true, showTxt: false, showLetters: false },
        showImage: true,
        showWord: false,
        showLetters: false,
        requireSpelling: false,
        requireReading: true,
      },
    ],
  },
  bumblebee: {
    id: 'bumblebee',
    label: 'Bumblebee',
    emoji: '🌸',
    color: 'pink',
    wordsKey: 'BUMBLEBEE_WORDS',
    subModes: [
      {
        id: 'imageWord',
        label: 'Image + Word',
        description: 'See the picture and read the word',
        emoji: '📖',
        preview: { showImg: true, showTxt: true, showLetters: false },
        showImage: true,
        showWord: true,
        showLetters: false,
        requireSpelling: false,
        requireReading: true,
      },
      {
        id: 'imageOnly',
        label: 'Image Only',
        description: 'See the picture, say what it is',
        emoji: '🖼️',
        preview: { showImg: true, showTxt: false, showLetters: false },
        showImage: true,
        showWord: false,
        showLetters: false,
        requireSpelling: false,
        requireReading: true,
      },
    ],
  },
}

export function getSubMode(modeId, subModeId) {
  const mode = MODES[modeId]
  return mode?.subModes.find(s => s.id === subModeId) || null
}

export function getInitialPhase(sub) {
  if (sub.requireSpelling) return 'spelling'
  if (sub.requireReading) return 'reading'
  return 'familiarize'
}

export function getNextPhase(current, sub) {
  if (current === 'spelling' && sub.requireReading) return 'reading'
  if (current === 'familiarize') return null
  return 'result'
}
