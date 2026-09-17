const KEY = 'sbk-progress'

function blankGarden() { return { flowers: 0, bees: 0 } }
function blankSub() { return { words: {}, garden: blankGarden() } }

function blank() {
  return {
    version: 2,
    studentName: '',
    stars: 0,
    spellingBee: {
      imageWord: blankSub(),
      imageSpelling: blankSub(),
      imageOnly: blankSub(),
    },
    bumblebee: {
      imageWord: blankSub(),
      imageOnly: blankSub(),
    },
  }
}

function load() {
  try {
    const r = localStorage.getItem(KEY)
    if (!r) return blank()
    const d = JSON.parse(r)
    return d.version >= 2 ? d : migrate(d)
  } catch { return blank() }
}

function migrate(d) {
  const v2 = blank()
  v2.studentName = d.studentName || ''
  v2.stars = d.stars || 0
  if (d.spellingBee) {
    v2.spellingBee.imageSpelling = {
      words: d.spellingBee.words || {},
      garden: d.spellingBee.garden || blankGarden(),
    }
  }
  if (d.bumblebee) {
    v2.bumblebee.imageWord = {
      words: d.bumblebee.words || {},
      garden: d.bumblebee.garden || blankGarden(),
    }
  }
  save(v2)
  return v2
}

function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch {} }

function getSub(d, mode, subMode) {
  return d[mode]?.[subMode] || blankSub()
}

export function getStudentName() { return load().studentName || '' }
export function setStudentName(n) { const d = load(); d.studentName = n; save(d) }

export function getStars() { return load().stars || 0 }
export function addStars(n) { const d = load(); d.stars = (d.stars || 0) + n; save(d); return d.stars }

export function recordAttempt(mode, subMode, word, attempt) {
  const d = load()
  if (!d[mode]) return
  if (!d[mode][subMode]) d[mode][subMode] = blankSub()
  const sub = d[mode][subMode]
  if (!sub.words[word]) sub.words[word] = { attempts: [] }
  sub.words[word].attempts.push({ ...attempt, date: new Date().toISOString() })
  if (sub.words[word].attempts.length > 20) sub.words[word].attempts = sub.words[word].attempts.slice(-20)
  save(d)
}

export function getMastery(mode, subMode, word) {
  const sub = getSub(load(), mode, subMode)
  const wd = sub.words?.[word]
  if (!wd || !wd.attempts.length) return -1
  const recent = wd.attempts.slice(-5)
  let t = 0, ok = 0
  for (const a of recent) {
    if (a.letterResults) for (const r of a.letterResults) { t++; if (r) ok++ }
    if (a.wordCorrect !== undefined) { t++; if (a.wordCorrect) ok++ }
  }
  return t ? Math.round((ok / t) * 100) : 0
}

export function getLetterMastery(mode, subMode, word) {
  const sub = getSub(load(), mode, subMode)
  const wd = sub.words?.[word]
  if (!wd) return word.split('').map(() => -1)
  const recent = wd.attempts.slice(-5)
  return word.split('').map((_, i) => {
    let ok = 0, t = 0
    for (const a of recent) {
      if (a.letterResults?.[i] !== undefined) { t++; if (a.letterResults[i]) ok++ }
    }
    return t ? Math.round((ok / t) * 100) : -1
  })
}

export function getWeakWords(mode, subMode, words) {
  return words.filter(w => { const m = getMastery(mode, subMode, w.word); return m >= 0 && m < 60 })
}

export function getWordStats(mode, subMode) {
  const sub = getSub(load(), mode, subMode)
  let practiced = 0, mastered = 0, weak = 0, total = 0
  for (const [word, wd] of Object.entries(sub.words)) {
    if (wd.attempts.length) {
      practiced++; total += wd.attempts.length
      const m = getMastery(mode, subMode, word)
      if (m >= 80) mastered++
      else if (m >= 0 && m < 60) weak++
    }
  }
  return { practiced, mastered, weak, total }
}

export function getModeStats(mode) {
  const d = load()
  const modeData = d[mode]
  if (!modeData) return { practiced: 0, mastered: 0, weak: 0, total: 0 }
  const practiced = new Set()
  let total = 0
  for (const [, sub] of Object.entries(modeData)) {
    if (typeof sub !== 'object' || !sub.words) continue
    for (const [word, wd] of Object.entries(sub.words)) {
      if (wd.attempts?.length) { practiced.add(word); total += wd.attempts.length }
    }
  }
  let mastered = 0, weak = 0
  for (const word of practiced) {
    let best = -1
    for (const [subMode, sub] of Object.entries(modeData)) {
      if (typeof sub !== 'object' || !sub.words) continue
      const m = getMastery(mode, subMode, word)
      if (m > best) best = m
    }
    if (best >= 80) mastered++
    else if (best >= 0 && best < 60) weak++
  }
  return { practiced: practiced.size, mastered, weak, total }
}

export function addFlower(mode, subMode) {
  const d = load()
  if (!d[mode]?.[subMode]) return blankGarden()
  d[mode][subMode].garden.flowers++
  if (d[mode][subMode].garden.flowers % 5 === 0) d[mode][subMode].garden.bees++
  save(d)
  return d[mode][subMode].garden
}

export function getGarden(mode, subMode) {
  if (subMode) return getSub(load(), mode, subMode).garden || blankGarden()
  const d = load()
  const modeData = d[mode]
  if (!modeData) return blankGarden()
  let flowers = 0, bees = 0
  for (const [, sub] of Object.entries(modeData)) {
    if (typeof sub !== 'object' || !sub.garden) continue
    flowers += sub.garden.flowers || 0
    bees += sub.garden.bees || 0
  }
  return { flowers, bees }
}

export function resetProgress() { localStorage.removeItem(KEY) }
