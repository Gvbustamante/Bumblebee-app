import { useState, useEffect } from 'react'
import { MODES } from '../data/modes'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, getStars, getAdventureStats, getWordStats, getMastery, getLetterMastery, getWeakWords } from '../lib/db'

export default function Progress() {
  const { t } = useLang()
  const { session, profile } = useAuth()
  const adventure = profile?.adventure
  const [stars, setStarsVal] = useState(0)
  const [words, setWords] = useState([])
  const [stats, setStats] = useState({ practiced: 0, mastered: 0, weak: 0 })

  useEffect(() => {
    if (!session || !adventure) return
    const uid = session.user.id
    getStars(uid, adventure).then(setStarsVal)
    fetchWords(adventure).then(setWords)
    getAdventureStats(uid, adventure).then(setStats)
  }, [session, adventure])

  const modeDef = MODES[adventure]
  if (!modeDef) return null

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
            <div className="text-sm font-bold text-gray-500">{modeDef.emoji} {modeDef.label}</div>
            <div className="text-xs text-yellow-500 font-bold">{stats.practiced} {t('practiced').toLowerCase()}</div>
          </div>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-3 gap-2 mb-4">
        <StatBox value={stats.practiced} label={t('practiced')} bg="bg-white" text="text-gray-700" />
        <StatBox value={stats.mastered} label={t('mastered')} bg="bg-green-100" text="text-green-600" />
        <StatBox value={stats.weak} label={t('weak')} bg="bg-red-50" text="text-red-500" />
      </div>

      {modeDef.subModes.map(sub => (
        <SubModeProgress key={sub.id} adventure={adventure} sub={sub} words={words} />
      ))}
    </div>
  )
}

function SubModeProgress({ adventure, sub, words }) {
  const { t, lang } = useLang()
  const { session } = useAuth()
  const [wordData, setWordData] = useState([])
  const [weakWords, setWeakWords] = useState([])
  const modeColor = MODES[adventure]?.color || 'purple'
  const c = SECTION_COLORS[modeColor] || SECTION_COLORS.purple

  useEffect(() => {
    if (!session) return
    const uid = session.user.id
    async function load() {
      const data = []
      for (const w of words) {
        const m = await getMastery(uid, adventure, sub.id, w.word)
        if (m < 0) continue
        const lm = sub.requireSpelling ? await getLetterMastery(uid, adventure, sub.id, w.word) : null
        data.push({ ...w, mastery: m, letterMastery: lm })
      }
      setWordData(data)
      const weak = await getWeakWords(uid, adventure, sub.id, words)
      setWeakWords(weak)
    }
    load()
  }, [session, adventure, sub.id, words])

  if (!wordData.length) return null

  return (
    <div className="mx-4 mb-4">
      <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${c.sub} mb-2`}>
        {sub.emoji} {lang === 'es' ? sub.labelEs : sub.label}
      </div>
      <div className="space-y-2">
        {wordData.map(w => (
          <div key={w.word} className="bg-white rounded-xl p-2.5 flex items-center gap-2 shadow-card border border-gray-100">
            <span className="text-lg w-7 text-center">{w.emoji}</span>
            <span className="font-bold text-sm w-12 text-gray-700">{w.word}</span>
            <div className="flex-1">
              <div className={`h-2 ${c.barBg} rounded-full overflow-hidden`}>
                <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${Math.max(w.mastery, 0)}%` }} />
              </div>
              {w.letterMastery && (
                <div className="flex gap-0.5 mt-1">
                  {w.word.split('').map((l, i) => (
                    <span key={i} className={`text-[9px] font-bold ${
                      w.letterMastery[i] < 0 ? 'text-gray-300' : w.letterMastery[i] >= 80 ? 'text-green-500' : w.letterMastery[i] >= 50 ? 'text-yellow-500' : 'text-red-400'
                    }`}>
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold text-gray-400 w-8 text-right">
              {w.mastery < 0 ? '—' : `${w.mastery}%`}
            </span>
          </div>
        ))}
      </div>

      {weakWords.length > 0 && (
        <div className="mt-2 bg-red-50 rounded-xl p-3 border border-red-200">
          <div className="text-xs font-bold text-red-600 mb-1">{t('needsPracticeLabel')}</div>
          <div className="text-xs text-red-500 font-semibold">{weakWords.map(w => w.word).join(' · ')}</div>
        </div>
      )}
    </div>
  )
}

const SECTION_COLORS = {
  purple: { bar: 'bg-purple-500', barBg: 'bg-purple-100', sub: 'bg-purple-100 text-purple-600' },
  pink: { bar: 'bg-pink-500', barBg: 'bg-pink-100', sub: 'bg-pink-100 text-pink-600' },
  blue: { bar: 'bg-blue-500', barBg: 'bg-blue-100', sub: 'bg-blue-100 text-blue-600' },
  amber: { bar: 'bg-amber-500', barBg: 'bg-amber-100', sub: 'bg-amber-100 text-amber-600' },
  indigo: { bar: 'bg-indigo-500', barBg: 'bg-indigo-100', sub: 'bg-indigo-100 text-indigo-600' },
}

function StatBox({ value, label, bg, text }) {
  return (
    <div className={`${bg} rounded-xl p-2 text-center shadow-card border border-gray-100`}>
      <div className={`text-xl font-extrabold ${text}`}>{value}</div>
      <div className="text-[10px] text-gray-400 font-bold">{label}</div>
    </div>
  )
}
