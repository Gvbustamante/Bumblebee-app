import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { MODES, COMING_SOON } from '../data/modes'

const MODE_COLORS = {
  purple: { modeBg: '#F2E8FF', accent: '#57358F', border: '#E0D0F0' },
  pink: { modeBg: '#FFF1F5', accent: '#C0457B', border: '#F5D5E0' },
  blue: { modeBg: '#EEF7FF', accent: '#2E78B0', border: '#D0E5F5' },
  amber: { modeBg: '#FFFBEA', accent: '#A07B00', border: '#F0E0B0' },
  indigo: { modeBg: '#F1F2FF', accent: '#4B48A0', border: '#D8D8F0' },
  green: { modeBg: '#E8F5E0', accent: '#3A7A20', border: '#C8E0C0' },
  rose: { modeBg: '#FFF1F5', accent: '#C0457B', border: '#F5D5E0' },
  teal: { modeBg: '#E8F8F5', accent: '#1A7A6A', border: '#C0E8E0' },
}

export default function AdventureSelect() {
  const { t, lang } = useLang()
  const { updateProfile } = useAuth()

  async function pick(adventure) {
    await updateProfile({ adventure })
  }

  return (
    <div className="app-shell status-bar-blur flex flex-col min-h-screen items-center px-5 py-8" style={{ background: 'linear-gradient(180deg, #F2E8FF 0%, #F7F3FF 40%, #F2E8FF80 100%)' }}>
      <div className="w-full max-w-sm">
        <img src="/images/adventure-banner.webp" alt="Mis Aventuras" className="w-full rounded-2xl mb-5 shadow-soft" />
        <h1 className="text-lg font-extrabold text-center mb-1" style={{ color: '#57358F' }}>
          {lang === 'es' ? 'Elige tu aventura' : 'Choose your adventure'}
        </h1>
        <p className="text-xs font-semibold text-center mb-5" style={{ color: '#9B6DDF' }}>
          {lang === 'es' ? 'Cada aventura tiene su propio progreso' : 'Each adventure has its own progress'}
        </p>

        <div className="space-y-3">
          {Object.values(MODES).map((mode, i) => {
            const c = MODE_COLORS[mode.color] || MODE_COLORS.purple
            return (
              <button
                key={mode.id}
                onClick={() => pick(mode.id)}
                className={`animate-fade-up animate-stagger-${Math.min(i + 1, 4)} w-full bg-brand-card rounded-2xl text-left active:scale-[0.97] transition-all duration-200 shadow-card hover:shadow-card-hover relative overflow-hidden min-h-[80px]`}
                style={{ border: `1.5px solid ${c.border}` }}
              >
                {mode.img && (
                  <img src={mode.img} alt={mode.label} className="absolute -left-1 -bottom-1 w-[72px] h-[72px] object-contain select-none pointer-events-none opacity-90" />
                )}
                <div className="flex items-center gap-2 p-4 pl-[76px]">
                  <div className="flex-1">
                    <div className="font-extrabold text-base" style={{ color: c.accent }}>{mode.label}</div>
                    <div className="text-[11px] font-medium mt-0.5 leading-snug" style={{ color: '#9B6DDF' }}>
                      {lang === 'es' ? mode.subtitleEs : mode.subtitle}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: c.modeBg }}>
                    <span className="text-sm font-bold" style={{ color: c.accent }}>→</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="flex-1 h-px" style={{ background: '#E0D0F0' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B0A0C0' }}>
              {lang === 'es' ? 'Proximamente' : 'Coming Soon'}
            </p>
            <div className="flex-1 h-px" style={{ background: '#E0D0F0' }} />
          </div>
          <div className="space-y-2">
            {COMING_SOON.map(m => {
              const c = MODE_COLORS[m.color] || MODE_COLORS.purple
              return (
                <div
                  key={m.id}
                  className="w-full rounded-2xl p-4 opacity-60"
                  style={{ background: '#F3F0F8', border: '1px solid #E8E0F0' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl grayscale">{m.emoji}</span>
                    <div>
                      <div className="font-extrabold text-sm" style={{ color: '#B0A0C0' }}>{m.label}</div>
                      <div className="text-[11px] font-medium mt-0.5" style={{ color: '#C8B8D8' }}>
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
