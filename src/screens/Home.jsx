import { useState, useEffect } from 'react'
import { getBlocks } from '../data/words'
import { MODES, getSubMode } from '../data/modes'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, getStars, getAdventureStats, getBulkMastery, getWeakWordsGlobal, fetchAllWords } from '../lib/db'

export default function Home({ onStartGame, selectedSubMode, setSelectedSubMode }) {
  const { t, lang } = useLang()
  const { session, profile } = useAuth()
  const adventure = profile?.adventure
  const modeDef = MODES[adventure]
  const [words, setWords] = useState([])
  const [subWords, setSubWords] = useState([])
  const [stars, setStarsVal] = useState(0)
  const [stats, setStats] = useState({ practiced: 0, mastered: 0 })

  useEffect(() => {
    if (!session || !adventure) return
    fetchWords(adventure).then(setWords)
    getStars(session.user.id, adventure).then(setStarsVal)
    getAdventureStats(session.user.id, adventure).then(setStats)
  }, [session, adventure])

  useEffect(() => {
    if (!session || !adventure || !selectedSubMode) return
    const sub = getSubMode(adventure, selectedSubMode)
    const cat = sub?.category || 'words'
    fetchWords(adventure, false, cat).then(setSubWords)
  }, [session, adventure, selectedSubMode])

  if (!modeDef) return null

  if (selectedSubMode) {
    return (
      <BlockSelect
        adventure={adventure}
        subMode={selectedSubMode}
        words={subWords}
        stars={stars}
        onBack={() => setSelectedSubMode(null)}
        onStart={(block, idx, challenge) => onStartGame({
          mode: adventure,
          subMode: selectedSubMode,
          block,
          blockIndex: idx,
          isChallenge: challenge,
        })}
      />
    )
  }

  return (
    <SubModeSelect
      adventure={adventure}
      stars={stars}
      stats={stats}
      words={words}
      onSelect={setSelectedSubMode}
    />
  )
}

