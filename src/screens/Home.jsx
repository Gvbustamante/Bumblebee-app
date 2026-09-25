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

function SubModeSelect({ adventure, stars, stats, words, onSelect }) {
  const modeDef = MODES[adventure]
  const mc = MODE_THEME[modeDef.color]
  const { t, lang } = useLang()
  const { profile, updateProfile } = useAuth()
  const masteredPct = words.length ? Math.round((stats.mastered / words.length) * 100) : 0
  const playerName = profile?.name

  return (
    <div className="animate-fade-up bg-brand-bg min-h-screen">
      <div className="flex items-center gap-3 px-5 pt-5 pb-1">
        {modeDef.img && (
          <img src={modeDef.img} alt={modeDef.label} className="w-14 h-14 object-contain drop-shadow-sm" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-brand-dark leading-tight">
            {playerName ? `${lang === 'es' ? '¡Hola' : 'Hi'}, ${playerName}!` : t('greeting')}
          </h1>
          <p className="text-xs font-semibold mt-0.5" style={{ color: '#9B6DDF' }}>{t('whatToDo')}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #FFF8E1, #FFFBEA)', border: '1.5px solid #FFD84D' }}>
          <span className="text-base">⭐</span>
          <span className="font-extrabold text-sm tabular-nums" style={{ color: '#D4A017' }}>{stars}</span>
        </div>
      </div>

      <div className="mx-4 mt-3 flex gap-1.5">
        {Object.values(MODES).map(m => {
          const active = m.id === adventure
          const pill = MODE_THEME[m.color]
          return (
            <button
              key={m.id}
              onClick={() => { if (!active) updateProfile({ adventure: m.id }) }}
              className="flex-1 flex items-center justify-center py-2 rounded-xl transition-all duration-200 active:scale-90"
              style={{
                background: active ? pill.modeBg : '#FFFFFF',
                border: active ? `2px solid ${pill.accent}` : '1.5px solid #E8E0F0',
                boxShadow: active ? '0 2px 8px rgba(155,109,223,0.1)' : 'none',
              }}
            >
              <span className="text-[10px] font-bold leading-tight" style={{ color: active ? pill.accent : '#B0A0C0' }}>{m.label}</span>
            </button>
          )
        })}
      </div>

      <div
        className="mx-4 mt-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: mc.heroGradient, boxShadow: `0 4px 20px ${mc.accent}30` }}
      >
        {modeDef.img && (
          <img src={modeDef.img} alt="" className="absolute -right-1 -bottom-1 w-28 opacity-30 select-none pointer-events-none" />
        )}
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{modeDef.label}</p>
          <p className="font-extrabold text-lg mt-1 leading-snug">{t('doingAmazing')}</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(masteredPct, 2)}%`, background: 'linear-gradient(90deg, #FFD84D, #FFE680)' }}
              />
            </div>
            <span className="text-sm font-bold whitespace-nowrap tabular-nums">{stats.practiced}/{words.length}</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-4">
        <h2 className="text-base font-extrabold text-brand-dark mb-3 px-1">{t('howToLearn')}</h2>
        <div className="space-y-3">
          {modeDef.subModes.map((sub, i) => (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`animate-fade-up animate-stagger-${i + 1} w-full bg-brand-card rounded-2xl text-left active:scale-[0.97] transition-all duration-200 shadow-card hover:shadow-card-hover relative overflow-hidden`}
              style={{ border: `1.5px solid ${mc.modeBg}` }}
            >
              {sub.img && (
                <img src={sub.img} alt="" className="absolute -left-1 -bottom-1 w-[72px] h-[72px] object-contain select-none pointer-events-none opacity-90" />
              )}
              <div className="flex items-center gap-2 p-4 pl-[76px]">
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm" style={{ color: mc.accent }}>
                    {lang === 'es' ? sub.labelEs : sub.label}
                  </div>
                  <div className="text-[11px] font-medium mt-0.5 leading-snug" style={{ color: '#9B6DDF' }}>
                    {lang === 'es' ? sub.descriptionEs : sub.description}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: mc.modeBg }}>
                  <span className="text-sm font-bold" style={{ color: mc.accent }}>→</span>
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

function BlockSelect({ adventure, subMode, words, onBack, onStart }) {
  const { t, lang } = useLang()
  const { session, profile } = useAuth()
  const modeDef = MODES[adventure]
  const mc = MODE_THEME[modeDef?.color] || MODE_THEME.purple
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
    <div className="animate-fade-up bg-brand-bg min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl font-bold active:scale-90 transition-transform shadow-sm"
          style={{ background: mc.modeBg, color: mc.accent }}
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-brand-dark">{t('chooseBlock')}</h2>
          <p className="text-xs font-semibold" style={{ color: '#9B6DDF' }}>{t('pickWords')}</p>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-4">
        {allAdventureWords.length > bSize && (
          <div className="bg-brand-card rounded-2xl shadow-card overflow-hidden" style={{ border: `1.5px solid ${mc.modeBg}` }}>
            <div className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: mc.modeBg }}>🎲</div>
                <div className="flex-1">
                  <span className="font-extrabold text-sm" style={{ color: mc.accent }}>{t('randomBlock')}</span>
                  <div className="text-[11px] font-semibold" style={{ color: '#9B6DDF' }}>{t('randomBlockDesc')}</div>
                </div>
              </div>
            </div>
            <div className="flex" style={{ borderTop: '1px solid #F3F0F8' }}>
              <button
                onClick={() => {
                  const shuffled = [...allAdventureWords].sort(() => Math.random() - 0.5)
                  onStart(shuffled.slice(0, bSize), -3, false)
                }}
                className="flex-1 py-3 text-center text-xs font-bold active:opacity-70 transition-colors"
                style={{ color: mc.accent }}
              >
                🧸 {t('practice')}
              </button>
              <div className="w-px" style={{ background: '#F3F0F8' }} />
              <button
                onClick={() => {
                  const shuffled = [...allAdventureWords].sort(() => Math.random() - 0.5)
                  onStart(shuffled.slice(0, bSize), -3, true)
                }}
                className="flex-1 py-3 text-center text-xs font-bold active:opacity-70 transition-colors"
                style={{ color: '#F58BB5' }}
              >
                🏆 {t('challenge')}
              </button>
            </div>
          </div>
        )}

        {words.length > 0 && (
          <div className="bg-brand-card rounded-2xl shadow-card overflow-hidden" style={{ border: `1.5px solid ${mc.modeBg}` }}>
            <div className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: mc.modeBg }}>📚</div>
                <div className="flex-1">
                  <span className="font-extrabold text-sm" style={{ color: mc.accent }}>{t('allWords')}</span>
                  <div className="text-[11px] font-semibold" style={{ color: '#9B6DDF' }}>{words.length} {t('words')}</div>
                </div>
              </div>
            </div>
            <div className="flex" style={{ borderTop: '1px solid #F3F0F8' }}>
              <button
                onClick={() => onStart(words, -2, false)}
                className="flex-1 py-3 text-center text-xs font-bold active:opacity-70 transition-colors"
                style={{ color: mc.accent }}
              >
                🧸 {t('practice')}
              </button>
              <div className="w-px" style={{ background: '#F3F0F8' }} />
              <button
                onClick={() => onStart(words, -2, true)}
                className="flex-1 py-3 text-center text-xs font-bold active:opacity-70 transition-colors"
                style={{ color: '#F58BB5' }}
              >
                🏆 {t('challenge')}
              </button>
            </div>
          </div>
        )}

        {blocks.map((block, i) => {
          const allMastered = block.every(w => (masteryMap[w.word] ?? -1) >= 80)
          const anyPracticed = block.some(w => (masteryMap[w.word] ?? -1) >= 0)
          const masteredCount = block.filter(w => (masteryMap[w.word] ?? -1) >= 80).length

          return (
            <div
              key={i}
              className={`animate-fade-up animate-stagger-${Math.min(i + 1, 4)} bg-brand-card rounded-2xl shadow-card overflow-hidden`}
              style={{ border: allMastered ? '1.5px solid #8ED36B' : '1.5px solid #E8E0F0' }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: allMastered ? '#E8F5E0' : anyPracticed ? '#FFFBEA' : '#F3F0F8' }}
                    >
                      {allMastered ? '🌟' : anyPracticed ? '📖' : '🔒'}
                    </div>
                    <span className="font-extrabold text-brand-dark text-sm">{t('block')} {i + 1}</span>
                  </div>
                  {anyPracticed && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: allMastered ? '#E8F5E0' : '#FFFBEA',
                        color: allMastered ? '#4A8C2A' : '#A07B00',
                      }}
                    >
                      {masteredCount}/{block.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {block.map(w => {
                    const m = masteryMap[w.word] ?? -1
                    return (
                      <span
                        key={w.word}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg"
                        style={{
                          background: m >= 80 ? '#E8F5E0' : m >= 0 ? '#FFFBEA' : '#F3F0F8',
                          color: m >= 80 ? '#4A8C2A' : m >= 0 ? '#A07B00' : '#B0A0C0',
                        }}
                      >
                        {w.emoji} {w.word}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #F3F0F8' }}>
                <button
                  onClick={() => onStart(block, i, false)}
                  className="w-full py-3 text-center text-xs font-bold active:opacity-70 transition-colors"
                  style={{ color: mc.accent }}
                >
                  🧸 {t('practice')}
                </button>
              </div>
            </div>
          )
        })}

        {weakWords.length > 0 && (
          <div
            className="bg-brand-card rounded-2xl shadow-card overflow-hidden"
            style={{ border: '1.5px solid #F58BB5' }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: '#FFF1F5' }}>💪</div>
                  <div>
                    <span className="font-extrabold text-sm" style={{ color: '#C0457B' }}>{t('weakWordsBlock')}</span>
                    <div className="text-[10px] font-semibold" style={{ color: '#F58BB5' }}>{weakWords.length} {t('needsPractice')}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {weakWords.slice(0, 10).map(w => (
                  <span
                    key={w.word}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: '#FFF1F5', color: '#C0457B' }}
                  >
                    {w.emoji} {w.word}
                  </span>
                ))}
                {weakWords.length > 10 && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background: '#FFF1F5', color: '#F58BB5' }}>
                    +{weakWords.length - 10}
                  </span>
                )}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #F3F0F8' }}>
              <button
                onClick={() => onStart(weakWords.slice(0, bSize), -1, false)}
                className="w-full py-3 text-center text-xs font-bold active:opacity-70 transition-colors"
                style={{ color: '#C0457B' }}
              >
                🧸 {t('practice')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
