import { useState, useEffect, useRef } from 'react'
import { MODES, getSubMode, getInitialPhase, getNextPhase } from '../data/modes'
import { getWordImageUrl } from '../data/assets'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { recordAttempt, addFlower, addStars } from '../lib/db'
import sounds from '../lib/sounds'

export default function Game({ config, onExit }) {
  const { mode, subMode: subModeId, block, blockIndex, isChallenge } = config
  const sub = getSubMode(mode, subModeId)
  const { t, lang } = useLang()
  const { session, profile } = useAuth()
  const uid = session?.user?.id
  const imgSize = profile?.image_size || 'medium'

  const [queue, setQueue] = useState([...block])
  const [phase, setPhase] = useState(() => getInitialPhase(sub))
  const [letterIdx, setLetterIdx] = useState(0)
  const [letterErrors, setLetterErrors] = useState({})
  const [wordReadErrors, setWordReadErrors] = useState(0)
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

  useEffect(() => {
    if (blockDone || showResult) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    return () => clearInterval(timerRef.current)
  }, [startTime, blockDone, showResult])

  useEffect(() => {
    if (!word || blockDone || showResult) return
    const t = setTimeout(() => sounds.speak(word.word, lang), 400)
    return () => clearTimeout(t)
  }, [word?.word, blockDone, showResult])

  useEffect(() => {
    if (phase !== 'spelling' || !letters[letterIdx]) return
    const t = setTimeout(() => sounds.speakLetter(letters[letterIdx], lang), 200)
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
    setStartTime(Date.now())
    setElapsed(0)
    clearTimeout(fbRef.current)
  }

  function fb(type, ms, cb) {
    setFeedback(type)
    clearTimeout(fbRef.current)
    fbRef.current = setTimeout(() => { setFeedback(null); cb?.() }, ms)
  }

  function handleCorrect() {
    if (feedback) return
    if (phase === 'spelling') {
      sounds.correct()
      fb('correct', 400, () => {
        if (letterIdx >= letters.length - 1) {
          const next = getNextPhase('spelling', sub)
          if (next && next !== 'result') setPhase(next)
          else completeAttempt(true)
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
      fb('wrong', 500)
    } else if (phase === 'reading') {
      setWordReadErrors(e => e + 1)
      fb('wrong', 500)
    }
  }

  function completeAttempt(wordOk) {
    clearInterval(timerRef.current)
    const time = Date.now() - startTime
    const lr = sub.requireSpelling ? letters.map((_, i) => !(letterErrors[i] || 0)) : undefined
    const allPerfect = wordOk && (!lr || lr.every(Boolean)) && !wordReadErrors

    if (uid) {
      recordAttempt(uid, mode, subModeId, word.word, {
        letterResults: lr, wordCorrect: wordOk,
      })
    }

    setCurrentResult({ lr, allPerfect, time, wordOk })
    setShowResult(true)
  }

  function handleLearned() {
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
      setBlockDone(true)
    } else {
      setQueue(next)
      resetForNextWord()
    }
  }

  function handleNotYet() {
    sounds.next()
    setQueue(q => [...q.slice(1), q[0]])
    resetForNextWord()
  }

  function handleFamiliarizeLearned() {
    sounds.learned()
    const time = Date.now() - startTime
    if (uid) {
      addStars(uid, mode, 1)
      recordAttempt(uid, mode, subModeId, word.word, { wordCorrect: true })
    }
    setBlockResults(p => [...p, { word: word.word, emoji: word.emoji, perfect: true, starsEarned: 1, time }])
    const next = queue.slice(1)
    if (next.length === 0) {
      if (uid) addFlower(uid, mode, subModeId)
      sounds.blockComplete()
      setBlockDone(true)
    } else {
      setQueue(next)
      resetForNextWord()
    }
  }

  function handleFamiliarizeNotYet() {
    sounds.next()
    setQueue(q => [...q.slice(1), q[0]])
    resetForNextWord()
  }

  const fmt = ms => `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) / 100)}s`

  const IMG_SIZES = { small: 'max-h-[18vh] max-w-[50vw]', medium: 'max-h-[28vh] max-w-[65vw]', large: 'max-h-[40vh] max-w-[80vw]' }

  function Img({ w, className = '' }) {
    const url = w.image_url || getWordImageUrl(w.word)
    if (url) return <img src={url} alt={w.word} className={`object-contain ${IMG_SIZES[imgSize]} ${className}`} />
    return <span className={className}>{w.emoji}</span>
  }

  if (!sub) return (
    <div className="min-h-screen flex items-center justify-center">
      <button onClick={onExit} className="text-purple-600 font-bold">← {t('home')}</button>
    </div>
  )

  if (blockDone) {
    const totalStars = blockResults.reduce((s, r) => s + r.starsEarned, 0)
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center p-6 animate-pop">
        <div className="text-6xl mb-2">🎉</div>
        <h1 className="text-2xl font-extrabold text-purple-700">{t('blockComplete')}</h1>
        <div className="text-xl text-yellow-500 font-bold mt-1">+{totalStars} ⭐</div>

        <div className="bg-white rounded-2xl shadow-card p-4 w-full max-w-sm mt-5 space-y-2">
          {blockResults.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <span className="text-2xl w-8 text-center">{r.emoji}</span>
              <span className="font-bold flex-1 text-gray-700 text-sm">{r.word}</span>
              {r.perfect && <span className="text-yellow-400 text-lg">⭐</span>}
              <span className="text-[11px] text-gray-400 w-10 text-right font-mono">{fmt(r.time)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-sm mt-6">
          <button onClick={onExit} className="flex-1 py-3.5 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-extrabold active:scale-95 transition-transform">
            {t('home')}
          </button>
          <button onClick={() => { setBlockDone(false); setQueue([...block]); setBlockResults([]); resetForNextWord() }} className="flex-1 py-3.5 bg-purple-600 text-white rounded-2xl font-extrabold shadow-btn active:scale-95 transition-transform">
            {t('again')}
          </button>
        </div>
      </div>
    )
  }

  if (showResult && currentResult) {
    const { lr, allPerfect } = currentResult
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center p-6 animate-pop">
        {sub.showImage && <Img w={word} className="text-[80px]" />}
        <h2 className="text-3xl font-extrabold text-gray-800 mt-4">{word.word}</h2>

        {lr && (
          <div className="flex gap-2 mt-4">
            {letters.map((l, i) => (
              <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                lr[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
              }`}>
                {l}
              </div>
            ))}
          </div>
        )}

        <div className={`mt-4 text-3xl font-extrabold ${allPerfect ? 'text-yellow-500 animate-sparkle' : 'text-purple-400'}`}>
          {allPerfect ? `⭐ ${t('perfect')}` : `💪 ${t('goodTry')}`}
        </div>
        <div className="text-gray-400 text-sm mt-1 font-mono">{fmt(elapsed)}</div>

        <div className="flex gap-3 w-full max-w-xs mt-8">
          <button onClick={handleNotYet} className="flex-1 py-4 bg-orange-100 border-2 border-orange-300 text-orange-600 rounded-2xl font-extrabold active:scale-95 transition-transform">
            → {t('notYet')}
          </button>
          <button onClick={handleLearned} className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-extrabold shadow-btn active:scale-95 transition-transform">
            ✓ {t('learned')}
          </button>
        </div>

        <div className="mt-3 text-gray-400 text-sm font-bold">
          {queue.length} {t('remaining')}
        </div>
      </div>
    )
  }

  const isFamiliarize = phase === 'familiarize'
  const isSpellingPhase = phase === 'spelling'

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold active:scale-90 transition-transform">
          ←
        </button>
        <div className="text-sm font-bold text-gray-400">
          {queue.length} {t('remaining')}
        </div>
        {isChallenge
          ? <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-700 font-mono font-bold text-sm">{fmt(elapsed)}</div>
          : <div className="w-10" />}
      </div>

      <div className="text-center mt-2">
        <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
          isFamiliarize ? 'bg-blue-100 text-blue-600' :
          isSpellingPhase ? 'bg-purple-100 text-purple-600' :
          'bg-orange-100 text-orange-600'
        }`}>
          {isFamiliarize ? `👀 ${t('lookAndLearn')}` :
           isSpellingPhase ? `🐝 ${t('spellLetters')}` :
           `📖 ${t('readWord')}`}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {sub.showImage && (
          <div className="animate-float">
            <Img w={word} className="text-[100px]" />
          </div>
        )}

        {isSpellingPhase && sub.showWord && (
          <div className="mt-4 mb-1">
            <div className="bg-white/80 rounded-xl px-6 py-2 border border-purple-100 inline-block">
              <p className="text-2xl font-extrabold text-purple-400 tracking-wider">{word.word}</p>
            </div>
          </div>
        )}

        {isSpellingPhase && sub.showLetters && (
          <div className="mt-6 mb-2">
            <div className="flex gap-3 justify-center">
              {letters.map((letter, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-8 flex items-center justify-center">
                    {i === letterIdx && <span className="text-xl animate-float">🐝</span>}
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl transition-all duration-200 ${
                    i < letterIdx
                      ? 'bg-green-100 text-green-600 scale-95'
                      : i === letterIdx
                        ? 'bg-purple-600 text-white scale-110 shadow-btn'
                        : 'bg-gray-100 text-gray-300'
                  }`}>
                    {letter}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center mt-4 text-gray-400 font-semibold text-sm">
              {t('sayLetter')} <span className="text-purple-600 font-extrabold text-xl">{letters[letterIdx]}</span>
            </p>
          </div>
        )}

        {isFamiliarize && (
          <div className="mt-6 mb-2">
            <div className="bg-white rounded-2xl shadow-card px-8 py-5 border border-purple-100 relative">
              <p className="text-4xl font-extrabold text-purple-700 text-center tracking-wider">{word.word}</p>
              <button onClick={() => sounds.speak(word.word, lang)} className="absolute right-3 top-3 text-purple-300 active:text-purple-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
              </button>
            </div>
            <p className="text-center mt-3 text-gray-400 font-semibold text-sm">{t('lookAtWord')}</p>
          </div>
        )}

        {phase === 'reading' && sub.showWord && (
          <div className="mt-6 mb-2">
            <div className="bg-white rounded-2xl shadow-card px-8 py-5 border border-purple-100 relative">
              <p className="text-4xl font-extrabold text-purple-700 text-center tracking-wider">{word.word}</p>
              <button onClick={() => sounds.speak(word.word, lang)} className="absolute right-3 top-3 text-purple-300 active:text-purple-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
              </button>
            </div>
            <p className="text-center mt-3 text-gray-400 font-semibold text-sm">{t('readAloud')}</p>
          </div>
        )}

        {phase === 'reading' && !sub.showWord && (
          <div className="mt-8 mb-2">
            <p className="text-center text-gray-500 font-bold text-lg">{t('whatDoYouSee')}</p>
            <p className="text-center text-gray-400 font-semibold text-sm mt-1">{t('sayTheWord')}</p>
          </div>
        )}

        {!isFamiliarize && (
          <div className="h-16 flex items-center justify-center">
            {feedback === 'correct' && (
              <div className="animate-pop text-green-500 font-extrabold text-2xl flex items-center gap-2">
                <span className="text-3xl">⭐</span> {t('great')}
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="animate-shake text-orange-500 font-extrabold text-2xl flex items-center gap-2">
                <span className="text-3xl">🔄</span> {t('tryAgain')}
              </div>
            )}
          </div>
        )}

        {isFamiliarize ? (
          <div className="flex gap-3 w-full max-w-xs mt-6">
            <button
              onClick={handleFamiliarizeNotYet}
              className="flex-1 py-4 bg-orange-100 border-2 border-orange-300 text-orange-600 rounded-2xl font-extrabold active:scale-95 transition-transform"
            >
              → {t('notYet')}
            </button>
            <button
              onClick={handleFamiliarizeLearned}
              className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-extrabold shadow-btn active:scale-95 transition-transform"
            >
              ✓ {t('learned')}
            </button>
          </div>
        ) : (
          <div className="flex gap-6 mt-2">
            <button
              onClick={handleIncorrect}
              disabled={!!feedback}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-50 border-[3px] border-red-300 text-4xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-40"
            >
              ✗
            </button>
            <button
              onClick={handleCorrect}
              disabled={!!feedback}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 border-[3px] border-green-300 text-4xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-40"
            >
              ✓
            </button>
          </div>
        )}
      </div>

      <div className="text-center pb-5 text-gray-400 text-xs font-bold">
        {MODES[mode]?.label} · {lang === 'es' ? sub.labelEs : sub.label}
        {blockIndex >= 0 ? ` · ${t('block')} ${blockIndex + 1}` : ` · ${t('review')}`}
      </div>
    </div>
  )
}
