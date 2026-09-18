import { useState } from 'react'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'

export default function Login() {
  const { t } = useLang()
  const { signIn, signUp } = useAuth()
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
    <div className="app-shell flex flex-col min-h-screen relative overflow-hidden">
      <img src="/images/login-hero.webp" alt="Bumblebee Kids" className="absolute inset-0 w-full h-full object-cover object-top" />

      <div className="relative z-10 flex-1 flex flex-col justify-end pb-0">
        <div className="bg-white/90 backdrop-blur-sm rounded-t-3xl px-6 pt-5 pb-8">
          <p className="text-center text-sm text-gray-500 font-bold mb-4">
            {isRegister ? t('createAccount') : t('welcomeBack')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
          {isRegister && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('enterName')}
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none font-bold text-gray-700 bg-purple-50"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('email')}
            className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none font-bold text-gray-700 bg-purple-50"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('password')}
            className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none font-bold text-gray-700 bg-purple-50"
            minLength={6}
            required
          />

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          {success && <p className="text-green-500 text-xs font-bold text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-yellow-400 text-amber-900 font-extrabold rounded-xl shadow-btn active:scale-[0.98] transition-transform disabled:opacity-50 text-base"
          >
            {loading ? '...' : isRegister ? t('register') : t('login')}
          </button>
        </form>

          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
            className="w-full mt-3 text-sm text-purple-500 font-bold text-center"
            type="button"
          >
            {isRegister ? t('hasAccount') : t('noAccount')}
          </button>
        </div>
      </div>
    </div>
  )
}
