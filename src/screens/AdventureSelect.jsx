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
    <div className="app-shell status-bar-blur flex flex-col min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/30 items-center px-5 py-8">
      <div className="w-full max-w-sm">
        <img src="/images/adventure-banner.webp" alt="Mis Aventuras" className="w-full rounded-2xl mb-5 shadow-soft" />
        <h1 className="text-lg font-extrabold text-gray-800 text-center mb-1">
          {lang === 'es' ? 'Elige tu aventura' : 'Choose your adventure'}
        </h1>
        <p className="text-xs text-gray-400 font-semibold text-center mb-5">
          {lang === 'es' ? 'Cada aventura tiene su propio progreso' : 'Each adventure has its own progress'}
        </p>

        <div className="space-y-3">
          {Object.values(MODES).map((mode, i) => {
            const c = COLORS[mode.color]
            return (
              <button
                key={mode.id}
                onClick={() => pick(mode.id)}
                className={`animate-fade-up animate-stagger-${Math.min(i + 1, 4)} w-full bg-white border ${c.border} rounded-2xl text-left active:scale-[0.97] transition-all duration-200 shadow-card hover:shadow-card-hover relative overflow-hidden min-h-[80px]`}
              >
                {mode.img && (
                  <img src={mode.img} alt={mode.label} className="absolute -left-1 -bottom-1 w-[72px] h-[72px] object-contain select-none pointer-events-none opacity-90" />
                )}
                <div className="flex items-center gap-2 p-4 pl-[76px]">
                  <div className="flex-1">
                    <div className={`font-extrabold text-base ${c.text}`}>{mode.label}</div>
                    <div className="text-[11px] text-gray-400 font-medium mt-0.5 leading-snug">
                      {lang === 'es' ? mode.subtitleEs : mode.subtitle}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full ${c.arrowBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-sm font-bold ${c.text}`}>→</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="flex-1 h-px bg-gray-200/60" />
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              {lang === 'es' ? 'Próximamente' : 'Coming Soon'}
            </p>
            <div className="flex-1 h-px bg-gray-200/60" />
          </div>
          <div className="space-y-2">
            {COMING_SOON.map(m => {
              const c = COLORS[m.color] || COLORS.purple
              return (
                <div
                  key={m.id}
                  className={`w-full bg-gray-50/80 border border-gray-100 rounded-2xl p-4 opacity-60`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl grayscale">{m.emoji}</span>
                    <div>
                      <div className="font-extrabold text-sm text-gray-400">{m.label}</div>
                      <div className="text-[11px] text-gray-300 font-medium mt-0.5">
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
  purple: { gradient: 'from-purple-50 to-purple-100', border: 'border-purple-100', text: 'text-purple-700', arrowBg: 'bg-purple-50' },
  pink: { gradient: 'from-pink-50 to-orange-50', border: 'border-pink-100', text: 'text-pink-600', arrowBg: 'bg-pink-50' },
  blue: { gradient: 'from-blue-50 to-cyan-50', border: 'border-blue-100', text: 'text-blue-700', arrowBg: 'bg-blue-50' },
  amber: { gradient: 'from-amber-50 to-yellow-50', border: 'border-amber-100', text: 'text-amber-700', arrowBg: 'bg-amber-50' },
  indigo: { gradient: 'from-indigo-50 to-violet-50', border: 'border-indigo-100', text: 'text-indigo-700', arrowBg: 'bg-indigo-50' },
  green: { gradient: 'from-green-50 to-emerald-50', border: 'border-green-100', text: 'text-green-700', arrowBg: 'bg-green-50' },
  rose: { gradient: 'from-rose-50 to-pink-50', border: 'border-rose-100', text: 'text-rose-700', arrowBg: 'bg-rose-50' },
  teal: { gradient: 'from-teal-50 to-cyan-50', border: 'border-teal-100', text: 'text-teal-700', arrowBg: 'bg-teal-50' },
}
