const KEY = 'sbk-progress'

function load() {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : blank() }
  catch { return blank() }
}
function blank() {
  return {
    studentName: '',
    stars: 0,
    spellingBee: { words: {}, garden: { flowers: 0, bees: 0 } },
    bumblebee:   { words: {}, garden: { flowers: 0, bees: 0 } },
  }
}
function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch {} }

export function getStudentName() { return load().studentName || '' }
export function setStudentName(n) { const d = load(); d.studentName = n; save(d) }

export function getStars() { return load().stars || 0 }
export function addStars(n) { const d = load(); d.stars = (d.stars || 0) + n; save(d); return d.stars }

export function recordAttempt(mode, word, attempt) {
  const d = load(), m = d[mode]
  if (!m.words[word]) m.words[word] = { attempts: [] }
  m.words[word].attempts.push({ ...attempt, date: new Date().toISOString() })
  if (m.words[word].attempts.length > 20) m.words[word].attempts = m.words[word].attempts.slice(-20)
  save(d)
}

export function getMastery(mode, word) {
  const wd = load()[mode]?.words?.[word]
  if (!wd || !wd.attempts.length) return -1
  const recent = wd.attempts.slice(-5)
  if (mode === 'spellingBee') {
    let t = 0, ok = 0
    for (const a of recent) {
      if (a.letterResults) for (const r of a.letterResults) { t++; if (r) ok++ }
      if (a.wordCorrect !== undefined) { t++; if (a.wordCorrect) ok++ }
    }
    return t ? Math.round((ok / t) * 100) : 0
  }
  const ok = recent.filter(a => a.wordCorrect).length
  return Math.round((ok / recent.length) * 100)
}

export function getLetterMastery(word) {
  const wd = load().spellingBee?.words?.[word]
  if (!wd) return word.split('').map(() => -1)
  const recent = wd.attempts.slice(-5)
  return word.split('').map((_, i) => {
    let ok = 0, t = 0
    for (const a of recent) { if (a.letterResults?.[i] !== undefined) { t++; if (a.letterResults[i]) ok++ } }
    return t ? Math.round((ok / t) * 100) : -1
  })
}

export function getWeakWords(mode, words) {
  return words.filter(w => { const m = getMastery(mode, w.word); return m >= 0 && m < 60 })
}

export function getWordStats(mode) {
  const d = load()[mode]
  if (!d) return { practiced: 0, mastered: 0, weak: 0, total: 0 }
  let practiced = 0, mastered = 0, weak = 0, total = 0
  for (const [word, wd] of Object.entries(d.words)) {
    if (wd.attempts.length) {
      practiced++; total += wd.attempts.length
      const m = getMastery(mode, word)
      if (m >= 80) mastered++
      else if (m >= 0 && m < 60) weak++
    }
  }
  return { practiced, mastered, weak, total }
}

export function addFlower(mode) {
  const d = load()
  d[mode].garden.flowers++
  if (d[mode].garden.flowers % 5 === 0) d[mode].garden.bees++
  save(d)
  return d[mode].garden
}

export function getGarden(mode) { return load()[mode]?.garden || { flowers: 0, bees: 0 } }
export function getAllWordData(mode) { return load()[mode]?.words || {} }
export function resetProgress() { localStorage.removeItem(KEY) }
