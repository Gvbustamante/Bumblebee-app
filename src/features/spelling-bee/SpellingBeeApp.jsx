import { useState } from 'react'
import { SPELLING_BEE_WORDS, BUMBLEBEE_WORDS, getBlocks } from './data/words'
import { getStudentName, setStudentName as saveName, getMastery, getGarden, getWeakWords } from './storage'
import GameScreen from './GameScreen'
import ProgressScreen from './ProgressScreen'

export default function SpellingBeeApp() {
  const [screen, setScreen] = useState('home')
  const [gameConfig, setGameConfig] = useState(null)
  const [name, setName] = useState(getStudentName())

  function startGame(mode, blockIndex, isChallenge = false) {
    const words = mode === 'spellingBee' ? SPELLING_BEE_WORDS : BUMBLEBEE_WORDS
    const blocks = getBlocks(words)
    const block = blocks[blockIndex]
    if (!block) return
    setGameConfig({ mode, block, blockIndex, isChallenge })
    setScreen('game')
  }

  function startReview(mode) {
    const words = mode === 'spellingBee' ? SPELLING_BEE_WORDS : BUMBLEBEE_WORDS
    const weak = getWeakWords(mode, words)
    if (!weak.length) return
    setGameConfig({ mode, block: weak.slice(0, 5), blockIndex: -1, isChallenge: false })
    setScreen('game')
  }

  function handleName(n) { setName(n); saveName(n) }

  if (screen === 'game' && gameConfig) {
    return <GameScreen config={gameConfig} onBack={() => setScreen('home')} />
  }
  if (screen === 'progress') {
    return <ProgressScreen onBack={() => setScreen('home')} />
  }

  const sbBlocks = getBlocks(SPELLING_BEE_WORDS)
  const bbBlocks = getBlocks(BUMBLEBEE_WORDS)
  const sbGarden = getGarden('spellingBee')
  const bbGarden = getGarden('bumblebee')
  const sbWeak = getWeakWords('spellingBee', SPELLING_BEE_WORDS)
  const bbWeak = getWeakWords('bumblebee', BUMBLEBEE_WORDS)
  const totalFlowers = sbGarden.flowers + bbGarden.flowers
  const totalBees = sbGarden.bees + bbGarden.bees

  return (
    <div className="min-h-screen pb-8" style={{ background: '#FFF8D6' }}>
      {/* Header */}
      <div className="text-center pt-8 pb-3">
        <div className="text-6xl mb-1">🐝</div>
        <h1 className="text-3xl font-bold text-amber-800">Spelling Bee Kids</h1>
        <p className="text-amber-600 text-sm mt-1">Learn · Practice · Win!</p>
      </div>

      {/* Student name */}
      <div className="max-w-sm mx-auto px-4 mb-4">
        <input
          type="text"
          value={name}
          onChange={e => handleName(e.target.value)}
          placeholder="Student name..."
          className="w-full text-center text-lg px-4 py-3 rounded-xl border-2 border-amber-300 bg-white/80 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Garden */}
      {totalFlowers > 0 && (
        <div className="text-center mb-4">
          <div className="text-2xl">{'🐝'.repeat(Math.min(totalBees, 5))}</div>
          <div className="text-xl mt-1">{'🌻'.repeat(Math.min(totalFlowers, 12))}</div>
          <div className="text-xs text-amber-500 mt-1">{totalFlowers} flowers · {totalBees} bees</div>
        </div>
      )}

      {/* Spelling Bee mode */}
      <ModeSection
        icon="🐝"
        title="Spelling Bee"
        subtitle="Spell + Read"
        color="amber"
        blocks={sbBlocks}
        mode="spellingBee"
        weakCount={sbWeak.length}
        onStart={(i, ch) => startGame('spellingBee', i, ch)}
        onReview={() => startReview('spellingBee')}
      />

      {/* Bumblebee mode */}
      <ModeSection
        icon="🐝"
        title="Bumblebee"
        subtitle="Read the word"
        color="orange"
        blocks={bbBlocks}
        mode="bumblebee"
        weakCount={bbWeak.length}
        onStart={(i, ch) => startGame('bumblebee', i, ch)}
        onReview={() => startReview('bumblebee')}
      />

      {/* Bottom */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <button
          onClick={() => setScreen('progress')}
          className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform"
        >
          Progress
        </button>
      </div>
    </div>
  )
}

function ModeSection({ icon, title, subtitle, color, blocks, mode, weakCount, onStart, onReview }) {
  const borderColor = color === 'amber' ? 'border-amber-200' : 'border-orange-200'
  const titleColor = color === 'amber' ? 'text-amber-800' : 'text-orange-700'
  const subtitleColor = color === 'amber' ? 'text-amber-500' : 'text-orange-500'

  return (
    <div className="max-w-md mx-auto px-4 mb-4">
      <div className={`bg-white rounded-2xl p-5 shadow-md border-2 ${borderColor}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{icon}</span>
          <div>
            <h2 className={`text-xl font-bold ${titleColor}`}>{title}</h2>
            <p className={`text-sm ${subtitleColor}`}>{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {blocks.map((block, i) => {
            const allMastered = block.every(w => getMastery(mode, w.word) >= 80)
            const anyPracticed = block.some(w => getMastery(mode, w.word) >= 0)
            return (
              <div key={i} className={`rounded-xl border-2 overflow-hidden ${
                allMastered ? 'border-green-300 bg-green-50' :
                anyPracticed ? `${color === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-orange-200 bg-orange-50'}` :
                'border-gray-200 bg-gray-50'
              }`}>
                <button
                  onClick={() => onStart(i, false)}
                  className="w-full p-3 text-left active:scale-95 transition-transform"
                >
                  <div className="font-bold text-sm">
                    Block {i + 1} {allMastered && '⭐'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                    {block.map(w => w.word).join(', ')}
                  </div>
                </button>
                <div className="flex border-t border-inherit">
                  <button
                    onClick={() => onStart(i, false)}
                    className="flex-1 text-xs py-1.5 text-center font-semibold text-amber-600 border-r border-inherit active:bg-amber-100"
                  >
                    Practice
                  </button>
                  <button
                    onClick={() => onStart(i, true)}
                    className="flex-1 text-xs py-1.5 text-center font-semibold text-red-500 active:bg-red-50"
                  >
                    Challenge
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {weakCount > 0 && (
          <button
            onClick={onReview}
            className="w-full py-2 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          >
            Review weak words ({weakCount})
          </button>
        )}
      </div>
    </div>
  )
}
