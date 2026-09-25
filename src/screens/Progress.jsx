import { useState, useEffect } from 'react'
import { MODES } from '../data/modes'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, getStars, getWordMasteryMap } from '../lib/db'

const ACCENT = {
  purple: '#57358F', pink: '#C0457B', blue: '#2E78B0',
  amber: '#A07B00', indigo: '#4B48A0',
}

export default function Progress() {
  const { t } = useLang()
  const { session, profile } = useAuth()
  const adventure = profile?.adventure
  const modeDef = MODES[adventure]
  const [stars, setStarsVal] = useState(0)
  const [words, setWords] = useState([])
  const [masteryMap, setMasteryMap] = useState({})

  useEffect(() => {
    if (!session || !adventure) return
    const uid = session.user.id
    getStars(uid, adventure).then(setStarsVal)
    fetchWords(adventure).then(setWords)
    getWordMasteryMap(uid, adventure).then(setMasteryMap)
  }, [session, adventure])

  if (!modeDef) return null

  const accent = ACCENT[modeDef.color] || '#57358F'
  const mastered = words.filter(w => (masteryMap[w.word] ?? -1) >= 80)
  const learning = words.filter(w => { const m = masteryMap[w.word] ?? -1; return m >= 0 && m < 80 })
  const fresh = words.filter(w => (masteryMap[w.word] ?? -1) < 0)

  return (
    <div className="animate-fade-up bg-brand-bg min-h-screen pb-4">
      <div className="px-5 pt-5 pb-2">
        <h1 className="text-xl font-extrabold" style={{ color: accent }}>
          🌟 {t('myWords')}
        </h1>
        <p className="text-xs font-semibold" style={{ color: '#9B6DDF' }}>{t('lookHowMuch')}</p>
      </div>

      <div
        className="mx-4 mb-4 rounded-2xl p-4 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFFBEA, #FFF3C4)', border: '2px solid #FFD84D' }}
      >
        <img
          src="/images/block-complete.webp" alt=""
          className="absolute -right-2 -bottom-1 w-36 h-36 object-contain select-none pointer-events-none opacity-30 animate-float"
        />
        <div className="relative z-10">
          <div className="text-4xl font-extrabold" style={{ color: '#A07B00' }}>
            <span className="inline-block animate-sparkle">⭐</span> {stars}
          </div>
          <div className="text-xs font-bold mt-0.5" style={{ color: '#D4A017' }}>{t('totalStars')}</div>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-3 gap-2.5 mb-5">
        <div className="rounded-2xl p-3 text-center" style={{ background: '#E8F5E0', border: '2px solid #8ED36B' }}>
          <div className="text-3xl mb-0.5">😄</div>
          <div className="text-2xl font-extrabold" style={{ color: '#4A8C2A' }}>{mastered.length}</div>
          <div className="text-[10px] font-bold leading-tight" style={{ color: '#6BAF4A' }}>{t('iKnow')}</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: '#FFFBEA', border: '2px solid #FFD84D' }}>
          <div className="text-3xl mb-0.5">🤔</div>
          <div className="text-2xl font-extrabold" style={{ color: '#A07B00' }}>{learning.length}</div>
          <div className="text-[10px] font-bold leading-tight" style={{ color: '#C4A020' }}>{t('imLearning')}</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: '#F2E8FF', border: '2px solid #C9A8F0' }}>
          <div className="text-3xl mb-0.5">✨</div>
          <div className="text-2xl font-extrabold" style={{ color: '#57358F' }}>{fresh.length}</div>
          <div className="text-[10px] font-bold leading-tight" style={{ color: '#9B6DDF' }}>{t('newWordsLabel')}</div>
        </div>
      </div>

      {mastered.length > 0 && (
        <WordSection
          icon="😄" label={t('iKnow')} color="#4A8C2A"
          words={mastered} bg="#E8F5E0" border="#8ED36B" badge="🌟"
        />
      )}

      {learning.length > 0 && (
        <WordSection
          icon="🤔" label={t('imLearning')} color="#A07B00"
          words={learning} bg="#FFFBEA" border="#FFD84D" badge=""
        />
      )}

      {fresh.length > 0 && (
        <WordSection
          icon="✨" label={t('newWordsLabel')} color="#57358F"
          words={fresh} bg="#F2E8FF" border="#D9C4F0" badge=""
        />
      )}
    </div>
  )
}

function WordSection({ icon, label, color, words, bg, border, badge }) {
  return (
    <div className="mx-4 mb-4">
      <div className="text-sm font-extrabold mb-2 flex items-center gap-1.5" style={{ color }}>
        {icon} {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {words.map(w => (
          <div
            key={w.word}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm"
            style={{ background: bg, color, border: `1.5px solid ${border}` }}
          >
            <span className="text-lg">{w.emoji}</span>
            <span>{w.word}</span>
            {badge && <span className="text-base">{badge}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
