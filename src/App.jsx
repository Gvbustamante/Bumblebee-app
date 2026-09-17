import { useState, useEffect } from 'react'
import Home from './screens/Home'
import Game from './screens/Game'
import Progress from './screens/Progress'
import Login from './screens/Login'
import AdventureSelect from './screens/AdventureSelect'
import Admin from './screens/Admin'
import { MODES } from './data/modes'
import { useLang } from './data/i18n'
import { useAuth } from './data/AuthContext'
import { getStars, getGarden, resetProgress } from './lib/db'
import sounds from './lib/sounds'

export default function App() {
  const { session, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen bg-purple-50">
        <div className="text-4xl animate-float">🐝</div>
      </div>
    )
  }

  if (!session) return <Login />
  if (!profile?.adventure) return <AdventureSelect />

  return <MainApp />
}

function MainApp() {
  const [tab, setTab] = useState('home')
  const [gameConfig, setGameConfig] = useState(null)
  const [selectedSubMode, setSelectedSubMode] = useState(null)
  const { t } = useLang()
  const { isAdmin } = useAuth()

  const TABS = [
    { id: 'home', label: t('navHome'), icon: '🏠', iconActive: '🏡' },
    { id: 'progress', label: t('navProgress'), icon: '📊', iconActive: '📈' },
    { id: 'rewards', label: t('navRewards'), icon: '🏆', iconActive: '🏆' },
    { id: 'settings', label: t('navParents'), icon: '⚙️', iconActive: '⚙️' },
    ...(isAdmin ? [{ id: 'admin', label: t('navAdmin'), icon: '🔧', iconActive: '🔧' }] : []),
  ]

  if (gameConfig) {
    return (
      <div className="app-shell">
        <Game config={gameConfig} onExit={() => setGameConfig(null)} onExitHome={() => { setGameConfig(null); setSelectedSubMode(null) }} />
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === 'home' && <Home onStartGame={setGameConfig} selectedSubMode={selectedSubMode} setSelectedSubMode={setSelectedSubMode} />}
        {tab === 'progress' && <Progress />}
        {tab === 'rewards' && <RewardsTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'admin' && isAdmin && <Admin />}
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-nav z-50">
        <div className="flex pb-safe">
          {TABS.map(tb => {
            const active = tab === tb.id
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex-1 flex flex-col items-center pt-2.5 pb-1 transition-all ${
                  active ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>
                  {active ? tb.iconActive : tb.icon}
                </span>
                <span className={`text-[10px] mt-0.5 ${active ? 'font-extrabold' : 'font-semibold'}`}>
                  {tb.label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-purple-500 mt-0.5" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function RewardsTab() {
  const { t } = useLang()
  const { session, profile } = useAuth()
  const [garden, setGarden] = useState({ flowers: 0, bees: 0 })
  const [stars, setStarsVal] = useState(0)

  useEffect(() => {
    if (!session || !profile?.adventure) return
    getStars(session.user.id, profile.adventure).then(setStarsVal)
    getGarden(session.user.id, profile.adventure).then(setGarden)
  }, [session, profile?.adventure])

  const gardenRows = []
  const flowerEmojis = ['🌻', '🌷', '🌼', '🌸', '🌺', '💐']
  for (let i = 0; i < Math.min(garden.flowers, 30); i++) {
    gardenRows.push(flowerEmojis[i % flowerEmojis.length])
  }

  return (
    <div className="animate-fade-up">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">{t('beeGarden')}</h1>
        <p className="text-sm text-gray-400 font-semibold">{t('completeBlocks')}</p>
      </div>

      <div className="mx-4 bg-gradient-to-b from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 min-h-[300px] relative overflow-hidden">
        <div className="text-center mb-4">
          {garden.bees > 0
            ? <div className="text-4xl animate-float">{'🐝 '.repeat(Math.min(garden.bees, 5))}</div>
            : <div className="text-4xl">☁️</div>}
        </div>

        {garden.flowers > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {gardenRows.map((f, i) => (
              <span key={i} className="text-3xl" style={{ animationDelay: `${i * 0.1}s` }}>{f}</span>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-5xl mb-3">🌱</div>
            <p className="font-bold text-sm">{t('gardenEmpty')}</p>
            <p className="text-xs mt-1">{t('plantFlowers')}</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-200/50 to-transparent" />
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-2xl font-extrabold text-yellow-600">{stars}</div>
          <div className="text-xs text-yellow-500 font-bold">{t('totalStars')}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🌻</div>
          <div className="text-2xl font-extrabold text-yellow-600">{garden.flowers}</div>
          <div className="text-xs text-yellow-500 font-bold">{t('flowers')}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🐝</div>
          <div className="text-2xl font-extrabold text-amber-600">{garden.bees}</div>
          <div className="text-xs text-amber-500 font-bold">{t('bees')}</div>
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  const { t, lang, setLang } = useLang()
  const { session, profile, updateProfile, signOut } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const muteFx = !!profile?.mute_fx
  const muteVoice = !!profile?.mute_voice

  function handleNameChange(v) {
    setName(v)
    updateProfile({ name: v })
  }

  return (
    <div className="animate-fade-up">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">{t('parents')}</h1>
        <p className="text-sm text-gray-400 font-semibold">{t('settingsDesc')}</p>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('soundEffects')}</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { sounds.muteFx = false; updateProfile({ mute_fx: false }) }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-1 ${
                !muteFx ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
              }`}
            >
              🔔 ON
            </button>
            <button
              onClick={() => { sounds.muteFx = true; updateProfile({ mute_fx: true }) }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-1 ${
                muteFx ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
              }`}
            >
              🔇 OFF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('voice')}</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { sounds.muteVoice = false; updateProfile({ mute_voice: false }) }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-1 ${
                !muteVoice ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
              }`}
            >
              🗣️ ON
            </button>
            <button
              onClick={() => { sounds.muteVoice = true; updateProfile({ mute_voice: true }) }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-1 ${
                muteVoice ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
              }`}
            >
              🤐 OFF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('language')}</label>
          <div className="flex gap-2 mt-2">
            {['es', 'en'].map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); updateProfile({ lang: l }) }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                  lang === l ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('studentName')}</label>
          <input
            type="text"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder={t('enterName')}
            className="w-full mt-2 text-lg font-bold px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('wordsPerBlock')}</label>
          <div className="flex gap-2 mt-2">
            {[3, 5, 7, 10].map(s => (
              <button
                key={s}
                onClick={() => updateProfile({ block_size: s })}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                  s === (profile?.block_size || 5) ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('imageSize')}</label>
          <div className="flex gap-2 mt-2">
            {[{ id: 'small', label: t('imgSmall') }, { id: 'medium', label: t('imgMedium') }, { id: 'large', label: t('imgLarge') }].map(s => (
              <button
                key={s.id}
                onClick={() => updateProfile({ image_size: s.id })}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                  s.id === (profile?.image_size || 'medium') ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => updateProfile({ adventure: null })}
          className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 text-left"
        >
          <div className="font-extrabold text-purple-600 text-sm">{t('changeAdventure')}</div>
          <div className="text-xs text-purple-400 font-semibold mt-0.5">
            {MODES[profile?.adventure]?.emoji} {MODES[profile?.adventure]?.label}
          </div>
        </button>

        <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4">
          <h3 className="font-extrabold text-purple-700 text-sm mb-2">{t('howItWorks')}</h3>
          <ul className="text-xs text-purple-600 space-y-1.5 font-semibold">
            <li>🐝 {t('howSpelling')}</li>
            <li>🌸 {t('howBumblebee')}</li>
            <li>🧸 {t('howPractice')}</li>
            <li>🏆 {t('howChallenge')}</li>
            <li>⭐ {t('howStars')}</li>
            <li>🔄 {t('howQueue')}</li>
          </ul>
        </div>

        <button
          onClick={async () => {
            if (!confirm(t('resetConfirm'))) return
            await resetProgress(session.user.id)
            alert(t('resetDone'))
          }}
          className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center"
        >
          <span className="text-orange-500 font-bold text-sm">{t('resetProgress')}</span>
        </button>

        <button
          onClick={signOut}
          className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center"
        >
          <span className="text-red-500 font-bold text-sm">{t('logout')}</span>
        </button>
      </div>
    </div>
  )
}
