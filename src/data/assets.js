/**
 * SISTEMA DE IMÁGENES — Spelling Bee Kids
 *
 * Todas las imágenes van en public/images/ con fondo transparente (PNG).
 * Para agregar una imagen: pon el archivo en la carpeta correspondiente
 * y agrega la ruta aquí.
 *
 * El componente AssetImage usa el emoji como fallback si la imagen no existe.
 */

export const IMG_BASE = '/images'

/**
 * Imágenes de palabras — se muestran SOLO en modos de juego.
 * Key = palabra en minúsculas, value = ruta relativa a IMG_BASE.
 */
export const WORD_IMAGES = {
  // cat: 'words/cat.png',
  // dog: 'words/dog.png',
  // sun: 'words/sun.png',
  // ... agrega aquí tus imágenes de palabras
}

/**
 * Mascota (abejita) en diferentes estados.
 * Se usa en splash, loading, home, game feedback.
 */
export const MASCOT = {
  happy:    'mascots/bee-happy.png',
  thinking: 'mascots/bee-thinking.png',
  cheering: 'mascots/bee-cheering.png',
  waving:   'mascots/bee-waving.png',
  sad:      'mascots/bee-sad.png',
}

/**
 * Amigos de la abejita.
 * Cada amigo puede tener múltiples poses/estados.
 */
export const CHARACTERS = {
  // ladybug:    { happy: 'characters/ladybug-happy.png' },
  // butterfly:  { happy: 'characters/butterfly-happy.png' },
  // caterpillar:{ happy: 'characters/caterpillar-happy.png' },
}

/**
 * Qué mascota/personaje se muestra en cada pantalla.
 * mascot = key de MASCOT, character = key de CHARACTERS, mood = estado.
 */
export const SCREEN_ASSETS = {
  splash:        { mascot: 'happy',    character: null },
  loading:       { mascot: 'thinking', character: null },
  home:          { mascot: 'waving',   character: null },
  gameCorrect:   { mascot: 'cheering', character: null },
  gameWrong:     { mascot: 'sad',      character: null },
  blockComplete: { mascot: 'happy',    character: null },
  rewards:       { mascot: 'cheering', character: null },
}

export function getWordImageUrl(word) {
  const key = word.toLowerCase()
  if (WORD_IMAGES[key]) return `${IMG_BASE}/${WORD_IMAGES[key]}`
  return null
}

export function getMascotUrl(state) {
  if (MASCOT[state]) return `${IMG_BASE}/${MASCOT[state]}`
  return null
}

export function getCharacterUrl(name, mood = 'happy') {
  if (CHARACTERS[name]?.[mood]) return `${IMG_BASE}/${CHARACTERS[name][mood]}`
  return null
}
