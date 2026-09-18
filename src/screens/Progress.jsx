import { useState, useEffect } from 'react'
import { MODES } from '../data/modes'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, getStars, getAdventureStats, getBulkMastery } from '../lib/db'

const SECTION_COLORS = {
  purple: { bar: '#9B6DDF', barBg: '#F2E8FF', tagBg: '#F2E8FF', tagText: '#57358F' },
  pink: { bar: '#F58BB5', barBg: '#FFF1F5', tagBg: '#FFF1F5', tagText: '#C0457B' },
  blue: { bar: '#72B7E8', barBg: '#EEF7FF', tagBg: '#EEF7FF', tagText: '#2E78B0' },
  amber: { bar: '#FFD84D', barBg: '#FFFBEA', tagBg: '#FFFBEA', tagText: '#A07B00' },
  indigo: { bar: '#7B78D8', barBg: '#F1F2FF', tagBg: '#F1F2FF', tagText: '#4B48A0' },
}

export default function Progress() {
  const { t, lang } = useLang()
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
    <div className="animate-fade-up bg-brand-bg min-h-screen pb-4">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold" style={{ color: '#57358F' }}>{t('progress')}</h1>
        <p className="text-xs font-semibold" style={{ color: '#9B6DDF' }}>{t('trackJourney')}</p>
      </div>

      <div
        className="mx-4 rounded-3xl p-5 pb-4 mb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFFBEA 0%, #FFF8E1 50%, #FFF3C4 100%)',
          border: '2px solid #FFD84D',
          boxShadow: '0 6px 24px rgba(255,216,77,0.2)',
          minHeight: '140px',
        }}
      >
        <img
          src="/images/block-complete.webp"
          alt=""
          className="absolute -right-2 -bottom-1 w-44 h-44 object-contain select-none pointer-events-none animate-float"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(255,216,77,0.3))' }}
        />
        <div className="relative z-10 max-w-[55%]">
          <div className="text-4xl font-extrabold" style={{ color: '#A07B00' }}>
            <span className="inline-block animate-sparkle">⭐</span> {stars}
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: '#D4A017' }}>{t('totalStars')}</div>
          <div className="flex items-center gap-1.5 mt-3">
            {modeDef.img && <img src={modeDef.img} alt="" className="w-6 h-6 object-contain" />}
            <span className="text-xs font-bold" style={{ color: '#A07B00' }}>{modeDef.label}</span>
          </div>
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ background: '#FFD84D30', color: '#A07B00' }}>
            {stats.practiced} {t('practiced').toLowerCase()}
          </span>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-3 gap-2 mb-4">
        <StatBox value={stats.practiced} label={t('practiced')} bg="#F2E8FF" text="#57358F" />
        <StatBox value={stats.mastered} label={t('mastered')} bg="#E8F5E0" text="#4A8C2A" />
        <StatBox value={stats.weak} label={t('weak')} bg="#FFF1F5" text="#C0457B" />
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
    if (!session || !words.length) return
    const uid = session.user.id
    getBulkMastery(uid, adventure, sub.id).then(bulk => {
      const data = []
      const weak = []
      for (const w of words) {
        const b = bulk[w.word]
        if (!b) continue
        data.push({
          ...w,
          mastery: b.mastery,
          letterMastery: sub.requireSpelling ? b.letterMastery : null,
        })
        if (b.mastery >= 0 && b.mastery < 60) weak.push(w)
      }
      setWordData(data)
      setWeakWords(weak)
    })
  }, [session, adventure, sub.id, words])

  if (!wordData.length) return null

  return (
    <div className="mx-4 mb-4">
      <div
        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
        style={{ background: c.tagBg, color: c.tagText }}
      >
        {sub.emoji} {lang === 'es' ? sub.labelEs : sub.label}
      </div>
      <div className="space-y-2">
        {wordData.map(w => (
          <div
            key={w.word}
            className="bg-brand-card rounded-xl p-2.5 flex items-center gap-2 shadow-card"
            style={{ border: '1px solid #E8E0F0' }}
          >
            <span className="text-lg w-7 text-center">{w.emoji}</span>
            <span className="font-bold text-sm w-12" style={{ color: '#57358F' }}>{w.word}</span>
            <div className="flex-1">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: c.barBg }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(w.mastery, 0)}%`, background: c.bar }}
                />
              </div>
              {w.letterMastery && (
                <div className="flex gap-0.5 mt-1">
                  {w.word.split('').map((l, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-bold"
                      style={{
                        color: w.letterMastery[i] < 0 ? '#B0A0C0'
                          : w.letterMastery[i] >= 80 ? '#4A8C2A'
                          : w.letterMastery[i] >= 50 ? '#A07B00'
                          : '#C0457B',
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold w-8 text-right" style={{ color: '#B0A0C0' }}>
              {w.mastery < 0 ? '—' : `${w.mastery}%`}
            </span>
          </div>
        ))}
      </div>

      {weakWords.length > 0 && (
        <div
          className="mt-2 rounded-xl p-3"
          style={{ background: '#FFF1F5', border: '1px solid #F58BB5' }}
        >
          <div className="text-xs font-bold mb-1" style={{ color: '#C0457B' }}>{t('needsPracticeLabel')}</div>
          <div className="text-xs font-semibold" style={{ color: '#F58BB5' }}>{weakWords.map(w => w.word).join(' · ')}</div>
        </div>
      )}
    </div>
  )
}

function StatBox({ value, label, bg, text }) {
  return (
    <div
      className="rounded-xl p-2 text-center shadow-card"
      style={{ background: bg, border: '1px solid #E8E0F0' }}
    >
      <div className="text-xl font-extrabold" style={{ color: text }}>{value}</div>
      <div className="text-[10px] font-bold" style={{ color: '#B0A0C0' }}>{label}</div>
    </div>
  )
}
