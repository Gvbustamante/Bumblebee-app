import { useState, useEffect, useRef } from 'react'
import { MODES, getSubMode, getInitialPhase, getNextPhase } from '../data/modes'
import { getWordImageUrl } from '../data/assets'
import { recordAttempt, addFlower, addStars } from '../storage'

export default function Game({ config, onExit }) {
  const { mode, subMode: subModeId, block, blockIndex, isChallenge } = config
  const sub = getSubMode(mode, subModeId)

  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState(() => getInitialPhase(sub))
  const [letterIdx, setLetterIdx] = useState(0)
  const [letterErrors, setLetterErrors] = useState({})
  const [wordReadErrors, setWordReadErrors] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [blockDone, setBlockDone] = useState(false)
  const [blockResults, setBlockResults] = useState([])
  const timerRef = useRef(null)
  const fbRef = useRef(null)

  const word = block[wordIdx]
  const letters = word?.word.split('') || []

  useEffect(() => {
    if (blockDone || phase === 'result') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    return () => clearInterval(timerRef.current)
  }, [startTime, blockDone, phase])

  useEffect(() => {
    setPhase(getInitialPhase(sub))
    setLetterIdx(0)
    setLetterErrors({})
    setWordReadErrors(0)
    setFeedback(null)
    setStartTime(Date.now())
    setElapsed(0)
    clearTimeout(fbRef.current)
  }, [wordIdx])

  function fb(type, ms, cb) {
    setFeedback(type)
    clearTimeout(fbRef.current)
    fbRef.current = setTimeout(() => { setFeedback(null); cb?.() }, ms)
  }

  function handleCorrect() {
    if (feedback) return
    if (phase === 'spelling') {
      fb('correct', 400, () => {
        if (letterIdx >= letters.length - 1) {
          const next = getNextPhase('spelling', sub)
          if (next && next !== 'result') setPhase(next)
          else finishWord(true)
        } else {
          setLetterIdx(i => i + 1)
        }
      })
    } else if (phase === 'reading') {
      finishWord(true)
    }
  }

  function handleIncorrect() {
    if (feedback) return
    if (phase === 'spelling') {
      setLetterErrors(p => ({ ...p, [letterIdx]: (p[letterIdx] || 0) + 1 }))
      fb('wrong', 500)
    } else if (phase === 'reading') {
      setWordReadErrors(e => e + 1)
      fb('wrong', 500)
    }
  }

  function handleFamiliarizeNext() {
    finishWord(true, true)
  }

  function finishWord(wordOk, isFamiliarize = false) {
    clearInterval(timerRef.current)
    const time = Date.now() - startTime
    const lr = sub.requireSpelling ? letters.map((_, i) => !(letterErrors[i] || 0)) : undefined
    const allPerfect = isFamiliarize || (wordOk && (!lr || lr.every(Boolean)) && !wordReadErrors)
    const earned = isFamiliarize ? 1 : allPerfect ? 3 : wordOk ? 1 : 0
    if (earned) addStars(earned)

    const attempt = {
      letterResults: lr,
      wordCorrect: wordOk,
      time,
      mode: isChallenge ? 'challenge' : 'training',
      familiarize: isFamiliarize || undefined,
    }
    recordAttempt(mode, subModeId, word.word, attempt)
    setBlockResults(p => [...p, {
      ...attempt, word: word.word, emoji: word.emoji,
      perfect: allPerfect, starsEarned: earned,
    }])

    if (isFamiliarize) {
      if (wordIdx < block.length - 1) setWordIdx(i => i + 1)
      else { addFlower(mode, subModeId); setBlockDone(true) }
    } else {
      setPhase('result')
    }
  }

  function nextWord() {
    if (wordIdx < block.length - 1) setWordIdx(i => i + 1)
    else { addFlower(mode, subModeId); setBlockDone(true) }
  }

  const fmt = ms => `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) / 100)}s`

  function Img({ w, className = '' }) {
    const url = w.imageUrl || getWordImageUrl(w.word)
    if (url) return <img src={url} alt={w.word} className={`object-contain ${className}`} />
    return <span className={className}>{w.emoji}</span>
  }

  if (!sub) return (
    <div className="min-h-screen flex items-center justify-center">
      <button onClick={onExit} className="text-purple-600 font-bold">← Back Home</button>
    </div>
  )

  // ─── BLOCK COMPLETE ───
  if (blockDone) {
    const totalStars = blockResults.reduce((s, r) => s + r.starsEarned, 0)
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center p-5 animate-pop">
        <div className="text-6xl mb-2">🎉</div>
        <h1 className="text-2xl font-extrabold text-purple-700">Block Complete!</h1>
        <div className="text-xl text-yellow-500 font-bold mt-1">+{totalStars} ⭐</div>

        <div className="bg-white rounded-2xl shadow-card p-4 w-full mt-5 space-y-2">
          {blockResults.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Img w={r} className="text-2xl w-8 h-8" />
              <span className="font-bold flex-1 text-gray-700 text-sm">{r.word}</span>
              {r.perfect && <span className="text-yellow-400 text-lg">⭐</span>}
              <span className={`font-bold text-sm ${r.wordCorrect ? 'text-green-500' : 'text-red-400'}`}>
                {r.wordCorrect ? '✓' : '✗'}
              </span>
              <span className="text-[11px] text-gray-400 w-10 text-right font-mono">{fmt(r.time)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full mt-6">
          <button onClick={onExit} className="flex-1 py-3.5 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-extrabold active:scale-95 transition-transform">
            Home
          </button>
          <button onClick={() => { setBlockDone(false); setWordIdx(0); setBlockResults([]) }} className="flex-1 py-3.5 bg-purple-600 text-white rounded-2xl font-extrabold shadow-btn active:scale-95 transition-transform">
            Again
          </button>
        </div>
      </div>
    )
  }

  // ─── WORD RESULT ───
  if (phase === 'result') {
    const lr = sub.requireSpelling ? letters.map((_, i) => !(letterErrors[i] || 0)) : null
    const allPerfect = (!lr || lr.every(Boolean)) && !wordReadErrors
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center p-5 animate-pop">
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
          {allPerfect ? '⭐ Perfect!' : '💪 Good try!'}
        </div>
        <div className="text-gray-400 text-sm mt-1 font-mono">{fmt(elapsed)}</div>

        <button onClick={nextWord} className="w-full max-w-xs py-4 bg-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-btn mt-8 active:scale-95 transition-transform">
          {wordIdx < block.length - 1 ? 'Next →' : 'Finish! 🎉'}
        </button>
        <div className="mt-3 text-gray-400 text-sm font-bold">{wordIdx + 1} / {block.length}</div>
      </div>
    )
  }

  // ─── GAME PLAY ───
  const isFamiliarize = phase === 'familiarize'
  const isSpellingPhase = phase === 'spelling'

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold active:scale-90 transition-transform">
          ←
        </button>
        <div className="flex items-center gap-2">
          {block.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < wordIdx ? 'bg-green-400 scale-100' : i === wordIdx ? 'bg-purple-500 scale-125' : 'bg-purple-200'
            }`} />
          ))}
        </div>
        {isChallenge
          ? <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-700 font-mono font-bold text-sm">{fmt(elapsed)}</div>
          : <div className="w-10" />}
      </div>

      {/* Phase label */}
      <div className="text-center mt-2">
        <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
          isFamiliarize ? 'bg-blue-100 text-blue-600' :
          isSpellingPhase ? 'bg-purple-100 text-purple-600' :
          'bg-orange-100 text-orange-600'
        }`}>
          {isFamiliarize ? '👀 Look and learn' :
           isSpellingPhase ? '🐝 Spell the letters' :
           '📖 Read the word'}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-4">
        {sub.showImage && (
          <div className="animate-float">
            <Img w={word} className="text-[100px]" />
          </div>
        )}

        {/* Spelling phase - letter tiles */}
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
              Say the letter: <span className="text-purple-600 font-extrabold text-xl">{letters[letterIdx]}</span>
            </p>
          </div>
        )}

        {/* Familiarize - show word */}
        {isFamiliarize && (
          <div className="mt-6 mb-2">
            <div className="bg-white rounded-2xl shadow-card px-8 py-5 border border-purple-100">
              <p className="text-4xl font-extrabold text-purple-700 text-center tracking-wider">{word.word}</p>
            </div>
            <p className="text-center mt-3 text-gray-400 font-semibold text-sm">Look at the word and picture</p>
          </div>
        )}

        {/* Reading phase with word visible */}
        {phase === 'reading' && sub.showWord && (
          <div className="mt-6 mb-2">
            <div className="bg-white rounded-2xl shadow-card px-8 py-5 border border-purple-100">
              <p className="text-4xl font-extrabold text-purple-700 text-center tracking-wider">{word.word}</p>
            </div>
            <p className="text-center mt-3 text-gray-400 font-semibold text-sm">Read the word aloud</p>
          </div>
        )}

        {/* Reading phase without word (image only) */}
        {phase === 'reading' && !sub.showWord && (
          <div className="mt-8 mb-2">
            <p className="text-center text-gray-500 font-bold text-lg">What do you see?</p>
            <p className="text-center text-gray-400 font-semibold text-sm mt-1">Say the word!</p>
          </div>
        )}

        {/* Feedback */}
        {!isFamiliarize && (
          <div className="h-16 flex items-center justify-center">
            {feedback === 'correct' && (
              <div className="animate-pop text-green-500 font-extrabold text-2xl flex items-center gap-2">
                <span className="text-3xl">⭐</span> Great!
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="animate-shake text-orange-500 font-extrabold text-2xl flex items-center gap-2">
                <span className="text-3xl">🔄</span> Try again!
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isFamiliarize ? (
          <button
            onClick={handleFamiliarizeNext}
            className="mt-6 px-12 py-4 bg-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-btn active:scale-95 transition-transform"
          >
            {wordIdx < block.length - 1 ? 'Got it! Next →' : 'Got it! Finish! 🎉'}
          </button>
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

      {/* Bottom info */}
      <div className="text-center pb-5 text-gray-400 text-xs font-bold">
        {MODES[mode]?.label} · {sub.label}{blockIndex >= 0 ? ` · Block ${blockIndex + 1}` : ' · Review'}
      </div>
    </div>
  )
}
