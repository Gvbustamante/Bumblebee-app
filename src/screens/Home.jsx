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
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">
            {playerName ? `${lang === 'es' ? '¡Hola' : 'Hi'}, ${playerName}!` : t('greeting')}
          </h1>
          <p className="text-sm text-gray-400 font-semibold">{t('whatToDo')}</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
          <span className="text-lg">⭐</span>
          <span className="font-extrabold text-yellow-600 text-sm">{stars}</span>
        </div>
      </div>

      <div className="mx-4 mt-2 flex gap-1.5">
        {Object.values(MODES).map(m => {
          const active = m.id === adventure
          const mc = MODE_PILL[m.color]
          return (
            <button
              key={m.id}
              onClick={() => { if (!active) updateProfile({ adventure: m.id }) }}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all active:scale-90 ${
                active ? `${mc.activeBg} border-2 ${mc.activeBorder}` : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              {m.img
                ? <img src={m.img} alt={m.label} className={`h-8 w-8 object-contain ${active ? '' : 'opacity-60'}`} />
                : <span className={active ? 'text-2xl' : 'text-xl opacity-60'}>{m.emoji}</span>
              }
              <span className={`text-[9px] font-bold mt-0.5 leading-tight ${active ? mc.activeText : 'text-gray-400'}`}>{m.label}</span>
            </button>
          )
        })}
      </div>

      <div className={`mx-4 mt-3 ${HERO_GRADIENT[modeDef.color]} rounded-3xl p-5 text-white relative overflow-hidden`}>
        {modeDef.img
          ? <img src={modeDef.img} alt="" className="absolute -right-4 -bottom-4 w-28 opacity-20 select-none" />
          : <div className="absolute -right-6 -bottom-6 text-[100px] opacity-10 select-none">{modeDef.emoji}</div>
        }
        <p className="text-white/70 text-sm font-semibold">{modeDef.label}</p>
        <p className="font-extrabold text-lg mt-0.5">{t('doingAmazing')}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${masteredPct}%` }} />
          </div>
          <span className="text-sm font-bold whitespace-nowrap">{stats.practiced}/{words.length}</span>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-lg font-extrabold text-gray-700 mb-3 px-1">{t('howToLearn')}</h2>
        <div className="space-y-3">
          {modeDef.subModes.map(sub => (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`w-full ${c.bg} ${c.border} border-2 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{sub.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-extrabold text-sm ${c.text}`}>
                    {lang === 'es' ? sub.labelEs : sub.label}
                  </div>
                  <div className="text-xs text-gray-400 font-semibold mt-0.5">
                    {lang === 'es' ? sub.descriptionEs : sub.description}
                  </div>
                </div>
                <span className="text-gray-300 text-lg font-bold">→</span>
              </div>
              <div className="mt-3 bg-white/60 rounded-xl p-3 flex items-center justify-center gap-3">
                {sub.preview.showImg && <span className="text-2xl">🐱</span>}
                {sub.preview.showTxt && <span className="font-extrabold text-purple-700 text-lg">CAT</span>}
                {sub.preview.showLetters && sub.preview.scrambled ? (
                  <div className="flex gap-1">
                    {['T', 'A', 'C'].map((l, i) => (
                      <span key={i} className="w-7 h-7 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-700 font-extrabold text-xs">{l}</span>
                    ))}
                    <span className="text-gray-400 mx-1">→</span>
                    {['C', 'A', 'T'].map((l, i) => (
                      <span key={i} className="w-7 h-7 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center text-green-700 font-extrabold text-xs">{l}</span>
                    ))}
                  </div>
                ) : sub.preview.showLetters ? (
                  <div className="flex gap-1">
                    {['C', 'A', 'T'].map((l, i) => (
                      <span key={i} className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700 font-extrabold text-xs">{l}</span>
                    ))}
                  </div>
                ) : null}
                {!sub.preview.showTxt && !sub.preview.showLetters && (
                  <span className="text-xs text-gray-400 font-bold">{t('sayTheWord')}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const HERO_GRADIENT = {
  purple: 'bg-gradient-to-br from-purple-600 to-purple-500',
  pink: 'bg-gradient-to-br from-pink-500 to-orange-400',
  blue: 'bg-gradient-to-br from-blue-600 to-cyan-500',
  amber: 'bg-gradient-to-br from-amber-500 to-yellow-400',
  indigo: 'bg-gradient-to-br from-indigo-600 to-violet-500',
}

const MODE_PILL = {
  purple: { activeBg: 'bg-purple-100', activeBorder: 'border-purple-300', activeText: 'text-purple-700' },
  pink: { activeBg: 'bg-pink-100', activeBorder: 'border-pink-300', activeText: 'text-pink-700' },
  blue: { activeBg: 'bg-blue-100', activeBorder: 'border-blue-300', activeText: 'text-blue-700' },
  amber: { activeBg: 'bg-amber-100', activeBorder: 'border-amber-300', activeText: 'text-amber-700' },
  indigo: { activeBg: 'bg-indigo-100', activeBorder: 'border-indigo-300', activeText: 'text-indigo-700' },
}

const SUB_COLORS = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-orange-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
}

function BlockSelect({ adventure, subMode, words, onBack, onStart }) {
  const { t } = useLang()
  const { session, profile } = useAuth()
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
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold active:scale-90 transition-transform">
          ←
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-gray-800">{t('chooseBlock')}</h2>
          <p className="text-xs text-gray-400 font-semibold">{t('pickWords')}</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {blocks.map((block, i) => {
          const allMastered = block.every(w => (masteryMap[w.word] ?? -1) >= 80)
          const anyPracticed = block.some(w => (masteryMap[w.word] ?? -1) >= 0)
          const masteredCount = block.filter(w => (masteryMap[w.word] ?? -1) >= 80).length

          return (
            <div key={i} className={`bg-white rounded-2xl shadow-card overflow-hidden border ${allMastered ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{allMastered ? '🌟' : anyPracticed ? '📖' : '🔒'}</span>
                    <span className="font-extrabold text-gray-700">{t('block')} {i + 1}</span>
                  </div>
                  {anyPracticed && (
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                      {masteredCount}/{block.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {block.map(w => {
                    const m = masteryMap[w.word] ?? -1
                    return (
                      <span key={w.word} className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        m >= 80 ? 'bg-green-100 text-green-600' :
                        m >= 0 ? 'bg-yellow-50 text-yellow-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {w.emoji} {w.word}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => onStart(block, i, false)}
                  className="flex-1 py-3 text-center text-sm font-bold text-purple-600 active:bg-purple-50 transition-colors"
                >
                  🧸 {t('practice')}
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => onStart(block, i, true)}
                  className="flex-1 py-3 text-center text-sm font-bold text-orange-500 active:bg-orange-50 transition-colors"
                >
                  🏆 {t('challenge')}
                </button>
              </div>
            </div>
          )
        })}

        {words.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-purple-200">
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <div className="flex-1">
                  <span className="font-extrabold text-purple-700 text-sm">{t('allWords')}</span>
                  <div className="text-xs text-purple-400 font-semibold">{words.length} {t('words')}</div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-purple-100">
              <button
                onClick={() => onStart(words, -2, false)}
                className="flex-1 py-3 text-center text-sm font-bold text-purple-600 active:bg-purple-50 transition-colors"
              >
                🧸 {t('practice')}
              </button>
              <div className="w-px bg-purple-100" />
              <button
                onClick={() => onStart(words, -2, true)}
                className="flex-1 py-3 text-center text-sm font-bold text-orange-500 active:bg-orange-50 transition-colors"
              >
                🏆 {t('challenge')}
              </button>
            </div>
          </div>
        )}

        {weakWords.length > 0 && (
          <button
            onClick={() => onStart(weakWords.slice(0, bSize), -1, false)}
            className="w-full bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <div>
                <div className="font-extrabold text-red-600 text-sm">{t('reviewWeak')}</div>
                <div className="text-xs text-red-400 font-semibold">{weakWords.length} {t('needsPractice')}</div>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
