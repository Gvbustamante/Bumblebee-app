import { useState } from 'react'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'

export default function Login() {
  const { t, lang } = useLang()
  const { signIn, signUp, resetPassword } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isRegister) {
      const { error: err } = await signUp(email, password, name)
      if (err) setError(err.message)
      else setSuccess(t('checkEmail'))
    } else {
      const { error: err } = await signIn(email, password)
      if (err) setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="app-shell status-bar-blur flex flex-col lg:flex-row ls:flex-row min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 lg:hidden ls:hidden" style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #B8E4FF 30%, #90D468 30%, #6BAF4A 60%, #5A9E3A 100%)',
      }}>
        <div className="absolute text-4xl opacity-40 select-none" style={{ left: '8%', top: '3%' }}>☁️</div>
        <div className="absolute text-3xl opacity-30 select-none" style={{ right: '15%', top: '5%' }}>☁️</div>
        <div className="absolute text-3xl select-none" style={{ right: '5%', top: '2%' }}>☀️</div>
        <div className="absolute text-3xl select-none" style={{ left: '0', bottom: '40%' }}>🌳</div>
        <div className="absolute text-3xl select-none" style={{ right: '0', bottom: '42%' }}>🌳</div>
        <div className="absolute text-xl select-none" style={{ left: '20%', bottom: '38%' }}>🌻</div>
        <div className="absolute text-xl select-none" style={{ right: '22%', bottom: '39%' }}>🌷</div>
      </div>

      <div className="hidden lg:flex ls:flex lg:w-1/2 ls:w-1/2 flex-col items-center justify-center relative" style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #B8E4FF 35%, #90D468 35%, #6BAF4A 65%, #5A9E3A 100%)',
      }}>
        <div className="absolute text-5xl opacity-40 select-none" style={{ left: '10%', top: '5%' }}>☁️</div>
        <div className="absolute text-4xl opacity-30 select-none" style={{ right: '15%', top: '8%' }}>☁️</div>
        <div className="absolute text-4xl select-none" style={{ right: '8%', top: '3%' }}>☀️</div>
        <img src="/images/login-hero.webp" alt="Bumblebee Kids" className="w-56 mb-5 drop-shadow-2xl relative z-10" />
        <h1 className="text-4xl font-extrabold text-white relative z-10 drop-shadow-lg">Bumblebee Kids</h1>
        <p className="text-white/80 font-semibold mt-2 text-lg relative z-10 drop-shadow">
          {lang === 'es' ? 'Aprende palabras en inglés de una forma divertida' : 'Learn English words in a fun way'}
        </p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center pt-10 lg:pt-0 ls:pt-0 lg:hidden ls:hidden">
          <img src="/images/login-hero.webp" alt="Bumblebee Kids" className="w-40 drop-shadow-2xl mb-3" />
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">Bumblebee Kids</h1>
        </div>

        <div className="mt-auto lg:mt-0 ls:mt-0 lg:flex ls:flex lg:flex-1 ls:flex-1 lg:items-center ls:items-center lg:justify-center ls:justify-center">
          <div className="bg-white rounded-t-[32px] lg:rounded-2xl ls:rounded-2xl px-8 pt-8 pb-12 lg:pb-8 ls:pb-8 lg:shadow-2xl ls:shadow-2xl lg:max-w-md ls:max-w-md lg:w-full ls:w-full lg:mx-8 ls:mx-8">
            <h2 className="text-center text-xl font-extrabold mb-1" style={{ color: '#57358F' }}>
              {isRegister
                ? (lang === 'es' ? '¡Crea tu cuenta!' : 'Create your account!')
                : (lang === 'es' ? '¡Bienvenido!' : 'Welcome!')}
            </h2>
            <p className="text-center text-sm font-semibold mb-5" style={{ color: '#9B6DDF' }}>
              {lang === 'es' ? 'Aprende palabras en inglés de una forma divertida' : 'Learn English words in a fun way'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('enterName')}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none font-bold text-gray-700 bg-purple-50/50 text-sm"
                  required
                />
              )}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('email')}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none font-bold text-gray-700 bg-purple-50/50 text-sm"
                required
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('password')}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none font-bold text-gray-700 bg-purple-50/50 text-sm"
                minLength={6}
                required
              />

              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
              {success && <p className="text-green-500 text-xs font-bold text-center">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white font-extrabold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 text-base"
                style={{ background: 'linear-gradient(135deg, #7B4FBF, #57358F)', boxShadow: '0 4px 16px rgba(123,79,191,0.4)' }}
              >
                {loading ? '...' : isRegister ? t('register') : t('login')}
              </button>
            </form>

            {!isRegister && (
              <button
                onClick={async () => {
                  if (!email) { setError(lang === 'es' ? 'Escribe tu correo primero' : 'Enter your email first'); return }
                  setError(''); setLoading(true)
                  const { error: err } = await resetPassword(email)
                  if (err) setError(err.message)
                  else setSuccess(t('resetEmailSent'))
                  setLoading(false)
                }}
                className="w-full mt-2 text-xs font-bold text-center py-2"
                style={{ color: '#9B6DDF' }}
                type="button"
              >
                {t('forgotPassword')}
              </button>
            )}

            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
              className="w-full mt-1 text-sm font-bold text-center py-3.5 rounded-2xl border-2 transition-colors"
              style={{ color: '#7B4FBF', borderColor: '#E0D0F0', background: '#FAFAFF' }}
              type="button"
            >
              {isRegister ? t('hasAccount') : t('noAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
