import { useState, useCallback } from 'react'

const STAMP_KEY = 'docflow:stamp'
const STAMP_WIDTH_KEY = 'docflow:stamp:width'
const STAMP_HEIGHT_KEY = 'docflow:stamp:height'
const DEFAULT_STAMP_WIDTH = 140
const DEFAULT_STAMP_HEIGHT = 80

function readStorage(key) {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}

function writeStorage(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // Ignore storage write errors (private mode/quota/security restrictions).
  }
}

function readDimension(key, fallback) {
  const raw = readStorage(key)
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function clampDimension(value, fallback) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, 2000)
}

export function useSettings() {
  const [stampImage, setStampState] = useState(() => readStorage(STAMP_KEY))
  const [stampWidth, setStampWidthState] = useState(() => readDimension(STAMP_WIDTH_KEY, DEFAULT_STAMP_WIDTH))
  const [stampHeight, setStampHeightState] = useState(() => readDimension(STAMP_HEIGHT_KEY, DEFAULT_STAMP_HEIGHT))

  const setStampImage = useCallback((base64) => {
    writeStorage(STAMP_KEY, base64)
    setStampState(base64)
  }, [])

  const setStampWidth = useCallback((value) => {
    const normalized = clampDimension(value, DEFAULT_STAMP_WIDTH)
    writeStorage(STAMP_WIDTH_KEY, String(normalized))
    setStampWidthState(normalized)
  }, [])

  const setStampHeight = useCallback((value) => {
    const normalized = clampDimension(value, DEFAULT_STAMP_HEIGHT)
    writeStorage(STAMP_HEIGHT_KEY, String(normalized))
    setStampHeightState(normalized)
  }, [])

  return {
    stampImage,
    stampWidth,
    stampHeight,
    setStampImage,
    setStampWidth,
    setStampHeight,
  }
}
