import { useState, useEffect } from 'react'
import { getBlocks } from '../data/words'
import { MODES, getSubMode } from '../data/modes'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, getStars, getAdventureStats, getMastery, getWeakWords } from '../lib/db'

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
  const c = SUB_COLORS[modeDef.color]
  const { t, lang } = useLang()
  const { profile, updateProfile } = useAuth()
  const masteredPct = words.length ? Math.round((stats.mastered / words.length) * 100) : 0
  const playerName = profile?.name

  return (
    <div className="animate-fade-up">
      {/* Header: greeting + active mode icon + stars */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-1">
        {modeDef.img && (
          <img src={modeDef.img} alt={modeDef.label} className="w-14 h-14 object-contain drop-shadow-sm" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-gray-800 leading-tight">
            {playerName ? `${lang === 'es' ? '¡Hola' : 'Hi'}, ${playerName}!` : t('greeting')}
          </h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{t('whatToDo')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-1.5 rounded-full border border-yellow-200/80 shadow-sm">
          <span className="text-base">⭐</span>
          <span className="font-extrabold text-amber-600 text-sm tabular-nums">{stars}</span>
        </div>
      </div>

      {/* Mode switcher pills */}
      <div className="mx-4 mt-3 flex gap-1.5">
        {Object.values(MODES).map(m => {
          const active = m.id === adventure
          const mc = MODE_PILL[m.color]
          return (
            <button
              key={m.id}
              onClick={() => { if (!active) updateProfile({ adventure: m.id }) }}
              className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all duration-200 active:scale-90 ${
                active
                  ? `${mc.activeBg} border-2 ${mc.activeBorder} shadow-sm`
                  : 'bg-white/60 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span className={`text-[10px] font-bold leading-tight ${active ? mc.activeText : 'text-gray-400'}`}>{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* Hero progress card */}
      <div className={`mx-4 mt-4 ${HERO_GRADIENT[modeDef.color]} rounded-3xl p-5 text-white relative overflow-hidden shadow-glow-${modeDef.color}`}>
        {modeDef.img && (
          <img src={modeDef.img} alt="" className="absolute -right-1 -bottom-1 w-28 opacity-30 select-none pointer-events-none" />
        )}
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{modeDef.label}</p>
          <p className="font-extrabold text-lg mt-1 leading-snug">{t('doingAmazing')}</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(masteredPct, 2)}%` }}
              />
            </div>
            <span className="text-sm font-bold whitespace-nowrap tabular-nums">{stats.practiced}/{words.length}</span>
          </div>
        </div>
      </div>

      {/* Sub-mode cards */}
      <div className="px-4 mt-6 pb-4">
        <h2 className="text-base font-extrabold text-gray-700 mb-3 px-1">{t('howToLearn')}</h2>
        <div className="space-y-3">
          {modeDef.subModes.map((sub, i) => (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`animate-fade-up animate-stagger-${i + 1} w-full bg-white ${c.border} border rounded-2xl text-left active:scale-[0.97] transition-all duration-200 shadow-card hover:shadow-card-hover relative overflow-hidden`}
            >
              {sub.img && (
                <img src={sub.img} alt="" className="absolute -left-1 -bottom-1 w-[72px] h-[72px] object-contain select-none pointer-events-none opacity-90" />
              )}
              <div className="flex items-center gap-2 p-4 pl-[76px]">
                <div className="flex-1 min-w-0">
                  <div className={`font-extrabold text-sm ${c.text}`}>
                    {lang === 'es' ? sub.labelEs : sub.label}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-0.5 leading-snug">
                    {lang === 'es' ? sub.descriptionEs : sub.description}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full ${c.arrowBg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-sm font-bold ${c.text}`}>→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const HERO_GRADIENT = {
  purple: 'bg-gradient-to-br from-purple-600 via-purple-500 to-violet-500',
  pink: 'bg-gradient-to-br from-pink-500 via-rose-400 to-orange-400',
  blue: 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500',
  amber: 'bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400',
  indigo: 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500',
}

const MODE_PILL = {
  purple: { activeBg: 'bg-purple-50', activeBorder: 'border-purple-200', activeText: 'text-purple-700' },
  pink: { activeBg: 'bg-pink-50', activeBorder: 'border-pink-200', activeText: 'text-pink-700' },
  blue: { activeBg: 'bg-blue-50', activeBorder: 'border-blue-200', activeText: 'text-blue-700' },
  amber: { activeBg: 'bg-amber-50', activeBorder: 'border-amber-200', activeText: 'text-amber-700' },
  indigo: { activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-200', activeText: 'text-indigo-700' },
}

const SUB_COLORS = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', arrowBg: 'bg-purple-50' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', arrowBg: 'bg-pink-50' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', arrowBg: 'bg-blue-50' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', arrowBg: 'bg-amber-50' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', arrowBg: 'bg-indigo-50' },
}

function BlockSelect({ adventure, subMode, words, onBack, onStart }) {
  const { t, lang } = useLang()
  const { session, profile } = useAuth()
  const modeDef = MODES[adventure]
  const c = SUB_COLORS[modeDef?.color] || SUB_COLORS.purple
  const bSize = profile?.block_size || 5
  const blocks = getBlocks(words, bSize)
  const [masteryMap, setMasteryMap] = useState({})
  const [weakWords, setWeakWords] = useState([])

  useEffect(() => {
    if (!session) return
    const uid = session.user.id
    async function load() {
      const map = {}
      for (const w of words) {
        map[w.word] = await getMastery(uid, adventure, subMode, w.word)
      }
      setMasteryMap(map)
      const weak = await getWeakWords(uid, adventure, subMode, words)
      setWeakWords(weak)
    }
    load()
  }, [session, adventure, subMode, words])

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.arrowBg} ${c.text} font-bold active:scale-90 transition-transform shadow-sm`}>
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-gray-800">{t('chooseBlock')}</h2>
          <p className="text-xs text-gray-400 font-semibold">{t('pickWords')}</p>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-4">
        {blocks.map((block, i) => {
          const allMastered = block.every(w => (masteryMap[w.word] ?? -1) >= 80)
          const anyPracticed = block.some(w => (masteryMap[w.word] ?? -1) >= 0)
          const masteredCount = block.filter(w => (masteryMap[w.word] ?? -1) >= 80).length

          return (
            <div key={i} className={`animate-fade-up animate-stagger-${Math.min(i + 1, 4)} bg-white rounded-2xl shadow-card overflow-hidden border ${allMastered ? 'border-green-200' : 'border-gray-100/80'}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                      allMastered ? 'bg-green-50' : anyPracticed ? 'bg-amber-50' : 'bg-gray-50'
                    }`}>
                      {allMastered ? '🌟' : anyPracticed ? '📖' : '🔒'}
                    </div>
                    <span className="font-extrabold text-gray-700 text-sm">{t('block')} {i + 1}</span>
                  </div>
                  {anyPracticed && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      allMastered ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {masteredCount}/{block.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {block.map(w => {
                    const m = masteryMap[w.word] ?? -1
                    return (
                      <span key={w.word} className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                        m >= 80 ? 'bg-green-50 text-green-600' :
                        m >= 0 ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {w.emoji} {w.word}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="flex border-t border-gray-50">
                <button
                  onClick={() => onStart(block, i, false)}
                  className={`flex-1 py-3 text-center text-xs font-bold ${c.text} active:bg-gray-50 transition-colors`}
                >
                  🧸 {t('practice')}
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => onStart(block, i, true)}
                  className="flex-1 py-3 text-center text-xs font-bold text-orange-500 active:bg-orange-50/50 transition-colors"
                >
                  🏆 {t('challenge')}
                </button>
              </div>
            </div>
          )
        })}

        {words.length > 0 && (
          <div className={`bg-white rounded-2xl shadow-card overflow-hidden border ${c.border}`}>
            <div className="p-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${c.arrowBg} flex items-center justify-center text-lg`}>📚</div>
                <div className="flex-1">
                  <span className={`font-extrabold text-sm ${c.text}`}>{t('allWords')}</span>
                  <div className="text-[11px] text-gray-400 font-semibold">{words.length} {t('words')}</div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-50">
              <button
                onClick={() => onStart(words, -2, false)}
                className={`flex-1 py-3 text-center text-xs font-bold ${c.text} active:bg-gray-50 transition-colors`}
              >
                🧸 {t('practice')}
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={() => onStart(words, -2, true)}
                className="flex-1 py-3 text-center text-xs font-bold text-orange-500 active:bg-orange-50/50 transition-colors"
              >
                🏆 {t('challenge')}
              </button>
            </div>
          </div>
        )}

        {weakWords.length > 0 && (
          <button
            onClick={() => onStart(weakWords.slice(0, bSize), -1, false)}
            className="w-full bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-2xl p-4 text-left active:scale-[0.97] transition-all duration-200 shadow-card"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-lg">💪</div>
              <div>
                <div className="font-extrabold text-red-600 text-sm">{t('reviewWeak')}</div>
                <div className="text-[11px] text-red-400 font-semibold">{weakWords.length} {t('needsPractice')}</div>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
