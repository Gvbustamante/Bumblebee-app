import { supabase } from './supabase'

export async function fetchWords(adventure, includeInactive = false, category = 'words') {
  let q = supabase
    .from('bumblebee_words')
    .select('*')
    .eq('adventure', adventure)
    .eq('category', category)
    .order('sort_order')
  if (!includeInactive) q = q.eq('active', true)
  const { data } = await q
  return (data || []).map(w => ({ word: w.word, emoji: w.emoji, image_url: w.image_url, active: w.active, category: w.category, sort_order: w.sort_order }))
}

export async function fetchAllWords(adventure, includeInactive = false) {
  let q = supabase
    .from('bumblebee_words')
    .select('*')
    .eq('adventure', adventure)
    .order('sort_order')
  if (!includeInactive) q = q.eq('active', true)
  const { data } = await q
  return (data || []).map(w => ({ word: w.word, emoji: w.emoji, image_url: w.image_url, active: w.active, category: w.category }))
}

export async function getStars(userId, adventure) {
  const { data } = await supabase
    .from('bumblebee_stars')
    .select('stars')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .single()
  return data?.stars || 0
}

export async function addStars(userId, adventure, n) {
  const current = await getStars(userId, adventure)
  const newVal = current + n
  await supabase
    .from('bumblebee_stars')
    .upsert({ user_id: userId, adventure, stars: newVal }, { onConflict: 'user_id,adventure' })
  return newVal
}

export async function recordAttempt(userId, adventure, subMode, word, attempt) {
  await supabase.from('bumblebee_attempts').insert({
    user_id: userId,
    adventure,
    sub_mode: subMode,
    word,
    word_correct: attempt.wordCorrect ?? null,
    letter_results: attempt.letterResults ?? null,
    time_ms: attempt.timeMs ?? null,
  })
}

export async function getMastery(userId, adventure, subMode, word) {
  const { data } = await supabase
    .from('bumblebee_attempts')
    .select('word_correct, letter_results')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .eq('sub_mode', subMode)
    .eq('word', word)
    .order('created_at', { ascending: false })
    .limit(5)
  if (!data || !data.length) return -1
  let t = 0, ok = 0
  for (const a of data) {
    if (a.letter_results) for (const r of a.letter_results) { t++; if (r) ok++ }
    if (a.word_correct !== null) { t++; if (a.word_correct) ok++ }
  }
  return t ? Math.round((ok / t) * 100) : 0
}

export async function getLetterMastery(userId, adventure, subMode, word) {
  const { data } = await supabase
    .from('bumblebee_attempts')
    .select('letter_results')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .eq('sub_mode', subMode)
    .eq('word', word)
    .order('created_at', { ascending: false })
    .limit(5)
  if (!data?.length) return word.split('').map(() => -1)
  return word.split('').map((_, i) => {
    let ok = 0, t = 0
    for (const a of data) {
      if (a.letter_results?.[i] !== undefined) { t++; if (a.letter_results[i]) ok++ }
    }
    return t ? Math.round((ok / t) * 100) : -1
  })
}

export async function getWeakWords(userId, adventure, subMode, words) {
  const results = []
  for (const w of words) {
    const m = await getMastery(userId, adventure, subMode, w.word)
    if (m >= 0 && m < 60) results.push(w)
  }
  return results
}

export async function getWeakWordsGlobal(userId, adventure) {
  const { data } = await supabase
    .from('bumblebee_attempts')
    .select('word, word_correct, letter_results, time_ms, created_at')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .order('created_at', { ascending: false })
  if (!data?.length) return []
  const byWord = {}
  for (const a of data) {
    if (!byWord[a.word]) byWord[a.word] = []
    if (byWord[a.word].length < 8) byWord[a.word].push(a)
  }
  const result = []
  for (const [word, attempts] of Object.entries(byWord)) {
    let t = 0, ok = 0, totalTime = 0, timeCount = 0
    for (const a of attempts) {
      if (a.letter_results) for (const r of a.letter_results) { t++; if (r) ok++ }
      if (a.word_correct !== null) { t++; if (a.word_correct) ok++ }
      if (a.time_ms) { totalTime += a.time_ms; timeCount++ }
    }
    const mastery = t ? Math.round((ok / t) * 100) : -1
    const avgTime = timeCount ? totalTime / timeCount : 0
    if (mastery >= 0 && (mastery < 60 || avgTime > 10000)) {
      result.push({ word, mastery, avgTime })
    }
  }
  result.sort((a, b) => a.mastery - b.mastery)
  return result
}

