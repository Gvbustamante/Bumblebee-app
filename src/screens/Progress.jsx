import { SPELLING_BEE_WORDS, BUMBLEBEE_WORDS } from '../data/words'
import { getMastery, getLetterMastery, getWordStats, getWeakWords, getStars, getGarden } from '../storage'

export default function Progress() {
  const stars = getStars()
  const sbGarden = getGarden('spellingBee')
  const bbGarden = getGarden('bumblebee')
  const totalFlowers = sbGarden.flowers + bbGarden.flowers
  const totalBees = sbGarden.bees + bbGarden.bees

  return (
    <div className="animate-fade-up pb-4">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">Progress</h1>
        <p className="text-sm text-gray-400 font-semibold">Track your learning journey</p>
      </div>

      {/* Stars + Garden summary */}
      <div className="mx-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-yellow-600">⭐ {stars}</div>
            <div className="text-xs text-yellow-500 font-bold">Total Stars</div>
          </div>
          <div className="text-right">
            <div className="text-2xl">{'🌻'.repeat(Math.min(totalFlowers, 6))} {'🐝'.repeat(Math.min(totalBees, 3))}</div>
            <div className="text-xs text-yellow-500 font-bold">{totalFlowers} flowers · {totalBees} bees</div>
          </div>
        </div>
      </div>

      <ModeSection mode="spellingBee" label="Spelling Bee" words={SPELLING_BEE_WORDS} color="purple" />
      <ModeSection mode="bumblebee" label="Bumblebee" words={BUMBLEBEE_WORDS} color="orange" />
    </div>
  )
}

function ModeSection({ mode, label, words, color }) {
  const stats = getWordStats(mode)
  const weak = getWeakWords(mode, words)
  const colors = {
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-700', bar: 'bg-purple-500', barBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', title: 'text-orange-600', bar: 'bg-orange-500', barBg: 'bg-orange-100' },
  }
  const c = colors[color]

  return (
    <div className={`mx-4 mb-4 ${c.bg} ${c.border} border-2 rounded-2xl p-4`}>
      <h2 className={`text-lg font-extrabold ${c.title} mb-3`}>{label}</h2>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox value={stats.practiced} label="Practiced" bg="bg-white" text="text-gray-700" />
        <StatBox value={stats.mastered} label="Mastered" bg="bg-green-100" text="text-green-600" />
        <StatBox value={stats.weak} label="Weak" bg="bg-red-50" text="text-red-500" />
      </div>

      <div className="space-y-2">
        {words.map(w => {
          const m = getMastery(mode, w.word)
          const lm = mode === 'spellingBee' ? getLetterMastery(w.word) : null
          return (
            <div key={w.word} className="bg-white rounded-xl p-2.5 flex items-center gap-2">
              <span className="text-lg w-7 text-center">{w.emoji}</span>
              <span className="font-bold text-sm w-12 text-gray-700">{w.word}</span>
              <div className="flex-1">
                <div className={`h-2 ${c.barBg} rounded-full overflow-hidden`}>
                  <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${Math.max(m, 0)}%` }} />
                </div>
                {lm && (
                  <div className="flex gap-0.5 mt-1">
                    {w.word.split('').map((l, i) => (
                      <span key={i} className={`text-[9px] font-bold ${
                        lm[i] < 0 ? 'text-gray-300' : lm[i] >= 80 ? 'text-green-500' : lm[i] >= 50 ? 'text-yellow-500' : 'text-red-400'
                      }`}>
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-gray-400 w-8 text-right">
                {m < 0 ? '—' : `${m}%`}
              </span>
            </div>
          )
        })}
      </div>

      {weak.length > 0 && (
        <div className="mt-3 bg-red-50 rounded-xl p-3 border border-red-200">
          <div className="text-xs font-bold text-red-600 mb-1">Needs practice</div>
          <div className="text-xs text-red-500 font-semibold">{weak.map(w => w.word).join(' · ')}</div>
        </div>
      )}

      {mode === 'spellingBee' && <WeakLetters words={words} />}
    </div>
  )
}

function StatBox({ value, label, bg, text }) {
  return (
    <div className={`${bg} rounded-xl p-2 text-center`}>
      <div className={`text-xl font-extrabold ${text}`}>{value}</div>
      <div className="text-[10px] text-gray-400 font-bold">{label}</div>
    </div>
  )
}

function WeakLetters({ words }) {
  const scores = {}
  for (const w of words) {
    const lm = getLetterMastery(w.word)
    w.word.split('').forEach((l, i) => {
      if (lm[i] < 0) return
      if (!scores[l]) scores[l] = []
      scores[l].push(lm[i])
    })
  }
  const weak = Object.entries(scores)
    .map(([l, s]) => ({ l, avg: Math.round(s.reduce((a, b) => a + b, 0) / s.length) }))
    .filter(x => x.avg < 60)
    .sort((a, b) => a.avg - b.avg)

  if (!weak.length) return null
  return (
    <div className="mt-3 bg-orange-50 rounded-xl p-3 border border-orange-200">
      <div className="text-xs font-bold text-orange-600 mb-2">Letters to reinforce</div>
      <div className="flex gap-1.5 flex-wrap">
        {weak.map(x => (
          <span key={x.l} className="bg-orange-200 text-orange-800 font-extrabold px-2.5 py-1 rounded-lg text-xs">
            {x.l} <span className="text-orange-500">{x.avg}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}