function WeekStreak() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const activeDates = profile?.active_dates || []

  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))

  const days = lang === 'es'
    ? ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const weekDates = days.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const streak = activeDates.filter(d => weekDates.includes(d)).length

  return (
    <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: '#FFF8E1', border: '1.5px solid #FFD84D' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-extrabold text-sm" style={{ color: '#D4A017' }}>
            {lang === 'es' ? 'Racha semanal' : 'Weekly streak'}
          </span>
        </div>
        <span className="font-extrabold text-sm px-2.5 py-1 rounded-full" style={{ background: '#FFD84D', color: '#8B6914' }}>
          {streak}/7
        </span>
      </div>
      <div className="flex justify-between gap-1">
        {days.map((label, i) => {
          const active = activeDates.includes(weekDates[i])
          const isToday = weekDates[i] === today.toISOString().slice(0, 10)
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold transition-all"
                style={active
                  ? { background: 'linear-gradient(135deg, #FFD84D, #F5C518)', color: '#8B6914', boxShadow: '0 2px 8px rgba(245,197,24,0.4)' }
                  : { background: '#F5EDD0', color: '#C8B060' }}
              >
                {active ? '✓' : '·'}
              </div>
              <span className={`text-[10px] font-bold ${isToday ? 'text-amber-700' : 'text-amber-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SubModeSelect({ adventure, stars, stats, words, onSelect }) {
  const modeDef = MODES[adventure]
  const mc = MODE_THEME[modeDef.color]
  const { t, lang } = useLang()
  const { profile, updateProfile } = useAuth()
  const playerName = profile?.name

  return (
    <div className="animate-fade-up min-h-screen" style={{ background: '#F8F5FF' }}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-1">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold leading-tight" style={{ color: '#2D1B4E' }}>
            {playerName ? `${lang === 'es' ? '¡Hola' : 'Hi'}, ${playerName}! 👋` : t('greeting')}
          </h1>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#9B6DDF' }}>
            {lang === 'es' ? '¡Sigamos aprendiendo palabras en inglés!' : "Let's keep learning English words!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#FFF8E1', border: '1.5px solid #FFD84D' }}>
            <span className="text-sm">⭐</span>
            <span className="font-extrabold text-sm tabular-nums" style={{ color: '#D4A017' }}>{stars}</span>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F2E8FF' }}>
            <svg className="w-5 h-5" style={{ color: '#9B6DDF' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
        </div>
      </div>

      <WeekStreak />

      <div className="px-4 mt-4 lg:flex lg:gap-4">
        <div
          className="rounded-3xl p-5 text-white relative overflow-hidden lg:flex-1"
          style={{
            background: `linear-gradient(135deg, ${mc.heroGradient.includes('#') ? mc.heroGradient.split(',')[1]?.trim() || mc.accent : mc.accent}, ${mc.accent})`,
            backgroundImage: mc.heroGradient,
            boxShadow: `0 6px 24px ${mc.accent}35`,
          }}
        >
          {modeDef.img && (
            <img src={modeDef.img} alt="" className="absolute right-3 bottom-2 w-32 lg:w-40 opacity-80 select-none pointer-events-none drop-shadow-lg" />
          )}
          <div className="relative z-10 pr-28 lg:pr-36">
            <p className="font-extrabold text-xl lg:text-2xl">{modeDef.label}</p>
            <p className="text-white/80 text-sm font-semibold mt-1">
              {lang === 'es' ? modeDef.subtitleEs : modeDef.subtitle}
            </p>
            <button
              onClick={() => onSelect(modeDef.subModes[0]?.id)}
              className="mt-4 px-6 py-2.5 rounded-full font-extrabold text-sm active:scale-95 transition-transform inline-flex items-center gap-2"
              style={{ background: '#fff', color: mc.accent, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            >
              {lang === 'es' ? '¡Jugar ahora!' : 'Play now!'} <span>→</span>
            </button>
          </div>
        </div>

      </div>

      <div className="px-4 mt-5 pb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-extrabold" style={{ color: '#2D1B4E' }}>{t('howToLearn')}</h2>
          <button
            onClick={() => updateProfile({ adventure: null })}
            className="text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            style={{ background: '#F2E8FF', color: '#7B4FBF' }}
          >
            🗺️ {t('changeAdventure')}
          </button>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {modeDef.subModes.filter(sub => {
            const hiddenSubs = profile?.hidden_submodes || []
            return !hiddenSubs.includes(`${adventure}:${sub.id}`)
          }).map((sub, i) => (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`animate-fade-up animate-stagger-${Math.min(i + 1, 4)} bg-white rounded-2xl active:scale-[0.97] transition-all duration-200 shadow-card hover:shadow-card-hover overflow-hidden`}
              style={{ border: '2px solid #EDE5F5' }}
            >
              <div className="flex flex-col items-center px-3 pt-5 pb-3 gap-1">
                {sub.img ? (
                  <img src={sub.img} alt="" className="w-24 h-24 object-contain drop-shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl" style={{ background: mc.modeBg }}>
                    {modeDef.emoji}
                  </div>
                )}
                <div className="text-center mt-1">
                  <div className="font-extrabold text-xs" style={{ color: mc.accent }}>
                    {lang === 'es' ? sub.labelEs : sub.label}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const MODE_THEME = {
  purple: {
    modeBg: '#F2E8FF',
    accent: '#57358F',
    heroGradient: 'linear-gradient(135deg, #9B6DDF, #7B4FBF)',
  },
  pink: {
    modeBg: '#FFF1F5',
    accent: '#C0457B',
    heroGradient: 'linear-gradient(135deg, #F58BB5, #E06090)',
  },
  blue: {
    modeBg: '#EEF7FF',
    accent: '#2E78B0',
    heroGradient: 'linear-gradient(135deg, #72B7E8, #5098CC)',
  },
  amber: {
    modeBg: '#FFFBEA',
    accent: '#A07B00',
    heroGradient: 'linear-gradient(135deg, #FFD84D, #E8C030)',
  },
  indigo: {
    modeBg: '#F1F2FF',
    accent: '#4B48A0',
    heroGradient: 'linear-gradient(135deg, #7B78D8, #5955B8)',
  },
}

function BlockSelect({ adventure, subMode, words, stars, onBack, onStart }) {
  const { t, lang } = useLang()
  const { session, profile } = useAuth()
  const modeDef = MODES[adventure]
  const mc = MODE_THEME[modeDef?.color] || MODE_THEME.purple
  const subDef = getSubMode(adventure, subMode)
  const bSize = profile?.block_size || 5
  const blocks = getBlocks(words, bSize)
  const [masteryMap, setMasteryMap] = useState({})
  const [weakWords, setWeakWords] = useState([])
  const [allAdventureWords, setAllAdventureWords] = useState([])

  useEffect(() => {
    if (!session || !words.length) return
    const uid = session.user.id
    getBulkMastery(uid, adventure, subMode).then(bulk => {
      const map = {}
      for (const w of words) {
        map[w.word] = bulk[w.word]?.mastery ?? -1
      }
      setMasteryMap(map)
    })
    getWeakWordsGlobal(uid, adventure).then(globalWeak => {
      const wordSet = new Set(words.map(w => w.word))
      const matched = globalWeak
        .filter(gw => wordSet.has(gw.word))
        .map(gw => {
          const orig = words.find(w => w.word === gw.word)
          return orig ? { ...orig, mastery: gw.mastery, avgTime: gw.avgTime } : null
        })
        .filter(Boolean)
      setWeakWords(matched)
    })
    fetchAllWords(adventure).then(setAllAdventureWords)
  }, [session, adventure, subMode, words])

  return (
    <div className="animate-fade-up min-h-screen" style={{ background: '#F8F5FF' }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-1">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-2xl font-bold active:scale-90 transition-transform"
          style={{ background: '#F2E8FF', color: '#7B4FBF' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold" style={{ color: '#2D1B4E' }}>
            {lang === 'es' ? (subDef?.labelEs || modeDef?.label) : (subDef?.label || modeDef?.label)}
          </h2>
          <p className="text-xs font-semibold" style={{ color: '#9B6DDF' }}>{t('pickWords')}</p>
        </div>
        {modeDef?.img && (
          <img src={modeDef.img} alt="" className="w-14 h-14 object-contain hidden lg:block" />
        )}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#FFF8E1', border: '1.5px solid #FFD84D' }}>
          <span className="text-sm">⭐</span>
          <span className="font-extrabold text-sm tabular-nums" style={{ color: '#D4A017' }}>{stars}</span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="grid gap-3 md:grid-cols-2 mb-3">
          {allAdventureWords.length > bSize && (
            <button
              onClick={() => {
                const shuffled = [...allAdventureWords].sort(() => Math.random() - 0.5)
                onStart(shuffled.slice(0, bSize), -3, false)
              }}
              className="w-full bg-white rounded-2xl shadow-card active:scale-[0.97] transition-all overflow-hidden text-left"
              style={{ border: '2px solid #EDE5F5' }}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: mc.modeBg }}>🎲</div>
                <div className="flex-1">
                  <span className="font-extrabold text-sm" style={{ color: mc.accent }}>{t('randomBlock')}</span>
                  <div className="text-[11px] font-semibold" style={{ color: '#9B6DDF' }}>{t('randomBlockDesc')}</div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: mc.modeBg }}>
                  <span className="text-sm font-bold" style={{ color: mc.accent }}>→</span>
                </div>
              </div>
            </button>
          )}

          {words.length > 0 && (
            <button
              onClick={() => onStart(words, -2, false)}
              className="w-full bg-white rounded-2xl shadow-card active:scale-[0.97] transition-all overflow-hidden text-left"
              style={{ border: '2px solid #EDE5F5' }}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: mc.modeBg }}>📚</div>
                <div className="flex-1">
                  <span className="font-extrabold text-sm" style={{ color: mc.accent }}>{t('allWords')}</span>
                  <div className="text-[11px] font-semibold" style={{ color: '#9B6DDF' }}>{words.length} {t('words')}</div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: mc.modeBg }}>
                  <span className="text-sm font-bold" style={{ color: mc.accent }}>→</span>
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(() => {
            const maxBlocks = profile?.max_blocks
            const hiddenBlocks = profile?.hidden_blocks || []
            const limited = maxBlocks ? blocks.slice(0, maxBlocks) : blocks
            return limited.filter((_, i) => !hiddenBlocks.includes(i + 1))
          })().map((block, i) => {
            const allMastered = block.every(w => (masteryMap[w.word] ?? -1) >= 80)
            const anyPracticed = block.some(w => (masteryMap[w.word] ?? -1) >= 0)
            const masteredCount = block.filter(w => (masteryMap[w.word] ?? -1) >= 80).length
            const pct = block.length > 0 ? Math.round((masteredCount / block.length) * 100) : 0
            const firstEmoji = block[0]?.emoji || '📖'

            return (
              <button
                key={i}
                onClick={() => onStart(block, i, false)}
                className={`animate-fade-up animate-stagger-${Math.min(i + 1, 4)} w-full bg-white rounded-2xl shadow-card active:scale-[0.97] transition-all text-left overflow-hidden`}
                style={{ border: allMastered ? '2px solid #8ED36B' : '2px solid #EDE5F5' }}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: allMastered ? '#E8F5E0' : anyPracticed ? '#FFFBEA' : '#F3F0F8' }}>
                    {allMastered ? '🌟' : firstEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm" style={{ color: '#2D1B4E' }}>{t('block')} {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">⭐</span>
                        <span className="text-xs font-bold" style={{ color: '#D4A017' }}>{masteredCount}/{block.length}</span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: '#F0ECF5' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${pct}%`,
                        background: allMastered ? 'linear-gradient(90deg, #8ED36B, #6BBF4A)' : pct > 0 ? 'linear-gradient(90deg, #72B7E8, #5098CC)' : 'transparent',
                      }} />
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F2E8FF' }}>
                    <svg className="w-4 h-4" style={{ color: '#7B4FBF' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {weakWords.length > 0 && (
          <button
            onClick={() => onStart(weakWords.slice(0, bSize), -1, false)}
            className="w-full bg-white rounded-2xl shadow-card active:scale-[0.97] transition-all text-left overflow-hidden mt-3"
            style={{ border: '2px solid #F58BB5' }}
          >
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#FFF1F5' }}>💪</div>
              <div className="flex-1">
                <span className="font-extrabold text-sm" style={{ color: '#C0457B' }}>{t('weakWordsBlock')}</span>
                <div className="text-[11px] font-semibold" style={{ color: '#F58BB5' }}>{weakWords.length} {t('needsPractice')}</div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#FFF1F5' }}>
                <svg className="w-4 h-4" style={{ color: '#C0457B' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
