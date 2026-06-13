import { useRef, useCallback, useState } from 'react'

export type PhonemeType = 'vocalic' | 'fricative' | 'plosive' | 'silence'

export interface PhonemeResult {
  phonemeType: PhonemeType
  confidence: number
  energy: number
}

function computeRMS(samples: Float32Array): number {
  let sumSq = 0
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i]
  }
  return Math.sqrt(sumSq / samples.length)
}

function computeZCR(samples: Float32Array): number {
  let crossings = 0
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i] >= 0 && samples[i - 1] < 0)
        || (samples[i] < 0 && samples[i - 1] >= 0)) {
      crossings++
    }
  }
  return crossings / samples.length
}

export function usePhonemeSprinter() {
  const [currentPhoneme, setCurrentPhoneme] = useState<PhonemeType>('silence')
  const lastResultRef = useRef<PhonemeResult>({
    phonemeType: 'silence',
    confidence: 0,
    energy: 0,
  })

  const classify = useCallback((samples: Float32Array): PhonemeResult => {
    const rms = computeRMS(samples)
    const zcr = computeZCR(samples)

    if (rms < 0.02) {
      const result: PhonemeResult = {
        phonemeType: 'silence',
        confidence: 0.9,
        energy: rms,
      }
      lastResultRef.current = result
      setCurrentPhoneme('silence')
      return result
    }

    let phonemeType: PhonemeType
    let confidence: number

    if (zcr > 0.25 && rms < 0.2) {
      phonemeType = 'fricative'
      confidence = Math.min(zcr * 2, 0.9)
    } else if (rms > 0.18 && zcr < 0.15) {
      phonemeType = 'plosive'
      confidence = Math.min(rms * 3, 0.85)
    } else if (zcr < 0.15) {
      phonemeType = 'vocalic'
      confidence = Math.min((1 - zcr) * 1.5, 0.8)
    } else {
      phonemeType = 'vocalic'
      confidence = 0.5
    }

    const result: PhonemeResult = { phonemeType, confidence, energy: rms }
    lastResultRef.current = result
    setCurrentPhoneme(phonemeType)
    return result
  }, [])

  return { currentPhoneme, classify }
}
