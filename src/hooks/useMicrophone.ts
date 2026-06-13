import { useRef, useState, useCallback } from 'react'

export interface MicrophoneState {
  isListening: boolean
  isSupported: boolean
  error: string | null
}

export function useMicrophone() {
  const [state, setState] = useState<MicrophoneState>({
    isListening: false,
    isSupported: typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof AudioContext !== 'undefined',
    error: null,
  })

  const contextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const utteranceResolveRef = useRef<((audio: Float32Array) => void) | null>(null)
  const onChunkRef = useRef<((chunk: Float32Array) => void) | null>(null)

  const setOnChunk = useCallback((cb: ((chunk: Float32Array) => void) | null) => {
    onChunkRef.current = cb
  }, [])

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }))

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const sampleRate = 16000
      const audioContext = new AudioContext({ sampleRate })
      contextRef.current = audioContext

      await audioContext.audioWorklet.addModule('/audioWorklet.js')

      const source = audioContext.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioContext, 'phoneme-capture')
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event) => {
        const { type, audio } = event.data
        if (type === 'chunk' && onChunkRef.current && audio) {
          onChunkRef.current(audio)
        } else if (type === 'utterance' && utteranceResolveRef.current && audio) {
          utteranceResolveRef.current(audio)
          utteranceResolveRef.current = null
        }
      }

      source.connect(workletNode)
      setState(prev => ({ ...prev, isListening: true }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone error'
      setState(prev => ({ ...prev, error: message, isListening: false }))
      return false
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Float32Array | null> => {
    const worklet = workletNodeRef.current
    if (!worklet) return null

    return new Promise((resolve) => {
      utteranceResolveRef.current = (audio) => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        contextRef.current?.close()

        streamRef.current = null
        contextRef.current = null
        workletNodeRef.current = null

        setState(prev => ({ ...prev, isListening: false }))
        resolve(audio)
      }
      worklet.port.postMessage({ command: 'stop' })
    })
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    setOnChunk,
  }
}
