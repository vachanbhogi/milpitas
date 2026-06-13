import { useEffect, useMemo, useState } from 'react';
import { useMicrophone } from './hooks/useMicrophone';
import { useLiveVoiceAnalyzer } from './hooks/useLiveVoiceAnalyzer';
import './App.css';

type LessonKind = 'sound' | 'word';

interface Lesson {
  id: string;
  kind: LessonKind;
  targetText: string;
  displayText: string;
  phonicsParts: string[];
  successMatches: string[];
  coachPrompt: string;
  retryPrompt: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'sound-s',
    kind: 'sound',
    targetText: 's',
    displayText: 'S',
    phonicsParts: ['ssss'],
    successMatches: ['s', 'ess', 'sss', 'say', 'sea', 'see'],
    coachPrompt: 'Teeth close. Air keeps sliding out.',
    retryPrompt: 'Try a long snake sound: sssss.',
  },
  {
    id: 'sound-m',
    kind: 'sound',
    targetText: 'm',
    displayText: 'M',
    phonicsParts: ['mmmm'],
    successMatches: ['m', 'em', 'mmm', 'mom', 'hum'],
    coachPrompt: 'Lips together. Let the sound buzz.',
    retryPrompt: 'Close your lips and hum: mmmm.',
  },
  {
    id: 'sound-a',
    kind: 'sound',
    targetText: 'a',
    displayText: 'A',
    phonicsParts: ['aaa'],
    successMatches: ['a', 'ah', 'aa', 'at'],
    coachPrompt: 'Open your mouth. Short sound: aaa.',
    retryPrompt: 'Open wide and say aaa.',
  },
  {
    id: 'sound-t',
    kind: 'sound',
    targetText: 't',
    displayText: 'T',
    phonicsParts: ['t'],
    successMatches: ['t', 'tea', 'tee', 'to'],
    coachPrompt: 'Tongue taps up top. Make it quick.',
    retryPrompt: 'Tap the sound: t.',
  },
  {
    id: 'sound-p',
    kind: 'sound',
    targetText: 'p',
    displayText: 'P',
    phonicsParts: ['p'],
    successMatches: ['p', 'pea', 'pee', 'pa'],
    coachPrompt: 'Lips pop open. Tiny burst of air.',
    retryPrompt: 'Pop your lips: p.',
  },
  {
    id: 'word-sat',
    kind: 'word',
    targetText: 'sat',
    displayText: 'SAT',
    phonicsParts: ['s', 'a', 't'],
    successMatches: ['sat'],
    coachPrompt: 'Slide the sounds together: s-a-t.',
    retryPrompt: 'Start with ssss, then aaa, then t.',
  },
  {
    id: 'word-mat',
    kind: 'word',
    targetText: 'mat',
    displayText: 'MAT',
    phonicsParts: ['m', 'a', 't'],
    successMatches: ['mat'],
    coachPrompt: 'Buzz, open, tap: m-a-t.',
    retryPrompt: 'Try mmmm, aaa, t.',
  },
  {
    id: 'word-pat',
    kind: 'word',
    targetText: 'pat',
    displayText: 'PAT',
    phonicsParts: ['p', 'a', 't'],
    successMatches: ['pat'],
    coachPrompt: 'Pop, open, tap: p-a-t.',
    retryPrompt: 'Try p, aaa, t.',
  },
];

const DEMO_ENABLED = true;

function playSoundEffect(type: 'success' | 'fail') {
  try {
    const AudioContextCtor = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      // Arpeggio for success / star award
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Gentle soft fall for mistake
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(146.83, ctx.currentTime + 0.25); // D3
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Fail silently if AudioContext is blocked
  }
}

type GameStatus = 'idle' | 'recording' | 'transcribing' | 'success' | 'fail' | 'error';

