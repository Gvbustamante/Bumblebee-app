const ctx = () => {
  if (!sounds._ctx) sounds._ctx = new (window.AudioContext || window.webkitAudioContext)()
  return sounds._ctx
}

function tone(freq, dur, type = 'sine', vol = 0.3) {
  if (sounds._muteFx) return
  try {
    const c = ctx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = vol
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur)
    o.connect(g).connect(c.destination)
    o.start()
    o.stop(c.currentTime + dur)
  } catch {}
}

const sounds = {
  _ctx: null,
  _muteFx: false,
  _muteVoice: false,

  get muteFx() { return this._muteFx },
  set muteFx(v) { this._muteFx = v },

  get muteVoice() { return this._muteVoice },
  set muteVoice(v) { this._muteVoice = v },

  correct() {
    tone(523, 0.12)
    setTimeout(() => tone(659, 0.12), 100)
    setTimeout(() => tone(784, 0.18), 200)
  },

  wrong() {
    tone(200, 0.15, 'square', 0.2)
    setTimeout(() => tone(160, 0.2, 'square', 0.2), 120)
  },

  next() {
    tone(440, 0.08)
    setTimeout(() => tone(554, 0.08), 80)
  },

  learned() {
    tone(523, 0.1)
    setTimeout(() => tone(659, 0.1), 100)
    setTimeout(() => tone(784, 0.1), 200)
    setTimeout(() => tone(1047, 0.25), 300)
  },

  blockComplete() {
    const notes = [523, 659, 784, 1047, 784, 1047]
    notes.forEach((f, i) => setTimeout(() => tone(f, 0.15), i * 120))
  },

  kidsCheer() {
    if (this._muteFx) return
    try {
      const c = ctx()
      const now = c.currentTime
      const voices = [
        { f: 800, mod: 6, dur: 0.9, delay: 0 },
        { f: 950, mod: 7, dur: 0.85, delay: 0.05 },
        { f: 700, mod: 5, dur: 0.95, delay: 0.08 },
        { f: 1100, mod: 8, dur: 0.8, delay: 0.12 },
        { f: 850, mod: 6.5, dur: 0.88, delay: 0.03 },
      ]
      voices.forEach(v => {
        const o = c.createOscillator()
        const g = c.createGain()
        const lfo = c.createOscillator()
        const lfoG = c.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(v.f * 0.85, now + v.delay)
        o.frequency.linearRampToValueAtTime(v.f, now + v.delay + 0.15)
        o.frequency.linearRampToValueAtTime(v.f * 1.1, now + v.delay + v.dur * 0.5)
        o.frequency.linearRampToValueAtTime(v.f * 0.95, now + v.delay + v.dur)
        lfo.type = 'sine'
        lfo.frequency.value = v.mod
        lfoG.gain.value = 50
        lfo.connect(lfoG).connect(o.frequency)
        lfo.start(now + v.delay)
        lfo.stop(now + v.delay + v.dur)
        g.gain.setValueAtTime(0, now + v.delay)
        g.gain.linearRampToValueAtTime(0.12, now + v.delay + 0.08)
        g.gain.setValueAtTime(0.12, now + v.delay + v.dur * 0.7)
        g.gain.exponentialRampToValueAtTime(0.001, now + v.delay + v.dur)
        o.connect(g).connect(c.destination)
        o.start(now + v.delay)
        o.stop(now + v.delay + v.dur)
      })
    } catch {}
  },

  tap() {
    tone(600, 0.05, 'sine', 0.15)
  },

  speak(text, lang = 'en') {
    if (this._muteVoice) return
    try {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text.toLowerCase())
      u.lang = lang === 'es' ? 'es-ES' : 'en-US'
      u.rate = 0.85
      u.pitch = 1.1
      window.speechSynthesis.speak(u)
    } catch {}
  },

  speakLetter(letter, lang = 'en') {
    if (this._muteVoice) return
    try {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(letter.toUpperCase())
      u.lang = lang === 'es' ? 'es-ES' : 'en-US'
      u.rate = 0.7
      u.pitch = 1.2
      window.speechSynthesis.speak(u)
    } catch {}
  },
}

export default sounds
