import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { MODES } from '../data/modes'

export default function AdventureSelect() {
  const { t, lang } = useLang()
  const { updateProfile } = useAuth()

  async function pick(adventure) {
    await updateProfile({ adventure })
  }

  return (
    <div className="app-shell flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-white items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🐝</div>
          <h1 className="text-xl font-extrabold text-purple-700">{t('chooseAdventure')}</h1>
          <p className="text-xs text-gray-400 font-semibold mt-1">{t('pickOneAdventure')}</p>
        </div>

        <div className="space-y-4">
          {Object.values(MODES).map(mode => {
            const c = COLORS[mode.color]
            return (
              <button
                key={mode.id}
                onClick={() => pick(mode.id)}
                className={`w-full bg-gradient-to-br ${c.gradient} ${c.border} border-2 rounded-3xl p-6 text-left active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{mode.emoji}</span>
                  <div>
                    <div className={`font-extrabold text-lg ${c.text}`}>{mode.label}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-0.5">
                      {lang === 'es' ? mode.subtitleEs : mode.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const COLORS = {
  purple: { gradient: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-700' },
  pink: { gradient: 'from-pink-50 to-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
}
