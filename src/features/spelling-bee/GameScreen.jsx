import { useState, useEffect, useRef } from 'react'
import { recordAttempt, addFlower } from './storage'

export default function GameScreen({ config, onBack }) {
  const { mode, block, blockIndex, isChallenge } = config
  const isSpelling = mode === 'spellingBee'

  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState(isSpelling ? 'spelling' : 'reading')
  const [letterIdx, setLetterIdx] = useState(0)
  const [letterErrors, setLetterErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [blockDone, setBlockDone] = useState(false)
  const [blockResults, setBlockResults] = useState([])
  const [wordReadingErrors, setWordReadingErrors] = useState(0)
  const timerRef = useRef(null)
  const feedbackTimeout = useRef(null)

  const currentWord = block[wordIdx]
  const letters = currentWord?.word.split('') || []

  useEffect(() => {
    if (blockDone || phase === 'result') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    return () => clearInterval(timerRef.current)
  }, [startTime, blockDone, phase])

  useEffect(() => {
    setPhase(isSpelling ? 'spelling' : 'reading')
    setLetterIdx(0)
    setLetterErrors({})
    setWordReadingErrors(0)
    setFeedback(null)
    setStartTime(Date.now())
    setElapsed(0)
    clearTimeout(feedbackTimeout.current)
  }, [wordIdx, isSpelling])

  function showFeedback(type, ms, cb) {
    setFeedback(type)
    clearTimeout(feedbackTimeout.current)
    feedbackTimeout.current = setTimeout(() => { setFeedback(null); cb?.() }, ms)
  }

  function handleCorrect() {
    if (feedback) return
    if (phase === 'spelling') {
      showFeedback('correct', 450, () => {
        if (letterIdx >= letters.length - 1) setPhase('reading')
        else setLetterIdx(i => i + 1)
      })
    } else if (phase === 'reading') {
      finishWord(true)
    }
  }

  function handleIncorrect() {
    if (feedback) return
    if (phase === 'spelling') {
      setLetterErrors(p => ({ ...p, [letterIdx]: (p[letterIdx] || 0) + 1 }))
      showFeedback('tryAgain', 600)
    } else if (phase === 'reading') {
      setWordReadingErrors(e => e + 1)
      showFeedback('tryAgain', 600)
    }
  }

  function finishWord(wordOk) {
    clearInterval(timerRef.current)
    const time = Date.now() - startTime
    const lr = isSpelling ? letters.map((_, i) => !(letterErrors[i] || 0)) : undefined
    const attempt = { letterResults: lr, wordCorrect: wordOk, time, mode: isChallenge ? 'challenge' : 'training' }
    recordAttempt(mode, currentWord.word, attempt)
    setBlockResults(p => [...p, { ...attempt, word: currentWord.word, emoji: currentWord.emoji, imageUrl: currentWord.imageUrl }])
    setPhase('result')
  }

  function nextWord() {
    if (wordIdx < block.length - 1) setWordIdx(i => i + 1)
    else { addFlower(mode); setBlockDone(true) }
  }

  const fmt = ms => { const s = Math.floor(ms / 1000); return `${s}.${Math.floor((ms % 1000) / 100)}s` }

  function WordImage({ w, size = 'text-[120px]' }) {
    if (w.imageUrl) return <img src={w.imageUrl} alt={w.word} className="w-40 h-40 object-contain" />
    return <div className={`${size} leading-none select-none`}>{w.emoji}</div>
  }

  if (blockDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#FFF8D6' }}>
        <div className="text-6xl mb-3">🎉</div>
        <h1 className="text-3xl font-bold text-amber-800 mb-1">Block Complete!</h1>
        <div className="text-3xl mb-4">{'⭐'.repeat(Math.min(block.length, 5))}</div>

        <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-md mb-6">
          {blockResults.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-amber-100 last:border-0">
              {r.imageUrl
                ? <img src={r.imageUrl} alt={r.word} className="w-8 h-8 object-contain" />
                : <span className="text-2xl">{r.emoji}</span>}
              <span className="font-bold flex-1 text-amber-900">{r.word}</span>
              <span className={r.wordCorrect ? 'text-green-500 text-xl' : 'text-red-400 text-xl'}>
                {r.wordCorrect ? '✓' : '✗'}
              </span>
              <span className="text-xs text-gray-400 w-12 text-right">{fmt(r.time)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={onBack} className="flex-1 py-3 bg-white border-2 border-amber-300 text-amber-700 rounded-xl font-bold text-lg active:scale-95 transition-transform">
            Home
          </button>
          <button onClick={() => { setBlockDone(false); setWordIdx(0); setBlockResults([]) }} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform">
            Again
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const lrFinal = isSpelling ? letters.map((_, i) => !(letterErrors[i] || 0)) : null
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#FFF8D6' }}>
        <WordImage w={currentWord} size="text-[100px]" />
        <h2 className="text-4xl font-bold text-amber-800 mt-4 mb-3">{currentWord.word}</h2>

        {lrFinal && (
          <div className="flex gap-3 mb-3">
            {letters.map((l, i) => (
              <span key={i} className={`text-2xl font-bold ${lrFinal[i] ? 'text-green-500' : 'text-red-400'}`}>
                {l}{lrFinal[i] ? '✓' : '✗'}
              </span>
            ))}
          </div>
        )}

        <div className="text-lg mb-1">
          Word: <span className="font-bold text-green-600">✓</span>
        </div>
        <div className="text-gray-400 mb-4">{fmt(elapsed)}</div>
        <div className="text-3xl mb-6">{(!lrFinal || lrFinal.every(Boolean)) && !wordReadingErrors ? '⭐ Great!' : '💪 Keep trying!'}</div>

        <button onClick={nextWord} className="w-full max-w-xs py-4 bg-amber-500 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform">
          {wordIdx < block.length - 1 ? 'NEXT' : 'FINISH'}
        </button>
        <div className="mt-3 text-amber-600 text-sm">Word {wordIdx + 1} / {block.length}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF8D6' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={onBack} className="text-amber-600 font-bold text-lg active:scale-95 transition-transform">← Back</button>
        <div className="text-amber-600 font-semibold">{wordIdx + 1} / {block.length}</div>
        {isChallenge
          ? <div className="bg-amber-100 px-3 py-1 rounded-full text-amber-700 font-mono font-bold text-sm">{fmt(elapsed)}</div>
          : <div className="w-16" />}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-3">
        {block.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < wordIdx ? 'bg-green-400' : i === wordIdx ? 'bg-amber-500' : 'bg-amber-200'}`} />
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <WordImage w={currentWord} />

        <div className="text-sm font-bold text-amber-600 mt-4 mb-2 uppercase tracking-wider">
          {phase === 'spelling' ? 'Spell the letters' : 'Read the word'}
        </div>

        {isSpelling && phase === 'spelling' ? (
          <>
            <div className="flex gap-4 mb-2">
              {letters.map((letter, i) => (
                <div key={i} className="flex flex-col items-center">
                  {i === letterIdx && <div className="text-2xl mb-1" style={{ animation: 'bounce 0.6s infinite' }}>🐝</div>}
                  {i !== letterIdx && <div className="h-9" />}
                  <span className={`text-5xl font-bold transition-all duration-200 ${
                    i < letterIdx ? 'text-green-500' : i === letterIdx ? 'text-red-600 scale-110' : 'text-gray-300'
                  }`}>
                    {letter}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-gray-500 mb-2">
              Letter: <span className="text-3xl font-bold text-red-600">{letters[letterIdx]}</span>
            </div>
          </>
        ) : (
          <div className="text-5xl font-bold text-red-600 mb-2">{currentWord.word}</div>
        )}

        {/* Feedback area */}
        <div className="h-14 flex items-center justify-center">
          {feedback === 'correct' && <div className="text-3xl text-green-500 font-bold animate-pulse">⭐ Great!</div>}
          {feedback === 'tryAgain' && <div className="text-3xl text-orange-500 font-bold animate-pulse">🔄 Try again!</div>}
        </div>

        {/* Buttons */}
        <div className="flex gap-8">
          <button
            onClick={handleIncorrect}
            disabled={!!feedback}
            className="w-24 h-24 rounded-full bg-red-100 border-4 border-red-300 text-5xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Incorrect"
          >
            ✗
          </button>
          <button
            onClick={handleCorrect}
            disabled={!!feedback}
            className="w-24 h-24 rounded-full bg-green-100 border-4 border-green-300 text-5xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Correct"
          >
            ✓
          </button>
        </div>
      </div>

      <div className="text-center pb-4 text-amber-500 text-sm font-semibold">
        {isSpelling ? 'Spelling Bee' : 'Bumblebee'} · Block {blockIndex + 1}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-8px) }
        }
      `}</style>
    </div>
  )
}
