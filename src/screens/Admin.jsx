import { useState, useEffect, useRef } from 'react'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, adminAddWord, adminDeleteWord, adminUploadImage, adminToggleWord, adminCloneWord } from '../lib/db'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const { t } = useLang()
  const { profile } = useAuth()
  const [adventure, setAdventure] = useState('spellingBee')
  const [words, setWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newImage, setNewImage] = useState(null)
  const [newImagePreview, setNewImagePreview] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [users, setUsers] = useState([])
  const fileRef = useRef()
  const addFileRef = useRef()

  useEffect(() => { loadWords() }, [adventure])
  useEffect(() => { loadUsers() }, [])

  async function loadWords() {
    const w = await fetchWords(adventure, true)
    setWords(w)
  }

  async function loadUsers() {
    const { data } = await supabase.from('bumblebee_profiles').select('id, name, role, adventure, created_at')
    setUsers(data || [])
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
    const word = newWord.trim()
    await adminAddWord(adventure, word, newEmoji || '📝')
    if (newImage) {
      await adminUploadImage(newImage, word)
    }
    setNewWord('')
    setNewEmoji('')
    clearNewImage()
    loadWords()
  }

  async function handleDelete(word) {
    await adminDeleteWord(adventure, word)
    loadWords()
  }

  async function handleToggle(word, currentActive) {
    await adminToggleWord(adventure, word, !currentActive)
    loadWords()
  }

  async function handleClone(word) {
    const dest = adventure === 'spellingBee' ? 'Bumblebee' : 'Spelling Bee'
    const res = await adminCloneWord(adventure, word)
    if (res.error === 'already exists') alert(`"${word}" ya existe en ${dest}`)
    else loadWords()
  }

  async function handleUpload(word) {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(word)
    await adminUploadImage(file, word)
    fileRef.current.value = ''
    setUploading(null)
    loadWords()
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

      {/* Adventure picker */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {['spellingBee', 'bumblebee'].map(a => (
            <button
              key={a}
              onClick={() => setAdventure(a)}
              className={`flex-1 py-2 rounded-xl font-extrabold text-sm transition-all ${
                a === adventure ? 'bg-purple-600 text-white shadow-btn' : 'bg-purple-50 text-purple-400'
              }`}
            >
              {a === 'spellingBee' ? '🐝 Spelling Bee' : '🌸 Bumblebee'}
            </button>
          ))}
        </div>
      </div>

      {/* Add word */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <div className="text-xs font-bold text-gray-500 mb-2">{t('addWord')}</div>
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
              📷 Imagen
            </button>
            {newImagePreview && (
              <div className="flex items-center gap-2">
                <img src={newImagePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border-2 border-blue-200" />
                <button onClick={clearNewImage} className="text-red-400 text-xs font-bold">✕</button>
              </div>
            )}
            {!newImagePreview && <span className="text-[10px] text-gray-300">Emoji, imagen, o ambos</span>}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" />

      {/* Words list */}
      <div className="px-4 space-y-2">
        {words.map(w => (
          <div key={w.word} className={`rounded-xl shadow-card border p-3 flex items-center gap-3 ${w.active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
            {w.image_url ? (
              <img src={w.image_url} alt={w.word} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <span className="text-2xl w-12 text-center">{w.emoji}</span>
            )}
            <span className={`font-extrabold flex-1 ${w.active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{w.word}</span>
            <button
              onClick={() => handleToggle(w.word, w.active)}
              className={`px-2 py-1 rounded-lg text-xs font-bold ${w.active ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}
              title={w.active ? 'Desactivar' : 'Activar'}
            >
              {w.active ? '✅' : '⏸️'}
            </button>
            <button
              onClick={() => handleClone(w.word)}
              className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold"
              title={`Clonar a ${adventure === 'spellingBee' ? 'Bumblebee' : 'Spelling Bee'}`}
            >
              📋
            </button>
            <button
              onClick={() => { fileRef.current.onchange = () => handleUpload(w.word); fileRef.current.click() }}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
              disabled={uploading === w.word}
            >
              {uploading === w.word ? '...' : '📷'}
            </button>
            <button
              onClick={() => handleDelete(w.word)}
              className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-bold"
            >
              🗑
            </button>
          </div>
        ))}
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