function App() {
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [heardText, setHeardText] = useState<string>('');
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isServerConnected, setIsServerConnected] = useState<boolean | null>(null);

  const { isListening, error: micError, startRecording, stopRecording, setOnChunk } = useMicrophone();
  const { soundClass, energy, analyze, reset } = useLiveVoiceAnalyzer();

  const lesson = LESSONS[lessonIndex];
  const progressLabel = `${lessonIndex + 1}/${LESSONS.length}`;

  useEffect(() => {
    if (isListening) {
      setOnChunk((chunk) => {
        analyze(chunk);
      });
    } else {
      setOnChunk(null);
      reset();
    }
  }, [isListening, setOnChunk, analyze, reset]);

  const checkServerConnection = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1000);
      const response = await fetch('http://127.0.0.1:8080/inference', {
        method: 'OPTIONS',
        signal: controller.signal
      });
      clearTimeout(id);
      if (response.ok || response.status === 400 || response.status === 405 || response.status === 404) {
        setIsServerConnected(true);
      } else {
        setIsServerConnected(false);
      }
    } catch {
      setIsServerConnected(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkServerConnection().catch(() => {});
    }, 0);
    const interval = setInterval(() => {
      checkServerConnection().catch(() => {});
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleStartRecording = async () => {
    setErrorMsg('');
    setHeardText('');
    setGameStatus('recording');
    await startRecording();
  };

  const showCorrectDemo = () => {
    if (isListening) {
      stopRecording().catch(() => {});
    }
    setHeardText(lesson.targetText);
    setErrorMsg('');
    setScore(prev => prev + 1);
    setGameStatus('success');
    playSoundEffect('success');
  };

  const showIncorrectDemo = () => {
    if (isListening) {
      stopRecording().catch(() => {});
    }
    const fakeMiss = lesson.kind === 'sound' ? 'buh' : 'bat';
    setHeardText(fakeMiss);
    setErrorMsg(`I heard "${fakeMiss}". ${lesson.retryPrompt}`);
    setGameStatus('fail');
    playSoundEffect('fail');
  };

  const handleStopRecording = async () => {
    setGameStatus('transcribing');
    const samples = await stopRecording();
    
    if (micError) {
      setGameStatus('error');
      setErrorMsg('Microphone error: ' + micError);
      playSoundEffect('fail');
      return;
    }

    if (!samples || samples.length === 0) {
      setGameStatus('error');
      setErrorMsg("I couldn't hear you. Try once more.");
      playSoundEffect('fail');
      return;
    }

    if (samples.length < 4000) {
      setGameStatus('fail');
      setErrorMsg('That was very quick. Hold the button a little longer.');
      playSoundEffect('fail');
      return;
    }

    if (DEMO_ENABLED || !isServerConnected) {
      showIncorrectDemo();
      return;
    }

    try {
      const { encodeFloat32ArrayToWav } = await import('./audioUtils');
      const wavArrayBuffer = encodeFloat32ArrayToWav(samples);
      const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

      const formData = new FormData();
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('response_format', 'json');

      const response = await fetch('http://127.0.0.1:8080/inference', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Server returned error status ' + response.status);
      }

      const data = await response.json();
      const transcript = (data.text || data.result || '').trim();
      setHeardText(transcript);

      const cleanTranscript = transcript.toLowerCase().replace(/[^a-z]/g, '');
      const success = lesson.successMatches.some(match => {
        const cleanMatch = match.toLowerCase().replace(/[^a-z]/g, '');
        if (lesson.kind === 'sound') {
          return cleanTranscript.includes(cleanMatch);
        }
        return cleanTranscript === cleanMatch || cleanTranscript.includes(cleanMatch);
      });

      if (success) {
        setScore(prev => prev + 1);
        setGameStatus('success');
        playSoundEffect('success');
      } else {
        setGameStatus('fail');
        playSoundEffect('fail');
        setErrorMsg(transcript ? `I heard "${transcript}". ${lesson.retryPrompt}` : lesson.retryPrompt);
      }
    } catch {
      setGameStatus('error');
      setErrorMsg('Cannot reach the local Whisper server.');
      playSoundEffect('fail');
    }
  };

  const handleNextWord = () => {
    setGameStatus('idle');
    setErrorMsg('');
    setHeardText('');
    setLessonIndex(prev => (prev + 1) % LESSONS.length);
  };

  const liveLabel = useMemo(() => {
    if (!isListening) return 'ready';
    switch (soundClass) {
      case 'quiet': return 'quiet';
      case 'hissy': return 'hissy sound';
      case 'open': return 'open sound';
      case 'pop': return 'pop sound';
      default: return 'voice';
    }
  }, [isListening, soundClass]);

  const feedbackText = useMemo(() => {
    if (gameStatus === 'recording') return soundClass === 'quiet' ? 'Start your sound.' : 'I hear you.';
    if (gameStatus === 'transcribing') return 'Checking...';
    if (gameStatus === 'success') return 'Yes. Nice sound.';
    if (gameStatus === 'fail' || gameStatus === 'error') return errorMsg;
    return lesson.coachPrompt;
  }, [errorMsg, gameStatus, lesson.coachPrompt, soundClass]);

  const meterScale = Math.min(Math.max(energy * 5, 0.04), 1);

  return (
    <div className="shell">
      <main className="lesson-surface" aria-live="polite">
        <header className="topline">
          <div>
            <p className="eyebrow">{lesson.kind}</p>
            <p className="progress">{progressLabel}</p>
          </div>
          <div className="score" aria-label={`${score} correct`}>
            {score}
          </div>
        </header>

        <section className="target-panel">
          <div className="target-label">Say</div>
          <h1>{lesson.displayText}</h1>
          <div className="phonics-row" aria-label="phonics parts">
            {lesson.phonicsParts.map(part => (
              <span key={part}>{part}</span>
            ))}
          </div>
        </section>

        <section className={`live-panel ${isListening ? 'is-listening' : ''}`}>
          <div className="live-copy">
            <span className="live-dot" />
            <span>{liveLabel}</span>
          </div>
          <div className="meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${meterScale})` }} />
          </div>
          <p>{feedbackText}</p>
        </section>

        <div className="controls">
          {gameStatus !== 'recording' && gameStatus !== 'transcribing' && (
            <button className="primary-action" type="button" onClick={handleStartRecording}>
              Press and Say
            </button>
          )}

          {gameStatus === 'recording' && (
            <button className="primary-action stop-action" type="button" onClick={handleStopRecording}>
              Stop
            </button>
          )}

          {gameStatus === 'transcribing' && (
            <button className="primary-action" type="button" disabled>
              Checking
            </button>
          )}

          {(gameStatus === 'success' || gameStatus === 'fail' || gameStatus === 'error') && (
            <button className="secondary-action" type="button" onClick={handleNextWord}>
              Next
            </button>
          )}
        </div>

        {DEMO_ENABLED && (
          <div className="demo-controls" aria-label="demo controls">
            <button type="button" onClick={showIncorrectDemo}>
              Demo wrong
            </button>
            <button type="button" onClick={showCorrectDemo}>
              Demo right
            </button>
          </div>
        )}

        {micError && <p className="system-note">Microphone: {micError}</p>}
      </main>

      <footer className="parent-panel">
        <button className="debug-toggle" type="button" onClick={() => setShowDebug(!showDebug)}>
          Parent/dev: demo mode on
        </button>

        {showDebug && (
          <div className="debug-card">
            <p>
              Demo scoring: <strong>on</strong>. Use <code>Demo wrong</code> and <code>Demo right</code>.
            </p>
            <p>
              Local Whisper server: <strong>{isServerConnected ? 'connected' : 'offline'}</strong> at <code>127.0.0.1:8080</code>
            </p>
            {heardText && (
              <p>
                Last transcript: <code>{heardText}</code>
              </p>
            )}
            <p>
              Live analyzer: <code>{soundClass}</code>
            </p>
            {!isServerConnected && !DEMO_ENABLED && (
              <p>Run <code>bun run whisper:server</code> after setting up <code>whisper.cpp</code>.</p>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
