export const SPELLING_BEE_WORDS = [
  { word: 'CAT', emoji: '🐱' },
  { word: 'DOG', emoji: '🐶' },
  { word: 'SUN', emoji: '☀️' },
  { word: 'PEN', emoji: '🖊️' },
  { word: 'HAT', emoji: '🎩' },
  { word: 'BED', emoji: '🛏️' },
  { word: 'CUP', emoji: '🥤' },
  { word: 'FAN', emoji: '🌀' },
  { word: 'MAP', emoji: '🗺️' },
  { word: 'BOX', emoji: '📦' },
  { word: 'BUS', emoji: '🚌' },
  { word: 'RUG', emoji: '🟫' },
  { word: 'JAM', emoji: '🍯' },
  { word: 'NET', emoji: '🥅' },
  { word: 'TOP', emoji: '🔝' },
]

export const BUMBLEBEE_WORDS = [
  { word: 'BALL', emoji: '⚽' },
  { word: 'TREE', emoji: '🌳' },
  { word: 'FISH', emoji: '🐟' },
  { word: 'STAR', emoji: '⭐' },
  { word: 'BOOK', emoji: '📖' },
  { word: 'HOUSE', emoji: '🏠' },
  { word: 'APPLE', emoji: '🍎' },
  { word: 'BIRD', emoji: '🐦' },
  { word: 'CAKE', emoji: '🎂' },
  { word: 'MOON', emoji: '🌙' },
]

export function getBlocks(words, size = 5) {
  const blocks = []
  for (let i = 0; i < words.length; i += size) {
    blocks.push(words.slice(i, i + size))
  }
  return blocks
}
