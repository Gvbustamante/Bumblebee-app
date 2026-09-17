import { useState } from 'react'
import { SPELLING_BEE_WORDS, BUMBLEBEE_WORDS, getBlocks } from '../data/words'
import { getMastery, getWeakWords, getStars, getWordStats } from '../storage'

export default function Home({ onStartGame }) {
  const [selectedMode, setSelectedMode] = useState(null)
  const stars = getStars()
  const sbStats = getWordStats('spellingBee')
  const bbStats = getWordStats('bumblebee')
  const totalPracticed = sbStats.practiced + bbStats.practiced
  const totalWords = SPELLING_BEE_WORDS.length + BUMBLEBEE_WORDS.length

  if (selectedMode) {
    return (
      <BlockSelect
        mode={selectedMode}
        onBack={() => setSelectedMode(null)}
        onStart={(block, idx, challenge) => onStartGame({ mode: selectedMode, block, blockIndex: idx, isChallenge: challenge })}
      />
    )
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">Hi, Little Learner!</h1>
          <p className="text-sm text-gray-400 font-semibold">What do you want to spell today?</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
          <span className="text-lg">⭐</span>
          <span className="font-extrabold text-yellow-600 text-sm">{stars}</span>
        </div>
      </div>

      {/* Progress card */}
      <div className="mx-4 mt-3 bg-gradient-to-br from-purple-600 to-purple-500 rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-[100px] opacity-10 select-none">🐝</div>
        <p className="text-purple-200 text-sm font-semibold">Keep going!</p>
        <p className="font-extrabold text-lg mt-0.5">You're doing amazing!</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2.5 bg-purple-400/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${totalWords ? (totalPracticed / totalWords) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-bold whitespace-nowrap">⭐ {totalPracticed}/{totalWords}</span>
        </div>
      </div>

      {/* Modes */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-extrabold text-gray-700 mb-3 px-1">Choose your adventure</h2>
        <div className="grid grid-cols-2 gap-3">
          <ModeCard
            emoji="🐝"
            title="Spelling Bee"
            subtitle="Spell + Read"
            color="purple"
            stats={sbStats}
            words={SPELLING_BEE_WORDS}
            mode="spellingBee"
            onClick={() => setSelectedMode('spellingBee')}
          />
          <ModeCard
            emoji="🌸"
            title="Bumblebee"
            subtitle="Read the word"
            color="pink"
            stats={bbStats}
            words={BUMBLEBEE_WORDS}
            mode="bumblebee"
            onClick={() => setSelectedMode('bumblebee')}
          />
        </div>
      </div>

      {/* Quick review */}
      <QuickReview onStartGame={onStartGame} />
    </div>
  )
}

function ModeCard({ emoji, title, subtitle, color, stats, words, mode, onClick }) {
  const masteredPct = words.length ? Math.round((stats.mastered / words.length) * 100) : 0
  const gradients = {
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    pink: 'from-pink-50 to-orange-50 border-orange-200',
  }
  const textColors = {
    purple: 'text-purple-700',
    pink: 'text-orange-600',
  }

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradients[color]} border-2 rounded-3xl p-4 text-left active:scale-95 transition-transform`}
    >
      <div className="text-4xl mb-2">{emoji}</div>
      <div className={`font-extrabold text-sm ${textColors[color]}`}>{title}</div>
      <div className="text-xs text-gray-400 font-semibold">{subtitle}</div>
      {stats.practiced > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${masteredPct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-gray-400">{masteredPct}%</span>
        </div>
      )}
    </button>
  )
}

function BlockSelect({ mode, onBack, onStart }) {
  const words = mode === 'spellingBee' ? SPELLING_BEE_WORDS : BUMBLEBEE_WORDS
  const blocks = getBlocks(words)
  const weak = getWeakWords(mode, words)
  const isSpelling = mode === 'spellingBee'

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold active:scale-90 transition-transform">
          ←
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-gray-800">{isSpelling ? 'Spelling Bee' : 'Bumblebee'}</h2>
          <p className="text-xs text-gray-400 font-semibold">Choose a block to practice</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {blocks.map((block, i) => {
          const allMastered = block.every(w => getMastery(mode, w.word) >= 80)
          const anyPracticed = block.some(w => getMastery(mode, w.word) >= 0)
          const masteredCount = block.filter(w => getMastery(mode, w.word) >= 80).length

          return (
            <div key={i} className={`bg-white rounded-2xl shadow-card overflow-hidden border ${allMastered ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{allMastered ? '🌟' : anyPracticed ? '📖' : '🔒'}</span>
                    <span className="font-extrabold text-gray-700">Block {i + 1}</span>
                  </div>
                  {anyPracticed && (
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                      {masteredCount}/{block.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {block.map(w => {
                    const m = getMastery(mode, w.word)
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
                {allMastered && (
                  <div className="h-1.5 bg-green-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-green-400 rounded-full w-full" />
                  </div>
                )}
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => onStart(block, i, false)}
                  className="flex-1 py-3 text-center text-sm font-bold text-purple-600 active:bg-purple-50 transition-colors"
                >
                  🧸 Practice
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => onStart(block, i, true)}
                  className="flex-1 py-3 text-center text-sm font-bold text-orange-500 active:bg-orange-50 transition-colors"
                >
                  🏆 Challenge
                </button>
              </div>
            </div>
          )
        })}

        {weak.length > 0 && (
          <button
            onClick={() => onStart(weak.slice(0, 5), -1, false)}
            className="w-full bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <div>
                <div className="font-extrabold text-red-600 text-sm">Review Weak Words</div>
                <div className="text-xs text-red-400 font-semibold">{weak.length} words need practice</div>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

function QuickReview({ onStartGame }) {
  const sbWeak = getWeakWords('spellingBee', SPELLING_BEE_WORDS)
  const bbWeak = getWeakWords('bumblebee', BUMBLEBEE_WORDS)
  if (!sbWeak.length && !bbWeak.length) return null

  return (
    <div className="px-4 mt-6">
      <h2 className="text-lg font-extrabold text-gray-700 mb-3 px-1">Needs practice</h2>
      <div className="flex gap-2 flex-wrap">
        {[...sbWeak.map(w => ({ ...w, m: 'spellingBee' })), ...bbWeak.map(w => ({ ...w, m: 'bumblebee' }))].slice(0, 8).map(w => (
          <span key={`${w.m}-${w.word}`} className="bg-red-50 text-red-500 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-xl">
            {w.emoji} {w.word}
          </span>
        ))}
      </div>
    </div>
  )
}
