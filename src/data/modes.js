export const MODES = {
  spellingBee: {
    id: 'spellingBee',
    label: 'Spelling Bee',
    emoji: '🐝',
    color: 'purple',
    subtitle: 'Spell + Read',
    subtitleEs: 'Deletrea + Lee',
    wordsKey: 'SPELLING_BEE_WORDS',
    subModes: [
      {
        id: 'imageWord',
        label: 'Image + Word',
        labelEs: 'Imagen + Palabra',
        description: 'See the picture and the word',
        descriptionEs: 'Ve la imagen y la palabra',
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
        labelEs: 'Imagen + Deletreo',
        description: 'See the picture, spell each letter, then read',
        descriptionEs: 'Ve la imagen, deletrea cada letra y lee',
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
        labelEs: 'Solo Imagen',
        description: 'See the picture, say the word',
        descriptionEs: 'Ve la imagen, di la palabra',
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
    subtitle: 'Read the word',
    subtitleEs: 'Lee la palabra',
    wordsKey: 'BUMBLEBEE_WORDS',
    subModes: [
      {
        id: 'imageWord',
        label: 'Image + Word',
        labelEs: 'Imagen + Palabra',
        description: 'See the picture and read the word',
        descriptionEs: 'Ve la imagen y lee la palabra',
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
        labelEs: 'Solo Imagen',
        description: 'See the picture, say what it is',
        descriptionEs: 'Ve la imagen, di qué es',
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
