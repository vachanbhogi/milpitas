import { useCallback, useRef, useState } from 'react'

export type VoiceState = 'quiet' | 'voice'
export type SoundClass = 'quiet' | 'voice' | 'hissy' | 'open' | 'pop'

export interface LiveVoiceResult {
  voiceState: VoiceState
  soundClass: SoundClass
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

export function useLiveVoiceAnalyzer() {
  const [result, setResult] = useState<LiveVoiceResult>({
    voiceState: 'quiet',
    soundClass: 'quiet',
    confidence: 0,
    energy: 0,
  })

  const lastResultRef = useRef<LiveVoiceResult>(result)

  const analyze = useCallback((samples: Float32Array): LiveVoiceResult => {
    const energy = computeRMS(samples)
    const zcr = computeZCR(samples)

    let next: LiveVoiceResult

    if (energy < 0.018) {
      next = {
        voiceState: 'quiet',
        soundClass: 'quiet',
        confidence: 0.9,
        energy,
      }
    } else if (zcr > 0.24 && energy < 0.22) {
      next = {
        voiceState: 'voice',
        soundClass: 'hissy',
        confidence: Math.min(zcr * 2.2, 0.92),
        energy,
      }
    } else if (energy > 0.18 && zcr < 0.14) {
      next = {
        voiceState: 'voice',
        soundClass: 'pop',
        confidence: Math.min(energy * 3, 0.88),
        energy,
      }
    } else if (zcr < 0.16) {
      next = {
        voiceState: 'voice',
        soundClass: 'open',
        confidence: Math.min((1 - zcr) * 0.9, 0.86),
        energy,
      }
    } else {
      next = {
        voiceState: 'voice',
        soundClass: 'voice',
        confidence: 0.58,
        energy,
      }
    }

    lastResultRef.current = next
    setResult(next)
    return next
  }, [])

  const reset = useCallback(() => {
    const next: LiveVoiceResult = {
      voiceState: 'quiet',
      soundClass: 'quiet',
      confidence: 0,
      energy: 0,
    }
    lastResultRef.current = next
    setResult(next)
  }, [])

  return {
    ...result,
    analyze,
    reset,
  }
}
