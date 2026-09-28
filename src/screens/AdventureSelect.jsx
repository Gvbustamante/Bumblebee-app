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
  const { profile, updateProfile } = useAuth()

  async function pick(adventure) {
    await updateProfile({ adventure })
  }

  return (
    <div className="app-shell status-bar-blur flex flex-col min-h-screen px-5 py-6" style={{ background: '#F8F5FF' }}>
      <div className="w-full max-w-sm mx-auto lg:max-w-3xl">
        <h1 className="text-xl font-extrabold mb-1" style={{ color: '#2D1B4E' }}>
          {lang === 'es' ? 'Elige tu aventura' : 'Choose your adventure'}
        </h1>
        <p className="text-xs font-semibold mb-5" style={{ color: '#9B6DDF' }}>
          {lang === 'es' ? 'Cada aventura tiene su propio progreso' : 'Each adventure has its own progress'}
        </p>

        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {Object.values(MODES).filter(mode => {
            const hiddenModes = profile?.hidden_modes || []
            return !hiddenModes.includes(mode.id)
          }).map((mode) => {
            const c = MODE_COLORS[mode.color] || MODE_COLORS.purple
            return (
              <button
                key={mode.id}
                onClick={() => pick(mode.id)}
                className="w-full rounded-2xl text-left active:scale-[0.97] transition-all duration-200 relative overflow-hidden"
                style={{ background: '#FFFFFF', border: `1.5px solid ${c.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center gap-3 p-4">
                  {mode.img && (
                    <img src={mode.img} alt={mode.label} className="w-14 h-14 object-contain shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-base" style={{ color: c.accent }}>{mode.label}</div>
                    <div className="text-[11px] font-medium mt-0.5 leading-snug" style={{ color: '#9B6DDF' }}>
                      {lang === 'es' ? mode.subtitleEs : mode.subtitle}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={c.accent} className="w-5 h-5 shrink-0 opacity-60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
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
          <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0">
            {COMING_SOON.map(m => (
              <div
                key={m.id}
                className="w-full rounded-2xl p-4 opacity-50"
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
