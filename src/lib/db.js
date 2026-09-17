import { supabase } from './supabase'

export async function fetchWords(adventure, includeInactive = false) {
  let q = supabase
    .from('bumblebee_words')
    .select('*')
    .eq('adventure', adventure)
    .order('sort_order')
  if (!includeInactive) q = q.eq('active', true)
  const { data } = await q
  return (data || []).map(w => ({ word: w.word, emoji: w.emoji, image_url: w.image_url, active: w.active }))
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
    .select('word, sub_mode')
    .eq('user_id', userId)
    .eq('adventure', adventure)
  if (!data?.length) return { practiced: 0, mastered: 0, weak: 0 }
  const wordSet = new Set(data.map(r => r.word))
  let mastered = 0, weak = 0
  const subModes = [...new Set(data.map(r => r.sub_mode))]
  for (const word of wordSet) {
    let best = -1
    for (const sm of subModes) {
      const m = await getMastery(userId, adventure, sm, word)
      if (m > best) best = m
    }
    if (best >= 80) mastered++
    else if (best >= 0 && best < 60) weak++
  }
  return { practiced: wordSet.size, mastered, weak }
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

// Admin: gestión de palabras
export async function adminAddWord(adventure, word, emoji) {
  const { data: max } = await supabase
    .from('bumblebee_words')
    .select('sort_order')
    .eq('adventure', adventure)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const order = (max?.sort_order || 0) + 1
  return supabase.from('bumblebee_words').insert({ adventure, word: word.toUpperCase(), emoji, sort_order: order })
}

export async function adminDeleteWord(adventure, word) {
  return supabase.from('bumblebee_words').delete().eq('adventure', adventure).eq('word', word)
}

export async function adminToggleWord(adventure, word, active) {
  return supabase.from('bumblebee_words').update({ active }).eq('adventure', adventure).eq('word', word)
}

export async function adminUploadImage(file, word) {
  const ext = file.name.split('.').pop()
  const path = `words/${word.toLowerCase()}.${ext}`
  const { error } = await supabase.storage.from('bumblebee-images').upload(path, file, { upsert: true })
  if (error) return { error }
  const { data: { publicUrl } } = supabase.storage.from('bumblebee-images').getPublicUrl(path)
  await supabase.from('bumblebee_words').update({ image_url: publicUrl }).eq('word', word)
  return { url: publicUrl }
}
