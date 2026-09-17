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