export async function getBulkMastery(userId, adventure, subMode) {
  const { data } = await supabase
    .from('bumblebee_attempts')
    .select('word, word_correct, letter_results, created_at')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .eq('sub_mode', subMode)
    .order('created_at', { ascending: false })
  if (!data?.length) return {}
  const byWord = {}
  for (const a of data) {
    if (!byWord[a.word]) byWord[a.word] = []
    if (byWord[a.word].length < 5) byWord[a.word].push(a)
  }
  const result = {}
  for (const [word, attempts] of Object.entries(byWord)) {
    let t = 0, ok = 0
    for (const a of attempts) {
      if (a.letter_results) for (const r of a.letter_results) { t++; if (r) ok++ }
      if (a.word_correct !== null) { t++; if (a.word_correct) ok++ }
    }
    const mastery = t ? Math.round((ok / t) * 100) : 0
    const letterMastery = word.split('').map((_, i) => {
      let lok = 0, lt = 0
      for (const a of attempts) {
        if (a.letter_results?.[i] !== undefined) { lt++; if (a.letter_results[i]) lok++ }
      }
      return lt ? Math.round((lok / lt) * 100) : -1
    })
    result[word] = { mastery, letterMastery }
  }
  return result
}

export async function getWordStats(userId, adventure, subMode) {
  const { data } = await supabase
    .from('bumblebee_attempts')
    .select('word')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .eq('sub_mode', subMode)
  if (!data?.length) return { practiced: 0, mastered: 0, weak: 0 }
  const wordSet = new Set(data.map(r => r.word))
  let mastered = 0, weak = 0
  for (const word of wordSet) {
    const m = await getMastery(userId, adventure, subMode, word)
    if (m >= 80) mastered++
    else if (m >= 0 && m < 60) weak++
  }
  return { practiced: wordSet.size, mastered, weak }
}

export async function getAdventureStats(userId, adventure) {
  const { data } = await supabase
    .from('bumblebee_attempts')
    .select('word, sub_mode, word_correct, letter_results, created_at')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .order('created_at', { ascending: false })
  if (!data?.length) return { practiced: 0, mastered: 0, weak: 0 }
  const byKey = {}
  for (const a of data) {
    const k = `${a.word}|${a.sub_mode}`
    if (!byKey[k]) byKey[k] = []
    if (byKey[k].length < 5) byKey[k].push(a)
  }
  const bestByWord = {}
  for (const [k, attempts] of Object.entries(byKey)) {
    const word = k.split('|')[0]
    let t = 0, ok = 0
    for (const a of attempts) {
      if (a.letter_results) for (const r of a.letter_results) { t++; if (r) ok++ }
      if (a.word_correct !== null) { t++; if (a.word_correct) ok++ }
    }
    const m = t ? Math.round((ok / t) * 100) : 0
    if (bestByWord[word] === undefined || m > bestByWord[word]) bestByWord[word] = m
  }
  let mastered = 0, weak = 0
  for (const m of Object.values(bestByWord)) {
    if (m >= 80) mastered++
    else if (m < 60) weak++
  }
  return { practiced: Object.keys(bestByWord).length, mastered, weak }
}

export async function addFlower(userId, adventure, subMode) {
  const { data: existing } = await supabase
    .from('bumblebee_garden')
    .select('*')
    .eq('user_id', userId)
    .eq('adventure', adventure)
    .eq('sub_mode', subMode)
    .single()

  const flowers = (existing?.flowers || 0) + 1
  const bees = (existing?.bees || 0) + (flowers % 5 === 0 ? 1 : 0)

  await supabase.from('bumblebee_garden').upsert({
    user_id: userId, adventure, sub_mode: subMode, flowers, bees,
  }, { onConflict: 'user_id,adventure,sub_mode' })

  return { flowers, bees }
}

