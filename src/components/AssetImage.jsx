import { useState } from 'react'
import { getWordImageUrl } from '../data/assets'

export default function AssetImage({ word, emoji, className = '' }) {
  const [failed, setFailed] = useState(false)
  const url = getWordImageUrl(word)

  if (!url || failed) {
    return <span className={className}>{emoji}</span>
  }

  return (
    <img
      src={url}
      alt={word}
      className={`object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
