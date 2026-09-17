import { useState, useEffect, useRef } from 'react'
import { useLang } from '../data/i18n'
import { useAuth } from '../data/AuthContext'
import { fetchWords, adminAddWord, adminDeleteWord, adminUploadImage } from '../lib/db'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const { t } = useLang()
  const { profile } = useAuth()
  const [adventure, setAdventure] = useState('spellingBee')
  const [words, setWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [uploading, setUploading] = useState(null)
  const [users, setUsers] = useState([])
  const fileRef = useRef()

  useEffect(() => { loadWords() }, [adventure])
  useEffect(() => { loadUsers() }, [])

  async function loadWords() {
    const w = await fetchWords(adventure)
    setWords(w)
  }

  async function loadUsers() {
    const { data } = await supabase.from('bumblebee_profiles').select('id, name, role, adventure, created_at')
    setUsers(data || [])
  }

  async function handleAdd() {
    if (!newWord.trim()) return
    await adminAddWord(adventure, newWord.trim(), newEmoji || '📝')
    setNewWord('')
    setNewEmoji('')
    loadWords()
  }

  async function handleDelete(word) {
    await adminDeleteWord(adventure, word)
    loadWords()
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
          <div className="flex gap-2">
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
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" />

      {/* Words list */}
      <div className="px-4 space-y-2">
        {words.map(w => (
          <div key={w.word} className="bg-white rounded-xl shadow-card border border-gray-100 p-3 flex items-center gap-3">
            {w.image_url ? (
              <img src={w.image_url} alt={w.word} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <span className="text-2xl w-12 text-center">{w.emoji}</span>
            )}
            <span className="font-extrabold text-gray-700 flex-1">{w.word}</span>
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
