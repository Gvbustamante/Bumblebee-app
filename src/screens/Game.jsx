import { useState, useEffect, useRef, useCallback } from 'react'
import { MODES, getSubMode, getInitialPhase, getNextPhase } from '../data/modes'
import { getWordImageUrl } from '../data/assets'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { recordAttempt, addFlower, addStars } from '../lib/db'
import sounds from '../lib/sounds'

const MODE_THEME = {
  purple: { modeBg: '#F2E8FF', accent: '#57358F', gradient: 'linear-gradient(135deg, #9B6DDF, #7B4FBF)' },
  pink: { modeBg: '#FFF1F5', accent: '#C0457B', gradient: 'linear-gradient(135deg, #F58BB5, #E06090)' },
  blue: { modeBg: '#EEF7FF', accent: '#2E78B0', gradient: 'linear-gradient(135deg, #72B7E8, #5098CC)' },
  amber: { modeBg: '#FFFBEA', accent: '#A07B00', gradient: 'linear-gradient(135deg, #FFD84D, #E8C030)' },
  indigo: { modeBg: '#F1F2FF', accent: '#4B48A0', gradient: 'linear-gradient(135deg, #7B78D8, #5955B8)' },
}

function SwipeCard({ onSwipeRight, onSwipeLeft, enabled, children }) {
  const cardRef = useRef(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const swiping = useRef(false)
  const [dx, setDx] = useState(0)
  const [exiting, setExiting] = useState(null)

  const onTouchStart = useCallback(e => {
    if (!enabled) return
    const t = e.touches[0]
    startX.current = t.clientX
    startY.current = t.clientY
    currentX.current = 0
    swiping.current = false
  }, [enabled])

  const onTouchMove = useCallback(e => {
    if (!enabled) return
    const t = e.touches[0]
    const diffX = t.clientX - startX.current
    const diffY = t.clientY - startY.current
    if (!swiping.current && Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      swiping.current = true
    }
    if (swiping.current) {
      e.preventDefault()
      currentX.current = diffX
      setDx(diffX)
    }
  }, [enabled])

  const onTouchEnd = useCallback(() => {
    if (!enabled || !swiping.current) return
    const threshold = 80
    if (currentX.current > threshold) {
      setExiting('right')
      setTimeout(() => { setExiting(null); setDx(0); onSwipeRight() }, 250)
    } else if (currentX.current < -threshold) {
      setExiting('left')
      setTimeout(() => { setExiting(null); setDx(0); onSwipeLeft() }, 250)
    } else {
      setDx(0)
    }
    swiping.current = false
    currentX.current = 0
  }, [enabled, onSwipeRight, onSwipeLeft])

  const rotation = exiting ? (exiting === 'right' ? 15 : -15) : dx * 0.08
  const translateX = exiting ? (exiting === 'right' ? 400 : -400) : dx
  const opacity = exiting ? 0 : 1
  const overlayOpacity = Math.min(Math.abs(dx) / 120, 0.7)
  const showRight = dx > 30
  const showLeft = dx < -30

  return (
    <div
      ref={cardRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-full"
      style={{
        transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
        opacity,
        transition: exiting || dx === 0 ? 'transform 0.25s ease-out, opacity 0.25s ease-out' : 'none',
        touchAction: 'pan-y',
      }}
    >
      {enabled && showRight && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="font-extrabold text-2xl px-6 py-3 rounded-2xl shadow-lg"
            style={{ opacity: overlayOpacity, transform: 'rotate(-15deg)', background: '#8ED36B', color: '#fff', border: '4px solid #6BBF4A' }}>
            ✓
          </div>
        </div>
      )}
      {enabled && showLeft && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="font-extrabold text-2xl px-6 py-3 rounded-2xl shadow-lg"
            style={{ opacity: overlayOpacity, transform: 'rotate(15deg)', background: '#FFD84D', color: '#A07B00', border: '4px solid #E8C030' }}>
            →
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

export default function Game({ config, onExit, onExitHome }) {
  const { mode, subMode: subModeId, block, blockIndex, isChallenge } = config
  const sub = getSubMode(mode, subModeId)
  const { t, lang } = useLang()
  const { session, profile } = useAuth()
  const uid = session?.user?.id
  const imgSize = profile?.image_size || 'medium'
  const voiceLang = profile?.voice_lang || 'en'
  const modeDef = MODES[mode]
  const mc = MODE_THEME[modeDef?.color] || MODE_THEME.purple

  const [queue, setQueue] = useState([...block])
  const [phase, setPhase] = useState(() => getInitialPhase(sub))
  const [letterIdx, setLetterIdx] = useState(0)
  const [letterErrors, setLetterErrors] = useState({})
  const [wordReadErrors, setWordReadErrors] = useState(0)
  const [scrambled, setScrambled] = useState([])
  const [placed, setPlaced] = useState([])
  const [sortErrors, setSortErrors] = useState(0)
  const [shakeIdx, setShakeIdx] = useState(null)
  const [dragLetter, setDragLetter] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [blockDone, setBlockDone] = useState(false)
  const [blockResults, setBlockResults] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [currentResult, setCurrentResult] = useState(null)
  const timerRef = useRef(null)
  const fbRef = useRef(null)

  const word = queue[0]
  const letters = word?.word.split('') || []
  const total = block.length
  const done = total - queue.length

  function shuffleLetters(arr) {
    const a = arr.map((l, i) => ({ letter: l, origIdx: i }))
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    if (a.length > 1 && a.every((item, idx) => item.origIdx === idx)) {
      [a[0], a[1]] = [a[1], a[0]]
    }
    return a
  }

  useEffect(() => {
    if (phase === 'letterSort' && word) {
      setScrambled(shuffleLetters(letters))
      setPlaced([])
      setSortErrors(0)
      setShakeIdx(null)
    }
  }, [phase, word?.word])

  useEffect(() => {
    if (blockDone || showResult) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    return () => clearInterval(timerRef.current)
  }, [startTime, blockDone, showResult])

  useEffect(() => {
    if (!word || blockDone || showResult) return
    if (sub.requireSpelling) return
    const t = setTimeout(() => sounds.speak(word.word, voiceLang), 400)
    return () => clearTimeout(t)
  }, [word?.word, blockDone, showResult])

  useEffect(() => {
    if (phase !== 'spelling' || !letters[letterIdx]) return
    const t = setTimeout(() => sounds.speakLetter(letters[letterIdx], voiceLang), 200)
    return () => clearTimeout(t)
  }, [letterIdx, phase])

  function resetForNextWord() {
    setPhase(getInitialPhase(sub))
    setLetterIdx(0)
    setLetterErrors({})
    setWordReadErrors(0)
    setFeedback(null)
    setShowResult(false)
    setCurrentResult(null)
    setDragLetter(null)
    setStartTime(Date.now())
    setElapsed(0)
    clearTimeout(fbRef.current)
  }

  function fb(type, ms, cb) {
    setFeedback(type)
    clearTimeout(fbRef.current)
    fbRef.current = setTimeout(() => { setFeedback(null); cb?.() }, ms)
  }

  function handleLetterSortTap(item, scrambledIdx) {
    const nextCorrect = letters[placed.length]
    if (item.letter === nextCorrect) {
      sounds.correct()
      const newPlaced = [...placed, item]
      setPlaced(newPlaced)
      setScrambled(s => s.filter((_, i) => i !== scrambledIdx))
      if (newPlaced.length === letters.length) {
        setTimeout(() => {
          sounds.learned()
          completeLetterSort()
        }, 400)
      }
    } else {
      sounds.wrong()
      setSortErrors(e => e + 1)
      setShakeIdx(scrambledIdx)
      setTimeout(() => setShakeIdx(null), 500)
    }
  }

  function completeLetterSort() {
    clearInterval(timerRef.current)
    const time = Date.now() - startTime
    const allPerfect = sortErrors === 0
    if (uid) {
      recordAttempt(uid, mode, subModeId, word.word, { wordCorrect: true, timeMs: time })
      addStars(uid, mode, allPerfect ? 3 : 1)
    }
    setBlockResults(p => [...p, {
      word: word.word, emoji: word.emoji,
      perfect: allPerfect, starsEarned: allPerfect ? 3 : 1, time,
    }])
    const next = queue.slice(1)
    if (next.length === 0) {
      if (uid) addFlower(uid, mode, subModeId)
      sounds.blockComplete()
      setTimeout(() => sounds.kidsCheer(), 300)
      setBlockDone(true)
    } else {
      setQueue(next)
      resetForNextWord()
    }
  }

  function handleCorrect() {
    if (feedback) return
    if (phase === 'spelling') {
      sounds.correct()
      fb('correct', 400, () => {
        if (letterIdx >= letters.length - 1) {
          const next = getNextPhase('spelling', sub)
          if (next && next !== 'result') {
            setPhase(next)
            setTimeout(() => sounds.speak(word.word, voiceLang), 300)
          } else completeAttempt(true)
        } else {
          setLetterIdx(i => i + 1)
        }
      })
    } else if (phase === 'reading') {
      sounds.correct()
      completeAttempt(true)
    }
  }

  function handleIncorrect() {
    if (feedback) return
    sounds.wrong()
    if (phase === 'spelling') {
      setLetterErrors(p => ({ ...p, [letterIdx]: (p[letterIdx] || 0) + 1 }))
      fb('wrong', 600, () => {
        sounds.speakLetter(letters[letterIdx], voiceLang)
      })
    } else if (phase === 'reading') {
      setWordReadErrors(e => e + 1)
      fb('wrong', 600, () => {
        sounds.speak(word.word, voiceLang)
      })
    }
  }

  function handleSkip() {
    sounds.next()
    setQueue(q => [...q.slice(1), q[0]])
    resetForNextWord()
  }

  function completeAttempt(wordOk) {
    clearInterval(timerRef.current)
    const time = Date.now() - startTime
    const lr = sub.requireSpelling ? letters.map((_, i) => !(letterErrors[i] || 0)) : undefined
    const allPerfect = wordOk && (!lr || lr.every(Boolean)) && !wordReadErrors

    if (uid) {
      recordAttempt(uid, mode, subModeId, word.word, {
        letterResults: lr, wordCorrect: wordOk, timeMs: time,
      })
    }

    setCurrentResult({ lr, allPerfect, time, wordOk })
    setShowResult(true)
  }

  const handleLearned = useCallback(() => {
    if (!currentResult) return
    sounds.learned()
    const earned = currentResult.allPerfect ? 3 : 1
    if (uid) addStars(uid, mode, earned)
    setBlockResults(p => [...p, {
      word: word.word, emoji: word.emoji,
      perfect: currentResult.allPerfect, starsEarned: earned, time: currentResult.time,
    }])
    const next = queue.slice(1)
    if (next.length === 0) {
      if (uid) addFlower(uid, mode, subModeId)
      sounds.blockComplete()
      setTimeout(() => sounds.kidsCheer(), 300)
      setBlockDone(true)
    } else {
      setQueue(next)
      resetForNextWord()
    }
  }, [currentResult, uid, mode, subModeId, word, queue])

  const handleNotYet = useCallback(() => {
    sounds.next()
    setQueue(q => [...q.slice(1), q[0]])
    resetForNextWord()
  }, [])

  const handleFamiliarizeLearned = useCallback(() => {
    sounds.learned()
    const time = Date.now() - startTime
    if (uid) {
      recordAttempt(uid, mode, subModeId, word.word, { wordCorrect: true, timeMs: time })
    }
    setBlockResults(p => [...p, { word: word.word, emoji: word.emoji, perfect: true, starsEarned: 0, time }])
    const next = queue.slice(1)
    if (next.length === 0) {
      if (uid) addFlower(uid, mode, subModeId)
      sounds.blockComplete()
      setTimeout(() => sounds.kidsCheer(), 300)
      setBlockDone(true)
    } else {
      setQueue(next)
      resetForNextWord()
    }
  }, [uid, mode, subModeId, word, queue, startTime])

  useEffect(() => {
    if (!showResult || !currentResult) return
    if (currentResult.allPerfect) {
      const t = setTimeout(handleLearned, 2000)
      return () => clearTimeout(t)
    }
    if (blockIndex === -1) {
      const t = setTimeout(handleNotYet, 2500)
      return () => clearTimeout(t)
    }
  }, [showResult, currentResult, blockIndex, handleLearned, handleNotYet])

  const handleFamiliarizeNotYet = useCallback(() => {
    sounds.next()
    setQueue(q => [...q.slice(1), q[0]])
    resetForNextWord()
  }, [])

  const fmt = ms => `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) / 100)}s`

  const IMG_SIZES = { small: 'max-h-[18vh] max-w-[50vw]', medium: 'max-h-[28vh] max-w-[65vw]', large: 'max-h-[40vh] max-w-[80vw]' }

  function Img({ w, className = '' }) {
    const url = w.image_url || getWordImageUrl(w.word)
    if (url) return <img src={url} alt={w.word} className={`object-contain ${IMG_SIZES[imgSize]} ${className}`} />
    return <span className={className}>{w.emoji}</span>
  }

  function ProgressBar() {
    const pct = total > 0 ? (done / total) * 100 : 0
    return (
      <div className="flex items-center gap-2 flex-1 mx-3">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#E8E0F0' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8ED36B, #6BBF4A)' }} />
        </div>
        <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#9B6DDF' }}>{done}/{total}</span>
      </div>
    )
  }

  if (!sub) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F5FF' }}>
      <button onClick={onExit} className="font-bold" style={{ color: mc.accent }}>← {t('home')}</button>
    </div>
  )

  if (blockDone) {
    const totalStars = blockResults.reduce((s, r) => s + r.starsEarned, 0)
    const totalTimeMs = blockResults.reduce((s, r) => s + r.time, 0)
    const perfectCount = blockResults.filter(r => r.perfect).length
    const totalTimeFmt = `${Math.floor(totalTimeMs / 60000)}:${String(Math.floor(totalTimeMs / 1000) % 60).padStart(2, '0')}`
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-pop relative" style={{ background: '#F8F5FF' }}>
        <div className="absolute top-4 right-4 z-10"><MuteBtn mc={mc} /></div>
        <img src="/images/block-complete.webp" alt="" className="w-72 mb-3 animate-float" style={{ filter: 'drop-shadow(0 8px 20px rgba(155,109,223,0.2))' }} />
        <h1 className="text-2xl font-extrabold" style={{ color: '#57358F' }}>{t('blockComplete')}</h1>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-2xl animate-sparkle">⭐</span>
          <span className="text-xl font-extrabold" style={{ color: '#D4A017' }}>+{totalStars}</span>
        </div>

        <div className="hidden lg:grid grid-cols-3 gap-3 w-full max-w-lg mt-4">
          <div className="rounded-2xl p-3 text-center" style={{ background: '#FFFBEA', border: '2px solid #FFD84D' }}>
            <div className="text-xl mb-0.5">⏱️</div>
            <div className="text-lg font-extrabold" style={{ color: '#A07B00' }}>{totalTimeFmt}</div>
            <div className="text-[10px] font-bold" style={{ color: '#D4A017' }}>{t('time')}</div>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: '#E8F5E0', border: '2px solid #8ED36B' }}>
            <div className="text-xl mb-0.5">💯</div>
            <div className="text-lg font-extrabold" style={{ color: '#4A8C2A' }}>{perfectCount}/{total}</div>
            <div className="text-[10px] font-bold" style={{ color: '#6BAF4A' }}>{t('perfect')}</div>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: '#F2E8FF', border: '2px solid #D0B8F0' }}>
            <div className="text-xl mb-0.5">⭐</div>
            <div className="text-lg font-extrabold" style={{ color: '#57358F' }}>{totalStars}</div>
            <div className="text-[10px] font-bold" style={{ color: '#9B6DDF' }}>{t('totalStars')}</div>
          </div>
        </div>

        <div className="bg-brand-card rounded-2xl shadow-card p-4 w-full max-w-sm lg:max-w-lg mt-5 space-y-1.5" style={{ border: '1px solid #E8E0F0' }}>
          {blockResults.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < blockResults.length - 1 ? '1px solid #F3F0F8' : 'none' }}>
              <span className="text-2xl w-8 text-center">{r.emoji}</span>
              <span className="font-bold flex-1 text-sm" style={{ color: '#57358F' }}>{r.word}</span>
              {r.perfect && <span className="text-lg animate-sparkle">⭐</span>}
              <span className="text-[11px] font-mono w-10 text-right" style={{ color: '#B0A0C0' }}>{fmt(r.time)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-sm lg:max-w-lg mt-6">
          <button
            onClick={onExitHome}
            className="flex-1 py-3.5 bg-brand-card rounded-2xl font-extrabold active:scale-95 transition-transform text-sm shadow-card"
            style={{ border: '2px solid #E8E0F0', color: '#B0A0C0' }}
          >
            🏠 {t('home')}
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3.5 bg-brand-card rounded-2xl font-extrabold active:scale-95 transition-transform text-sm shadow-card"
            style={{ border: `2px solid ${mc.modeBg}`, color: mc.accent }}
          >
            📚 {t('blocks')}
          </button>
          <button
            onClick={() => { setBlockDone(false); setQueue([...block]); setBlockResults([]); resetForNextWord() }}
            className="flex-1 py-3.5 text-white rounded-2xl font-extrabold active:scale-95 transition-transform text-sm"
            style={{ background: mc.gradient, boxShadow: `0 4px 14px ${mc.accent}40` }}
          >
            🔄 {t('again')}
          </button>
        </div>
      </div>
    )
  }

  if (showResult && currentResult) {
    const { lr, allPerfect, time: wordTime } = currentResult
    const earned = allPerfect ? 3 : 1
    const attempts = lr ? lr.filter(x => !x).length + 1 : wordReadErrors + 1
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-pop overflow-hidden" style={{ background: '#F8F5FF' }}>
        <div className="absolute top-4 right-4 z-10"><MuteBtn mc={mc} /></div>

        <div className="flex items-center gap-1 mb-2">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`text-3xl ${i < earned ? 'animate-sparkle' : 'opacity-30'}`}>⭐</span>
          ))}
        </div>

        <h2 className="text-2xl font-extrabold mb-4" style={{ color: '#57358F' }}>
          {allPerfect ? (lang === 'es' ? '¡Muy bien!' : 'Great job!') : (lang === 'es' ? '¡Buen intento!' : 'Good try!')}
        </h2>

        {sub.showImage && <Img w={word} className="text-[80px] mb-3" />}

        <h3 className="text-3xl font-extrabold tracking-wider mb-5" style={{ color: mc.accent }}>{word.word}</h3>

        <div className="flex items-center gap-4 mb-6">
          <div className="text-center px-4">
            <div className="text-xs font-bold mb-1" style={{ color: '#B0A0C0' }}>{lang === 'es' ? 'Tiempo' : 'Time'}</div>
            <div className="text-lg font-extrabold" style={{ color: '#57358F' }}>{fmt(wordTime)}</div>
          </div>
          <div className="w-px h-8" style={{ background: '#E8E0F0' }} />
          <div className="text-center px-4">
            <div className="text-xs font-bold mb-1" style={{ color: '#B0A0C0' }}>{lang === 'es' ? 'Intentos' : 'Attempts'}</div>
            <div className="text-lg font-extrabold" style={{ color: '#57358F' }}>{attempts}</div>
          </div>
          <div className="w-px h-8" style={{ background: '#E8E0F0' }} />
          <div className="text-center px-4">
            <div className="text-xs font-bold mb-1" style={{ color: '#B0A0C0' }}>{lang === 'es' ? 'Estrellas' : 'Stars'}</div>
            <div className="text-lg font-extrabold" style={{ color: '#D4A017' }}>+{earned}</div>
          </div>
        </div>

        <div className="w-full max-w-xs lg:max-w-sm">
          <button
            onClick={handleLearned}
            className="w-full py-4 text-white rounded-2xl font-extrabold active:scale-95 transition-transform text-base"
            style={{ background: 'linear-gradient(135deg, #7B4FBF, #57358F)', boxShadow: '0 4px 14px rgba(123,79,191,0.4)' }}
          >
            {lang === 'es' ? 'Siguiente palabra' : 'Next word'} →
          </button>
        </div>

        <div className="mt-3 text-xs font-bold" style={{ color: '#B0A0C0' }}>
          {queue.length} {t('remaining')}
        </div>
      </div>
    )
  }

  const isFamiliarize = phase === 'familiarize'
  const isSpellingPhase = phase === 'spelling'
  const isLetterSort = phase === 'letterSort'

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative" style={{ background: '#F8F5FF' }}>
      <div className="hidden lg:block fixed right-6 top-20 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-purple-100 p-4 max-h-[calc(100vh-120px)] overflow-y-auto z-40">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B6DDF' }}>{t('words')}</h3>
        {block.map((w, i) => {
          const isDone = i < done
          const isCurrent = i === done
          return (
            <div key={i} className={`flex items-center gap-2 py-1.5 text-sm ${isCurrent ? 'font-extrabold' : 'font-medium'}`}
              style={{ color: isDone ? '#8ED36B' : isCurrent ? mc.accent : '#B0A0C0', borderBottom: i < block.length - 1 ? '1px solid #F3F0F8' : 'none' }}>
              <span className="w-5 text-center">{isDone ? '✓' : isCurrent ? '▶' : `${i + 1}`}</span>
              <span>{w.emoji}</span>
              <span>{w.word}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center px-4 pt-4 pb-2 gap-2">
        <button
          onClick={onExit}
          className="w-9 h-9 flex items-center justify-center rounded-full font-bold active:scale-90 transition-transform shrink-0"
          style={{ background: '#F3F0F8', color: '#9B6DDF' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <ProgressBar />
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: '#FFFBEA' }}>
            <span className="text-sm">⭐</span>
            <span className="text-xs font-bold" style={{ color: '#D4A017' }}>{blockResults.reduce((s, r) => s + r.starsEarned, 0)}</span>
          </div>
          <MuteBtn mc={mc} />
          {isChallenge && (
            <div className="px-3 py-1 rounded-full font-mono font-bold text-sm" style={{ background: mc.modeBg, color: mc.accent }}>
              {fmt(elapsed)}
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-2">
        <span
          className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{
            background: isFamiliarize ? '#EEF7FF' : isLetterSort ? '#FFFBEA' : isSpellingPhase ? mc.modeBg : '#FFF1F5',
            color: isFamiliarize ? '#2E78B0' : isLetterSort ? '#A07B00' : isSpellingPhase ? mc.accent : '#C0457B',
          }}
        >
          {isFamiliarize ? `👀 ${t('lookAndLearn')}` :
           isLetterSort ? `🧩 ${t('sortLetters')}` :
           isSpellingPhase ? `🐝 ${t('spellLetters')}` :
           `📖 ${t('readWord')}`}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isLetterSort ? (
          <div
            className="flex flex-col items-center w-full"
            onTouchMove={(e) => {
              if (!dragLetter) return
              e.preventDefault()
              const touch = e.touches[0]
              setDragLetter(prev => prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null)
            }}
            onTouchEnd={() => {
              if (!dragLetter) return
              handleLetterSortTap(dragLetter.item, dragLetter.idx)
              setDragLetter(null)
            }}
          >
            {sub.showImage && (
              <div className="animate-float">
                <Img w={word} className="text-[80px]" />
              </div>
            )}

            <div className="flex gap-2.5 justify-center mt-4 min-h-[56px]">
              {letters.map((l, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl transition-all duration-200"
                  style={{
                    background: i < placed.length ? 'linear-gradient(135deg, #5B9FE8, #4A8BD4)' : '#EDE5F5',
                    border: i < placed.length ? 'none' : i === placed.length && dragLetter ? '2px solid #9B6DDF' : '2px dashed #D0C8E0',
                    color: i < placed.length ? '#FFFFFF' : '#D0C8E0',
                    boxShadow: i < placed.length ? '0 3px 10px rgba(91,159,232,0.3)' : 'none',
                  }}
                >
                  {i < placed.length ? placed[i].letter : ''}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              {scrambled.map((item, i) => (
                <button
                  key={`${item.origIdx}-${item.letter}`}
                  onClick={() => handleLetterSortTap(item, i)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    setDragLetter({ item, idx: i, x: touch.clientX, y: touch.clientY })
                  }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl transition-all duration-200 ${
                    shakeIdx === i ? 'animate-shake' : ''
                  }`}
                  style={{
                    background: shakeIdx === i ? '#FFF1F5' : '#F3F0F8',
                    border: shakeIdx === i ? '2px solid #F58BB5' : '2px solid #E8E0F0',
                    color: shakeIdx === i ? '#C0457B' : '#57358F',
                    opacity: dragLetter?.idx === i ? 0.3 : 1,
                    touchAction: 'none',
                  }}
                >
                  {item.letter}
                </button>
              ))}
            </div>

            {dragLetter && (
              <div
                className="fixed z-50 w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-xl pointer-events-none"
                style={{
                  left: dragLetter.x - 32,
                  top: dragLetter.y - 64,
                  background: mc.modeBg,
                  border: `3px solid ${mc.accent}`,
                  color: mc.accent,
                  transform: 'scale(1.15)',
                }}
              >
                {dragLetter.item.letter}
              </div>
            )}

            <p className="text-center mt-5 font-semibold text-sm" style={{ color: '#9B6DDF' }}>{t('tapInOrder')}</p>
          </div>
        ) : isFamiliarize ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-4xl font-extrabold text-center tracking-wider" style={{ color: mc.accent }}>{word.word}</p>
              <button onClick={() => sounds.speak(word.word, voiceLang)} className="active:scale-90 transition-transform" style={{ color: '#9B6DDF' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
              </button>
            </div>

            {sub.showImage && (
              <div className="animate-float">
                <Img w={word} className="text-[100px]" />
              </div>
            )}

            <p className="text-center mt-4 font-semibold text-sm" style={{ color: '#9B6DDF' }}>{t('lookAtWord')}</p>
          </div>
        ) : (
          <>
            {isSpellingPhase && sub.showWord && (
              <div className="mb-3">
                <p className="text-3xl font-extrabold tracking-wider text-center" style={{ color: mc.accent }}>{word.word}</p>
              </div>
            )}

            {phase === 'reading' && sub.showWord && (
              <div className="mb-3 flex items-center gap-2">
                <p className="text-4xl font-extrabold text-center tracking-wider" style={{ color: mc.accent }}>{word.word}</p>
                <button onClick={() => sounds.speak(word.word, voiceLang)} className="active:scale-90 transition-transform" style={{ color: '#9B6DDF' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                </button>
              </div>
            )}

            {phase === 'reading' && !sub.showWord && (
              <div className="mb-3">
                <p className="text-center font-bold text-lg" style={{ color: '#57358F' }}>{t('whatDoYouSee')}</p>
                <p className="text-center font-semibold text-sm mt-1" style={{ color: '#9B6DDF' }}>{t('sayTheWord')}</p>
              </div>
            )}

            {sub.showImage && (
              <div className="animate-float">
                <Img w={word} className="text-[100px]" />
              </div>
            )}

            {isSpellingPhase && sub.showLetters && (
              <div className="mt-6 mb-2">
                <div className="flex gap-2.5 justify-center">
                  {letters.map((letter, i) => (
                    <button
                      key={i}
                      onClick={() => sounds.speakLetter(letter, voiceLang)}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl transition-all duration-200 active:scale-90"
                      style={{
                        background: i < letterIdx ? 'linear-gradient(135deg, #8ED36B, #6BBF4A)' : i === letterIdx ? 'linear-gradient(135deg, #5B9FE8, #4A8BD4)' : '#EDE5F5',
                        color: i <= letterIdx ? '#FFFFFF' : '#B0A0C0',
                        boxShadow: i === letterIdx ? '0 4px 14px rgba(91,159,232,0.4)' : 'none',
                        transform: i === letterIdx ? 'scale(1.08)' : 'none',
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <p className="text-center mt-4 font-semibold text-sm" style={{ color: '#9B6DDF' }}>
                  {t('sayLetter')} <span className="font-extrabold text-xl" style={{ color: mc.accent }}>{letters[letterIdx]}</span>
                </p>
              </div>
            )}

            <div className="h-16 flex items-center justify-center">
              {feedback === 'correct' && (
                <div className="animate-pop font-extrabold text-2xl flex items-center gap-2" style={{ color: '#4A8C2A' }}>
                  <span className="text-3xl animate-sparkle">⭐</span> {t('great')}
                </div>
              )}
              {feedback === 'wrong' && (
                <div className="animate-shake font-extrabold text-2xl flex items-center gap-2" style={{ color: '#C0457B' }}>
                  <span className="text-3xl">🔄</span> {t('tryAgain')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 w-full px-6">
              <button
                onClick={handleCorrect}
                disabled={!!feedback}
                className="flex-1 py-3.5 rounded-2xl font-extrabold active:scale-95 transition-transform disabled:opacity-40 text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #8ED36B, #6BBF4A)', boxShadow: '0 4px 14px rgba(142,211,107,0.3)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {lang === 'es' ? 'La conozco' : 'I know it'}
              </button>
              <button
                onClick={handleIncorrect}
                disabled={!!feedback}
                className="flex-1 py-3.5 rounded-2xl font-extrabold active:scale-95 transition-transform disabled:opacity-40 text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #9B6DDF, #7B4FBF)', boxShadow: '0 4px 14px rgba(123,79,191,0.3)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                {t('repeat')}
              </button>
            </div>

            <button
              onClick={handleSkip}
              className="mt-4 text-xs font-bold active:opacity-70 transition-opacity"
              style={{ color: '#B0A0C0' }}
            >
              {t('skipWord')} →
            </button>
          </>
        )}
      </div>

      {isFamiliarize && (
        <div className="px-6 pb-3 flex gap-3 w-full">
          <button
            onClick={handleFamiliarizeLearned}
            className="flex-1 py-3.5 text-white rounded-2xl font-extrabold active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8ED36B, #6BBF4A)', boxShadow: '0 4px 14px rgba(142,211,107,0.3)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            {lang === 'es' ? 'La conozco' : 'I know it'}
          </button>
          <button
            onClick={handleFamiliarizeNotYet}
            className="flex-1 py-3.5 text-white rounded-2xl font-extrabold active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #9B6DDF, #7B4FBF)', boxShadow: '0 4px 14px rgba(123,79,191,0.3)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
            {t('repeat')}
          </button>
        </div>
      )}

      <div className="text-center pb-5 text-xs font-bold" style={{ color: '#B0A0C0' }}>
        {MODES[mode]?.label} · {lang === 'es' ? sub.labelEs : sub.label}
        {blockIndex >= 0 ? ` · ${t('block')} ${blockIndex + 1}` : blockIndex === -2 ? ` · ${t('allWords')}` : blockIndex === -3 ? ` · ${t('randomBlock')}` : ` · ${t('review')}`}
      </div>
    </div>
  )
}

function MuteBtn({ mc }) {
  const { profile, updateProfile } = useAuth()
  const mFx = !!profile?.mute_fx
  const mVoice = !!profile?.mute_voice
  return (
    <div className="flex gap-1">
      <button
        onClick={() => { const v = !mFx; sounds.muteFx = v; updateProfile({ mute_fx: v }) }}
        className="w-8 h-8 flex items-center justify-center rounded-lg active:scale-90 transition-transform text-sm"
        style={{ background: mFx ? '#FFF1F5' : mc.modeBg, color: mFx ? '#C0457B' : mc.accent }}
      >
        {mFx ? '🔇' : '🔔'}
      </button>
      <button
        onClick={() => { const v = !mVoice; sounds.muteVoice = v; updateProfile({ mute_voice: v }) }}
        className="w-8 h-8 flex items-center justify-center rounded-lg active:scale-90 transition-transform text-sm"
        style={{ background: mVoice ? '#FFF1F5' : mc.modeBg, color: mVoice ? '#C0457B' : mc.accent }}
      >
        {mVoice ? '🤐' : '🗣️'}
      </button>
    </div>
  )
}