export async function getGarden(userId, adventure, subMode) {
  if (subMode) {
    const { data } = await supabase
      .from('bumblebee_garden')
      .select('flowers, bees')
      .eq('user_id', userId)
      .eq('adventure', adventure)
      .eq('sub_mode', subMode)
      .single()
    return data || { flowers: 0, bees: 0 }
  }
  const { data } = await supabase
    .from('bumblebee_garden')
    .select('flowers, bees')
    .eq('user_id', userId)
    .eq('adventure', adventure)
  let flowers = 0, bees = 0
  for (const r of (data || [])) { flowers += r.flowers; bees += r.bees }
  return { flowers, bees }
}

export async function resetProgress(userId) {
  await Promise.all([
    supabase.from('bumblebee_attempts').delete().eq('user_id', userId),
    supabase.from('bumblebee_stars').delete().eq('user_id', userId),
    supabase.from('bumblebee_garden').delete().eq('user_id', userId),
  ])
}

// Admin: gestión de palabras
export async function adminAddWord(adventure, word, emoji, category = 'words') {
  const { data: max } = await supabase
    .from('bumblebee_words')
    .select('sort_order')
    .eq('adventure', adventure)
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const order = (max?.sort_order || 0) + 1
  return supabase.from('bumblebee_words').insert({ adventure, word: word.toUpperCase(), emoji, sort_order: order, category })
}

export async function adminDeleteWord(adventure, word) {
  return supabase.from('bumblebee_words').delete().eq('adventure', adventure).eq('word', word)
}

export async function adminToggleWord(adventure, word, active) {
  return supabase.from('bumblebee_words').update({ active }).eq('adventure', adventure).eq('word', word)
}

export async function adminUpdateWord(adventure, oldWord, updates) {
  return supabase.from('bumblebee_words').update(updates).eq('adventure', adventure).eq('word', oldWord)
}

export async function adminBulkToggle(adventure, words, active) {
  return supabase.from('bumblebee_words').update({ active }).eq('adventure', adventure).in('word', words)
}

export async function adminSaveOrder(adventure, wordOrders) {
  for (const { word, sort_order } of wordOrders) {
    await supabase.from('bumblebee_words').update({ sort_order }).eq('adventure', adventure).eq('word', word)
  }
}

export async function adminCloneWord(fromAdventure, word) {
  const toAdventure = fromAdventure === 'spellingBee' ? 'bumblebee' : 'spellingBee'
  const { data: src } = await supabase
    .from('bumblebee_words')
    .select('*')
    .eq('adventure', fromAdventure)
    .eq('word', word)
    .single()
  if (!src) return { error: 'not found' }
  const { data: exists } = await supabase
    .from('bumblebee_words')
    .select('word')
    .eq('adventure', toAdventure)
    .eq('word', word)
    .single()
  if (exists) return { error: 'already exists' }
  const { data: max } = await supabase
    .from('bumblebee_words')
    .select('sort_order')
    .eq('adventure', toAdventure)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const order = (max?.sort_order || 0) + 1
  await supabase.from('bumblebee_words').insert({
    adventure: toAdventure, word: src.word, emoji: src.emoji,
    image_url: src.image_url, sort_order: order, active: true,
  })
  return { ok: true, to: toAdventure }
}

export async function adminUploadImage(file, word, adventure) {
  const ext = file.name.split('.').pop()
  const path = `words/${word.toLowerCase()}.${ext}`
  const { error } = await supabase.storage.from('bumblebee-images').upload(path, file, { upsert: true })
  if (error) return { error }
  const { data: { publicUrl } } = supabase.storage.from('bumblebee-images').getPublicUrl(path)
  const ts = `?t=${Date.now()}`
  const url = publicUrl + ts
  let q = supabase.from('bumblebee_words').update({ image_url: url }).eq('word', word)
  if (adventure) q = q.eq('adventure', adventure)
  await q
  return { url }
}
