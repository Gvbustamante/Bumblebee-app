import { SPELLING_BEE_WORDS, BUMBLEBEE_WORDS } from './data/words'
import { getMastery, getLetterMastery, getWordStats, getWeakWords, getAllWordData, resetProgress } from './storage'

function MasteryBar({ value }) {
  const color = value < 0 ? 'bg-gray-200' : value >= 80 ? 'bg-green-400' : value >= 50 ? 'bg-amber-400' : 'bg-red-400'
  const w = value < 0 ? 0 : value
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

function ModeStats({ mode, label, words }) {
  const stats = getWordStats(mode)
  const weak = getWeakWords(mode, words)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-amber-200 mb-4">
      <h2 className="text-xl font-bold text-amber-800 mb-3">{label}</h2>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-amber-50 rounded-xl p-2">
          <div className="text-2xl font-bold text-amber-700">{stats.practiced}</div>
          <div className="text-xs text-amber-500">Practiced</div>
        </div>
        <div className="text-center bg-green-50 rounded-xl p-2">
          <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
          <div className="text-xs text-green-500">Mastered</div>
        </div>
        <div className="text-center bg-red-50 rounded-xl p-2">
          <div className="text-2xl font-bold text-red-500">{stats.weak}</div>
          <div className="text-xs text-red-400">Needs work</div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">All Words</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {words.map(w => {
          const m = getMastery(mode, w.word)
          const lm = mode === 'spellingBee' ? getLetterMastery(w.word) : null
          return (
            <div key={w.word} className="flex items-center gap-2">
              <span className="text-lg w-8">{w.emoji}</span>
              <span className="font-bold text-sm w-14 text-amber-800">{w.word}</span>
              <MasteryBar value={m} />
              <span className="text-xs text-gray-400 w-10 text-right">{m < 0 ? '—' : `${m}%`}</span>
            </div>
          )
        })}
      </div>

      {weak.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-xl">
          <h3 className="text-sm font-bold text-red-600 mb-1">Needs Practice</h3>
          <div className="text-sm text-red-500">
            {weak.map(w => w.word).join(', ')}
          </div>
        </div>
      )}

      {mode === 'spellingBee' && (
        <LetterAnalysis words={words} />
      )}
    </div>
  )
}

function LetterAnalysis({ words }) {
  const letterScores = {}
  for (const w of words) {
    const lm = getLetterMastery(w.word)
    w.word.split('').forEach((letter, i) => {
      if (lm[i] < 0) return
      if (!letterScores[letter]) letterScores[letter] = []
      letterScores[letter].push(lm[i])
    })
  }

  const weakLetters = Object.entries(letterScores)
    .map(([letter, scores]) => ({ letter, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .filter(l => l.avg < 60)
    .sort((a, b) => a.avg - b.avg)

  if (!weakLetters.length) return null

  return (
    <div className="mt-4 p-3 bg-orange-50 rounded-xl">
      <h3 className="text-sm font-bold text-orange-600 mb-1">Letters to Reinforce</h3>
      <div className="flex gap-2 flex-wrap">
        {weakLetters.map(l => (
          <span key={l.letter} className="bg-orange-200 text-orange-800 font-bold px-3 py-1 rounded-lg text-sm">
            {l.letter} ({l.avg}%)
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ProgressScreen({ onBack }) {
  return (
    <div className="min-h-screen pb-8" style={{ background: '#FFF8D6' }}>
      <div className="flex items-center justify-between px-4 pt-4 mb-4">
        <button onClick={onBack} className="text-amber-600 font-bold text-lg active:scale-95 transition-transform">← Back</button>
        <h1 className="text-xl font-bold text-amber-800">Progress</h1>
        <div className="w-12" />
      </div>

      <div className="max-w-md mx-auto px-4">
        <ModeStats mode="spellingBee" label="Spelling Bee" words={SPELLING_BEE_WORDS} />
        <ModeStats mode="bumblebee" label="Bumblebee" words={BUMBLEBEE_WORDS} />

        <button
          onClick={() => { if (window.confirm('Reset all progress?')) { resetProgress(); window.location.reload() } }}
          className="w-full py-2 text-red-400 text-sm mt-4"
        >
          Reset progress
        </button>
      </div>
    </div>
  )
}
