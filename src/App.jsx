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
import { getStars, getGarden } from './lib/db'

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
  const { t } = useLang()
  const { isAdmin } = useAuth()

  const TABS = [
    { id: 'home', label: t('navHome'), icon: 'home' },
    { id: 'progress', label: t('navProgress'), icon: 'progress' },
    { id: 'rewards', label: t('navRewards'), icon: 'rewards' },
    { id: 'help', label: t('navHelp'), icon: 'help' },
    { id: 'settings', label: t('navParents'), icon: 'settings' },
    ...(isAdmin ? [{ id: 'admin', label: t('navAdmin'), icon: 'admin' }] : []),
  ]

  if (gameConfig) {
    return (
      <div className="app-shell">
        <Game config={gameConfig} onExit={() => setGameConfig(null)} />
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === 'home' && <Home onStartGame={setGameConfig} />}
        {tab === 'progress' && <Progress />}
        {tab === 'rewards' && <RewardsTab />}
        {tab === 'help' && <HelpTab />}
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
                  active ? 'text-purple-600' : 'text-gray-300'
                }`}
              >
                <NavIcon name={tb.icon} active={active} />
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
  const { profile, updateProfile, signOut } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const [showConfirm, setShowConfirm] = useState(false)

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
        {/* Language toggle */}
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

        {/* Student name */}
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

        {/* Block size */}
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

        {/* Image size */}
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

        {/* Change adventure */}
        <button
          onClick={() => updateProfile({ adventure: null })}
          className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 text-left"
        >
          <div className="font-extrabold text-purple-600 text-sm">{t('changeAdventure')}</div>
          <div className="text-xs text-purple-400 font-semibold mt-0.5">
            {MODES[profile?.adventure]?.emoji} {MODES[profile?.adventure]?.label}
          </div>
        </button>

        {/* How it works */}
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

        {/* Logout */}
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

const SVG_ICONS = {
  home: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />,
  progress: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  rewards: <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
  help: <><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" /><circle cx="12" cy="12" r="10" /></>,
  settings: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  admin: <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />,
}

function NavIcon({ name, active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={active ? 2 : 1.5} stroke="currentColor"
      className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`}
    >
      {SVG_ICONS[name]}
    </svg>
  )
}

function HelpTab() {
  const { t } = useLang()
  const steps = [
    { icon: '🗺️', title: t('helpStep1Title'), desc: t('helpStep1') },
    { icon: '🎯', title: t('helpStep2Title'), desc: t('helpStep2') },
    { icon: '🔤', title: t('helpStep3Title'), desc: t('helpStep3') },
    { icon: '⭐', title: t('helpStep4Title'), desc: t('helpStep4') },
    { icon: '🌻', title: t('helpStep5Title'), desc: t('helpStep5') },
    { icon: '📊', title: t('helpStep6Title'), desc: t('helpStep6') },
  ]
  return (
    <div className="animate-fade-up pb-4">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">{t('helpTitle')}</h1>
      </div>
      <div className="px-4 space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex gap-4 items-start">
            <div className="text-3xl mt-0.5">{s.icon}</div>
            <div className="flex-1">
              <div className="font-extrabold text-sm text-purple-700">{i + 1}. {s.title}</div>
              <div className="text-xs text-gray-500 font-semibold mt-1 leading-relaxed">{s.desc}</div>
            </div>
          </div>
        ))}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🐝</div>
          <div className="text-xs font-bold text-yellow-600">{t('helpTip')}</div>
        </div>
      </div>
    </div>
  )
}
