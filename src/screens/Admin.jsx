import { useState, useEffect, useRef } from 'react'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, adminAddWord, adminDeleteWord, adminUploadImage, adminToggleWord, adminCloneWord } from '../lib/db'
import { supabase } from '../lib/supabase'

const SECTIONS = [
  { adventure: 'spellingBee', category: 'words', label: '🐝 Spelling Bee', color: 'purple' },
  { adventure: 'bumblebee', category: 'words', label: '🌸 Bumblebee', color: 'pink' },
  { adventure: 'alphabet', category: 'words', label: '🔤 ABC', color: 'blue' },
  { adventure: 'colors', category: 'words', label: '🎨 Colores', color: 'amber' },
  { adventure: 'shapes', category: 'words', label: '🔷 Formas', color: 'indigo' },
]

const SEC_COLORS = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', head: 'bg-purple-100 text-purple-700', badge: 'bg-purple-200 text-purple-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', head: 'bg-pink-100 text-pink-700', badge: 'bg-pink-200 text-pink-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', head: 'bg-blue-100 text-blue-700', badge: 'bg-blue-200 text-blue-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', head: 'bg-amber-100 text-amber-700', badge: 'bg-amber-200 text-amber-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', head: 'bg-indigo-100 text-indigo-700', badge: 'bg-indigo-200 text-indigo-700' },
}

