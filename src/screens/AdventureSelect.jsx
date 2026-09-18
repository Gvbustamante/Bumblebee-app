import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { MODES, COMING_SOON } from '../data/modes'

export default function AdventureSelect() {
  const { t, lang } = useLang()
  const { updateProfile } = useAuth()

  async function pick(adventure) {
    await updateProfile({ adventure })
  }

  return (
    <div className="app-shell status-bar-blur flex flex-col min-h-screen bg-gradient-to-b from-purple-50 to-white items-center px-6 py-8">
      <div className="w-full max-w-sm">
        <img src="/images/adventure-banner.webp" alt="Mis Aventuras" className="w-full rounded-2xl mb-4" />
        <h1 className="text-xl font-extrabold text-gray-800 text-center mb-4">
          {lang === 'es' ? 'Elige tu aventura' : 'Choose your adventure'}
        </h1>

        <div className="space-y-3">
          {Object.values(MODES).map(mode => {
            const c = COLORS[mode.color]
            return (
              <button
                key={mode.id}
                onClick={() => pick(mode.id)}
                className={`w-full bg-gradient-to-br ${c.gradient} ${c.border} border-2 rounded-2xl p-4 pl-24 text-left active:scale-[0.98] transition-transform relative overflow-hidden min-h-[80px]`}
              >
                {mode.img
                  ? <img src={mode.img} alt={mode.label} className="absolute left-2 bottom-0 w-20 h-20 object-contain select-none" />
                  : <span className="absolute left-3 bottom-2 text-5xl select-none">{mode.emoji}</span>
                }
                <div>
                  <div className={`font-extrabold text-base ${c.text}`}>{mode.label}</div>
                  <div className="text-xs text-gray-400 font-semibold mt-0.5">
                    {lang === 'es' ? mode.subtitleEs : mode.subtitle}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 px-1">
            {lang === 'es' ? 'Próximamente' : 'Coming Soon'}
          </p>
          <div className="space-y-2">
            {COMING_SOON.map(m => {
              const c = COLORS[m.color] || COLORS.purple
              return (
                <div
                  key={m.id}
                  className={`w-full bg-gradient-to-br ${c.gradient} ${c.border} border-2 rounded-2xl p-4 opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{m.emoji}</span>
                    <div>
                      <div className={`font-extrabold text-base ${c.text}`}>{m.label}</div>
                      <div className="text-xs text-gray-400 font-semibold mt-0.5">
                        {lang === 'es' ? m.subtitleEs : m.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const COLORS = {
  purple: { gradient: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-700' },
  pink: { gradient: 'from-pink-50 to-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  blue: { gradient: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700' },
  amber: { gradient: 'from-amber-50 to-yellow-50', border: 'border-amber-200', text: 'text-amber-700' },
  indigo: { gradient: 'from-indigo-50 to-violet-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  green: { gradient: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-700' },
  rose: { gradient: 'from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-700' },
  teal: { gradient: 'from-teal-50 to-cyan-50', border: 'border-teal-200', text: 'text-teal-700' },
}
