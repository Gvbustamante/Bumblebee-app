import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (!loading && window.__dismissSplash) window.__dismissSplash()
  }, [loading])

  if (loading) return null

  if (!session) return <Login />
  if (!profile?.adventure) return <AdventureSelect />

  return <MainApp />
}

function MainApp() {
  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem('sbk-tab') || 'home' } catch { return 'home' }
  })
  const [gameConfig, setGameConfig] = useState(null)
  const [selectedSubMode, setSelectedSubMode] = useState(null)
  const { t } = useLang()
  const { isAdmin } = useAuth()
  const scrollRef = useRef()

  function switchTab(id) {
    setTab(id)
    try { sessionStorage.setItem('sbk-tab', id) } catch {}
    if (scrollRef.current) scrollRef.current.scrollTo(0, 0)
  }

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
        <Game config={gameConfig} onExit={() => setGameConfig(null)} onExitHome={() => { setGameConfig(null); setSelectedSubMode(null) }} />
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-20">
        {tab === 'home' && <Home onStartGame={setGameConfig} selectedSubMode={selectedSubMode} setSelectedSubMode={setSelectedSubMode} />}
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
                onClick={() => switchTab(tb.id)}
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

  const FLOWERS = ['🌻', '🌷', '🌼', '🌸', '🌺', '🌹', '💐', '🪻']
  const spots = []
  const rows = [
    { y: 55, cols: 6, x0: 4, dx: 16, sz: 'text-lg', op: 0.7 },
    { y: 44, cols: 5, x0: 11, dx: 17, sz: 'text-xl', op: 0.8 },
    { y: 33, cols: 6, x0: 4, dx: 16, sz: 'text-2xl', op: 0.9 },
    { y: 22, cols: 5, x0: 11, dx: 17, sz: 'text-2xl', op: 0.95 },
    { y: 10, cols: 6, x0: 4, dx: 16, sz: 'text-3xl', op: 1 },
  ]
  rows.forEach((row, ri) => {
    for (let c = 0; c < row.cols; c++) {
      spots.push({
        left: `${row.x0 + c * row.dx}%`,
        bottom: `${row.y}%`,
        size: row.sz, opacity: row.op,
        flower: FLOWERS[(ri * 7 + c * 3) % FLOWERS.length],
      })
    }
  })
  const flowerCount = Math.min(garden.flowers, spots.length)
  const beeCount = Math.min(garden.bees, 6)

  return (
    <div className="animate-fade-up bg-brand-bg min-h-screen">
      <div className="px-5 pt-5 pb-2">
        <h1 className="text-xl font-extrabold" style={{ color: '#4A8C2A' }}>🌿 {t('myGarden')}</h1>
        <p className="text-xs font-semibold" style={{ color: '#6BAF4A' }}>{t('gardenGrows')}</p>
      </div>

      <div className="mx-4 rounded-3xl overflow-hidden relative" style={{
        height: '440px',
        background: 'linear-gradient(180deg, #87CEEB 0%, #B8E4FF 28%, #7BC950 28.5%, #6BAF4A 55%, #5A9E3A 100%)',
        border: '2.5px solid #5A9E3A',
        boxShadow: '0 8px 32px rgba(90,158,58,0.25)',
      }}>
        <div className="absolute text-4xl opacity-50 animate-float select-none" style={{ left: '8%', top: '2%' }}>☁️</div>
        <div className="absolute text-3xl opacity-40 animate-float select-none" style={{ left: '50%', top: '5%', animationDelay: '1.5s' }}>☁️</div>
        <div className="absolute text-2xl opacity-35 animate-float select-none" style={{ left: '78%', top: '7%', animationDelay: '3s' }}>☁️</div>
        <div className="absolute text-3xl animate-sparkle select-none" style={{ right: '6%', top: '2%' }}>☀️</div>

        <div className="absolute text-lg animate-float select-none" style={{ left: '28%', top: '12%', animationDelay: '0.5s' }}>🦋</div>
        <div className="absolute text-lg animate-float select-none" style={{ right: '22%', top: '9%', animationDelay: '2s' }}>🦋</div>

        <div className="absolute text-5xl select-none" style={{ left: '0%', top: '14%' }}>🌳</div>
        <div className="absolute text-5xl select-none" style={{ right: '0%', top: '16%' }}>🌳</div>
        <div className="absolute text-4xl select-none" style={{ left: '13%', top: '18%', opacity: 0.5 }}>🌲</div>
        <div className="absolute text-4xl select-none" style={{ right: '13%', top: '20%', opacity: 0.5 }}>🌲</div>

        {Array.from({ length: beeCount }).map((_, i) => (
          <div key={`b${i}`} className="absolute animate-float select-none" style={{
            left: `${18 + i * 14}%`, top: `${14 + (i % 3) * 4}%`,
            animationDelay: `${i * 0.5}s`, fontSize: '1.4rem',
          }}>🐝</div>
        ))}

        {spots.slice(0, flowerCount).map((s, i) => (
          <div key={`f${i}`} className={`absolute ${s.size} select-none`}
            style={{ left: s.left, bottom: s.bottom, opacity: s.opacity }}>
            {s.flower}
          </div>
        ))}

        <div className="absolute text-lg select-none" style={{ left: '6%', bottom: '3%' }}>🍄</div>
        <div className="absolute text-lg select-none" style={{ right: '8%', bottom: '4%' }}>🍄</div>
        <div className="absolute text-xs select-none" style={{ left: '22%', bottom: '2%' }}>🐛</div>
        <div className="absolute text-xs select-none" style={{ right: '24%', bottom: '3%' }}>🐞</div>
        <div className="absolute text-sm select-none" style={{ left: '42%', bottom: '2%', opacity: 0.5 }}>🌿</div>
        <div className="absolute text-sm select-none" style={{ right: '38%', bottom: '5%', opacity: 0.5 }}>🌿</div>

        {flowerCount === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '28%' }}>
            <div className="text-6xl mb-3 animate-float">🌱</div>
            <p className="font-extrabold text-white text-base drop-shadow-md">{t('gardenEmpty')}</p>
            <p className="text-xs text-white/80 font-semibold mt-1 drop-shadow">{t('plantFlowers')}</p>
          </div>
        )}
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 gap-2.5 pb-4">
        <div className="rounded-2xl p-3.5 text-center" style={{ background: '#FFFBEA', border: '2px solid #FFD84D' }}>
          <div className="text-2xl mb-0.5">⭐</div>
          <div className="text-2xl font-extrabold" style={{ color: '#A07B00' }}>{stars}</div>
          <div className="text-[10px] font-bold" style={{ color: '#D4A017' }}>{t('totalStars')}</div>
        </div>
        <div className="rounded-2xl p-3.5 text-center" style={{ background: '#E8F5E0', border: '2px solid #8ED36B' }}>
          <div className="text-2xl mb-0.5">🌻</div>
          <div className="text-2xl font-extrabold" style={{ color: '#4A8C2A' }}>{garden.flowers}</div>
          <div className="text-[10px] font-bold" style={{ color: '#6BAF4A' }}>{t('flowers')}</div>
        </div>
        <div className="rounded-2xl p-3.5 text-center" style={{ background: '#FFF8E1', border: '2px solid #FFD84D' }}>
          <div className="text-2xl mb-0.5">🐝</div>
          <div className="text-2xl font-extrabold" style={{ color: '#D4A017' }}>{garden.bees}</div>
          <div className="text-[10px] font-bold" style={{ color: '#D4A017' }}>{t('bees')}</div>
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
                {l === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('voiceLanguage')}</label>
          <div className="flex gap-2 mt-2">
            {['es', 'en'].map(l => (
              <button
                key={l}
                onClick={() => updateProfile({ voice_lang: l })}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                  (profile?.voice_lang || 'en') === l ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
                }`}
              >
                {l === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
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
            {[3, 5, 7, 10, 14].map(s => (
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
