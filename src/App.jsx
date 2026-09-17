import { useState } from 'react'
import Home from './screens/Home'
import Game from './screens/Game'
import Progress from './screens/Progress'
import { getStudentName, setStudentName, resetProgress, getGarden } from './storage'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠', iconActive: '🏡' },
  { id: 'progress', label: 'Progress', icon: '📊', iconActive: '📈' },
  { id: 'rewards', label: 'Rewards', icon: '🏆', iconActive: '🏆' },
  { id: 'settings', label: 'Parents', icon: '⚙️', iconActive: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [gameConfig, setGameConfig] = useState(null)

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
        {tab === 'settings' && <SettingsTab />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-nav z-50">
        <div className="flex pb-safe">
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center pt-2.5 pb-1 transition-all ${
                  active ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>
                  {active ? t.iconActive : t.icon}
                </span>
                <span className={`text-[10px] mt-0.5 ${active ? 'font-extrabold' : 'font-semibold'}`}>
                  {t.label}
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
  const sbGarden = getGarden('spellingBee')
  const bbGarden = getGarden('bumblebee')
  const flowers = sbGarden.flowers + bbGarden.flowers
  const bees = sbGarden.bees + bbGarden.bees

  const gardenRows = []
  const flowerEmojis = ['🌻', '🌷', '🌼', '🌸', '🌺', '💐']
  for (let i = 0; i < Math.min(flowers, 30); i++) {
    gardenRows.push(flowerEmojis[i % flowerEmojis.length])
  }

  return (
    <div className="animate-fade-up">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">Bee Garden</h1>
        <p className="text-sm text-gray-400 font-semibold">Complete blocks to grow your garden!</p>
      </div>

      <div className="mx-4 bg-gradient-to-b from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 min-h-[300px] relative overflow-hidden">
        {/* Sky */}
        <div className="text-center mb-4">
          {bees > 0
            ? <div className="text-4xl animate-float">{'🐝 '.repeat(Math.min(bees, 5))}</div>
            : <div className="text-4xl">☁️</div>}
        </div>

        {/* Garden */}
        {flowers > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {gardenRows.map((f, i) => (
              <span key={i} className="text-3xl" style={{ animationDelay: `${i * 0.1}s` }}>{f}</span>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-5xl mb-3">🌱</div>
            <p className="font-bold text-sm">Your garden is empty</p>
            <p className="text-xs mt-1">Complete word blocks to plant flowers!</p>
          </div>
        )}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-200/50 to-transparent" />
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🌻</div>
          <div className="text-2xl font-extrabold text-yellow-600">{flowers}</div>
          <div className="text-xs text-yellow-500 font-bold">Flowers</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🐝</div>
          <div className="text-2xl font-extrabold text-amber-600">{bees}</div>
          <div className="text-xs text-amber-500 font-bold">Bees</div>
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  const [name, setName] = useState(getStudentName())
  const [showConfirm, setShowConfirm] = useState(false)

  function handleNameChange(v) {
    setName(v)
    setStudentName(v)
  }

  return (
    <div className="animate-fade-up">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">Parents</h1>
        <p className="text-sm text-gray-400 font-semibold">Settings and configuration</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Student name */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</label>
          <input
            type="text"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Enter name..."
            className="w-full mt-2 text-lg font-bold px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        {/* About */}
        <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4">
          <h3 className="font-extrabold text-purple-700 text-sm mb-2">How it works</h3>
          <ul className="text-xs text-purple-600 space-y-1.5 font-semibold">
            <li>🐝 <strong>Spelling Bee:</strong> Spell each letter + read the word</li>
            <li>🌸 <strong>Bumblebee:</strong> Read the word (younger kids)</li>
            <li>🧸 <strong>Practice:</strong> No timer, learn at your pace</li>
            <li>🏆 <strong>Challenge:</strong> Timer on, test your speed</li>
            <li>⭐ <strong>Stars:</strong> 3 for perfect, 1 for correct</li>
          </ul>
        </div>

        {/* Reset */}
        <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} className="text-red-500 font-bold text-sm w-full text-left">
              🗑️ Reset all progress
            </button>
          ) : (
            <div>
              <p className="text-red-600 font-bold text-sm mb-3">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm">
                  Cancel
                </button>
                <button onClick={() => { resetProgress(); window.location.reload() }} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