export default function Admin() {
  const { t, lang } = useLang()
  const { profile } = useAuth()
  const [wordsBySection, setWordsBySection] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [addSection, setAddSection] = useState('spellingBee|words')
  const [newWord, setNewWord] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newImage, setNewImage] = useState(null)
  const [newImagePreview, setNewImagePreview] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [users, setUsers] = useState([])
  const fileRef = useRef()
  const addFileRef = useRef()

  useEffect(() => { loadAllWords() }, [])
  useEffect(() => { loadUsers() }, [])

  async function loadAllWords() {
    const map = {}
    for (const sec of SECTIONS) {
      const key = `${sec.adventure}|${sec.category}`
      const w = await fetchWords(sec.adventure, true, sec.category)
      map[key] = w
    }
    setWordsBySection(map)
  }

  async function loadUsers() {
    const { data } = await supabase.from('bumblebee_profiles').select('id, name, role, adventure, created_at')
    setUsers(data || [])
  }

  function toggleCollapse(key) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }))
  }

  function handleNewImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImage(file)
    setNewImagePreview(URL.createObjectURL(file))
  }

  function clearNewImage() {
    setNewImage(null)
    setNewImagePreview(null)
    if (addFileRef.current) addFileRef.current.value = ''
  }

  async function handleAdd() {
    if (!newWord.trim()) return
    const word = newWord.trim().toUpperCase()
    const [adventure, category] = addSection.split('|')
    await adminAddWord(adventure, word, newEmoji || '📝', category)
    if (newImage) {
      await adminUploadImage(newImage, word)
    }
    setNewWord('')
    setNewEmoji('')
    clearNewImage()
    loadAllWords()
  }

  async function handleDelete(adventure, word) {
    await adminDeleteWord(adventure, word)
    loadAllWords()
  }

  async function handleToggle(adventure, word, currentActive) {
    await adminToggleWord(adventure, word, !currentActive)
    loadAllWords()
  }

  async function handleClone(adventure, word) {
    const dest = adventure === 'spellingBee' ? 'Bumblebee' : 'Spelling Bee'
    const res = await adminCloneWord(adventure, word)
    if (res.error === 'already exists') alert(`"${word}" ya existe en ${dest}`)
    else loadAllWords()
  }

  async function handleUpload(word) {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(word)
    await adminUploadImage(file, word)
    fileRef.current.value = ''
    setUploading(null)
    loadAllWords()
  }

  async function toggleAdmin(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await supabase.from('bumblebee_profiles').update({ role: newRole }).eq('id', userId)
    loadUsers()
  }

  return (
    <div className="animate-fade-up pb-4">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-extrabold text-gray-800">{t('admin')}</h1>
        <p className="text-sm text-gray-400 font-semibold">{t('manageWords')}</p>
      </div>

      {/* Add word */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <div className="text-xs font-bold text-gray-500 mb-2">{t('addWord')}</div>

          {/* Section selector */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SECTIONS.map(sec => {
              const key = `${sec.adventure}|${sec.category}`
              const c = SEC_COLORS[sec.color]
              const active = addSection === key
              return (
                <button
                  key={key}
                  onClick={() => setAddSection(key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    active ? `${c.head} ring-2 ring-offset-1 ring-current` : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {sec.label}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 items-center">
            <input
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              placeholder="🐱"
              className="w-14 px-2 py-2 rounded-xl border-2 border-purple-200 text-center text-lg"
            />
            <input
              value={newWord}
              onChange={e => setNewWord(e.target.value.toUpperCase())}
              placeholder="WORD"
              className="flex-1 px-3 py-2 rounded-xl border-2 border-purple-200 font-bold"
            />
            <button onClick={handleAdd} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm">
              +
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input ref={addFileRef} type="file" accept="image/*" onChange={handleNewImage} className="hidden" />
            <button
              onClick={() => addFileRef.current?.click()}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              Imagen
            </button>
            {newImagePreview && (
              <div className="flex items-center gap-2">
                <img src={newImagePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border-2 border-blue-200" />
                <button onClick={clearNewImage} className="text-red-400 text-xs font-bold">x</button>
              </div>
            )}
            {!newImagePreview && <span className="text-[10px] text-gray-300">Emoji, imagen, o ambos</span>}
          </div>
        </div>
      </div>

      {/* Hidden file input for word image upload */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" />

      {/* Collapsible sections */}
      <div className="px-4 space-y-3">
        {SECTIONS.map(sec => {
          const key = `${sec.adventure}|${sec.category}`
          const words = wordsBySection[key] || []
          const isOpen = !collapsed[key]
          const c = SEC_COLORS[sec.color]
          const activeCount = words.filter(w => w.active).length

          return (
            <div key={key} className={`rounded-2xl border overflow-hidden ${c.border}`}>
              <button
                onClick={() => toggleCollapse(key)}
                className={`w-full flex items-center justify-between px-4 py-3 ${c.head} font-extrabold text-sm`}
              >
                <span>{sec.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.badge}`}>
                    {activeCount}/{words.length}
                  </span>
                  <span className="text-lg">{isOpen ? '−' : '+'}</span>
                </div>
              </button>

              {isOpen && (
                <div className={`${c.bg} p-2 space-y-1.5`}>
                  {words.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-3">{lang === 'es' ? 'Sin palabras' : 'No words'}</p>
                  )}
                  {words.map(w => (
                    <div key={w.word} className={`rounded-xl border p-2.5 flex items-center gap-2 ${
                      w.active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}>
                      {w.image_url ? (
                        <img src={w.image_url} alt={w.word} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <span className="text-xl w-10 text-center">{w.emoji}</span>
                      )}
                      <span className={`font-extrabold text-sm flex-1 ${w.active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                        {w.word}
                      </span>
                      <button
                        onClick={() => handleToggle(sec.adventure, w.word, w.active)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold ${
                          w.active ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}
                      >
                        {w.active ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => handleClone(sec.adventure, w.word)}
                        className="px-1.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold"
                        title={`Clonar a ${sec.adventure === 'spellingBee' ? 'Bumblebee' : 'Spelling Bee'}`}
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => { fileRef.current.onchange = () => handleUpload(w.word); fileRef.current.click() }}
                        className="px-1.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold"
                        disabled={uploading === w.word}
                      >
                        {uploading === w.word ? '...' : 'Img'}
                      </button>
                      <button
                        onClick={() => handleDelete(sec.adventure, w.word)}
                        className="px-1.5 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold"
                      >
                        Del
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Users management */}
      <div className="px-5 pt-6 pb-3">
        <h2 className="text-lg font-extrabold text-gray-800">{t('users')}</h2>
      </div>
      <div className="px-4 space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-xl shadow-card border border-gray-100 p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-bold text-sm text-gray-700">{u.name || 'Sin nombre'}</div>
              <div className="text-[10px] text-gray-400">{u.adventure || '—'} · {u.role}</div>
            </div>
            {u.id !== profile?.id && (
              <button
                onClick={() => toggleAdmin(u.id, u.role)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  u.role === 'admin' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                }`}
              >
                {u.role === 'admin' ? t('removeAdmin') : t('makeAdmin')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
