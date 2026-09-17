import { SPELLING_BEE_WORDS, BUMBLEBEE_WORDS } from '../data/words'
import { MODES } from '../data/modes'
import { useLang } from '../data/i18n'
import { getMastery, getLetterMastery, getWordStats, getWeakWords, getStars, getGarden, getModeStats } from '../storage'

export default function Progress() {
  const { t } = useLang()
  const stars = getStars()
  const sbGarden = getGarden('spellingBee')
  const bbGarden = getGarden('bumblebee')
  const totalFlowers = sbGarden.flowers + bbGarden.flowers
  const totalBees = sbGarden.bees + bbGarden.bees

  return (
    <div className="animate-fade-up pb-4">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">{t('progress')}</h1>
        <p className="text-sm text-gray-400 font-semibold">{t('trackJourney')}</p>
      </div>

      <div className="mx-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold text-yellow-600">⭐ {stars}</div>
            <div className="text-xs text-yellow-500 font-bold">{t('totalStars')}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl">{'🌻'.repeat(Math.min(totalFlowers, 6))} {'🐝'.repeat(Math.min(totalBees, 3))}</div>
            <div className="text-xs text-yellow-500 font-bold">{totalFlowers} {t('flowers')} · {totalBees} {t('bees')}</div>
          </div>
        </div>
      </div>

      <ModeSection modeId="spellingBee" words={SPELLING_BEE_WORDS} color="purple" />
      <ModeSection modeId="bumblebee" words={BUMBLEBEE_WORDS} color="orange" />
    </div>
  )
}

function ModeSection({ modeId, words, color }) {
  const { t, lang } = useLang()
  const modeDef = MODES[modeId]
  const modeStats = getModeStats(modeId)
  const c = SECTION_COLORS[color]

  return (
    <div className={`mx-4 mb-4 ${c.bg} ${c.border} border-2 rounded-2xl p-4`}>
      <h2 className={`text-lg font-extrabold ${c.title} mb-1`}>{modeDef.emoji} {modeDef.label}</h2>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox value={modeStats.practiced} label={t('practiced')} bg="bg-white" text="text-gray-700" />
        <StatBox value={modeStats.mastered} label={t('mastered')} bg="bg-green-100" text="text-green-600" />
        <StatBox value={modeStats.weak} label={t('weak')} bg="bg-red-50" text="text-red-500" />
      </div>

      {modeDef.subModes.map(sub => {
        const stats = getWordStats(modeId, sub.id)
        if (stats.practiced === 0) return null
        return (
          <SubModeProgress
            key={sub.id}
            modeId={modeId}
            sub={sub}
            words={words}
            c={c}
          />
        )
      })}

      {modeStats.practiced === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          <span className="text-2xl block mb-2">📝</span>
          {t('noPracticed')}
        </div>
      )}
    </div>
  )
}

function SubModeProgress({ modeId, sub, words, c }) {
  const { t, lang } = useLang()
  const weak = getWeakWords(modeId, sub.id, words)

  return (
    <div className="mb-3">
      <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${c.sub} mb-2`}>
        {sub.emoji} {lang === 'es' ? sub.labelEs : sub.label}
      </div>
      <div className="space-y-2">
        {words.map(w => {
          const m = getMastery(modeId, sub.id, w.word)
          if (m < 0) return null
          const lm = sub.requireSpelling ? getLetterMastery(modeId, sub.id, w.word) : null
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
        <div className="mt-2 bg-red-50 rounded-xl p-3 border border-red-200">
          <div className="text-xs font-bold text-red-600 mb-1">{t('needsPracticeLabel')}</div>
          <div className="text-xs text-red-500 font-semibold">{weak.map(w => w.word).join(' · ')}</div>
        </div>
      )}
    </div>
  )
}

const SECTION_COLORS = {
  purple: {
    bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-700',
    bar: 'bg-purple-500', barBg: 'bg-purple-100', sub: 'bg-purple-100 text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50', border: 'border-orange-200', title: 'text-orange-600',
    bar: 'bg-orange-500', barBg: 'bg-orange-100', sub: 'bg-orange-100 text-orange-600',
  },
}

function StatBox({ value, label, bg, text }) {
  return (
    <div className={`${bg} rounded-xl p-2 text-center`}>
      <div className={`text-xl font-extrabold ${text}`}>{value}</div>
      <div className="text-[10px] text-gray-400 font-bold">{label}</div>
    </div>
  )
}
