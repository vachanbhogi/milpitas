import { useState, useEffect } from 'react';
import { useMicrophone } from './hooks/useMicrophone';
import { usePhonemeSprinter } from './hooks/usePhonemeSprinter';
import { encodeFloat32ArrayToWav } from './audioUtils';
import './App.css';

interface PhonicsWord {
  word: string;
  emoji: string;
  phonics: string;
  tip: string;
}

const PHONICS_WORDS: PhonicsWord[] = [
  { word: 'Car', emoji: '🚗', phonics: 'C - AR', tip: "Make a 'Kuh' sound, then open wide for 'Arr'!" },
  { word: 'Cat', emoji: '🐱', phonics: 'C - A - T', tip: "Say 'Kuh' like Cookie, then 'Ah', and end with a 'Tuh'!" },
  { word: 'Dog', emoji: '🐶', phonics: 'D - O - G', tip: "Start with 'Duh', then 'Ah', and end with 'Guh' like Go!" },
  { word: 'Sun', emoji: '☀️', phonics: 'S - U - N', tip: "Hiss like a snake 'Sss', then say 'Uh' and end with 'Nnn'!" },
  { word: 'Tree', emoji: '🌳', phonics: 'T - R - EE', tip: "Say 'Trrr', then stretch your smile for 'Eee'!" },
  { word: 'Book', emoji: '📖', phonics: 'B - OO - K', tip: "Start with 'Buh', then make your lips round for 'Ooh', and end with 'Kuh'!" }
];

// Browser Audio Synthesizer for Game Sound Effects (Zero external asset dependencies)
function playSoundEffect(type: 'success' | 'fail') {
  try {
    const ctx = new (window.AudioContext || (window as Record<string, typeof AudioContext>).webkitAudioContext)();
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
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [heardText, setHeardText] = useState<string>('');
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isServerConnected, setIsServerConnected] = useState<boolean | null>(null);

  const { isListening, error: micError, startRecording, stopRecording, setOnChunk } = useMicrophone();
  const { currentPhoneme, classify } = usePhonemeSprinter();

  const currentWordObj = PHONICS_WORDS[wordIndex];

  // Feed real-time microphone chunks into the phoneme classifier for visual mouth/wave reactions
  useEffect(() => {
    if (isListening) {
      setOnChunk((chunk) => {
        classify(chunk);
      });
    } else {
      setOnChunk(null);
    }
  }, [isListening, setOnChunk, classify]);

  // Check whisper.cpp connection in the background
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
      setErrorMsg("I couldn't hear you! Try again.");
      playSoundEffect('fail');
      return;
    }

    try {
      // Encode standard 16kHz mono Float32Array to 16-bit PCM WAV
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

      // Clean characters to compare word matches
      const cleanTranscript = transcript.toLowerCase().replace(/[^a-z]/g, '');
      const cleanTarget = currentWordObj.word.toLowerCase().replace(/[^a-z]/g, '');

      // Check for fuzzy word matches (direct inclusions or overlaps)
      if (cleanTranscript.includes(cleanTarget) || (cleanTarget.includes(cleanTranscript) && cleanTranscript.length >= 2)) {
        setScore(prev => prev + 1);
        setGameStatus('success');
        playSoundEffect('success');
      } else {
        setGameStatus('fail');
        playSoundEffect('fail');
        
        // Contextual smart feedback
        if (cleanTranscript === 'far' && cleanTarget === 'car') {
          setErrorMsg('You said "Far"! Make a "Kuh" sound at the start like in Cookie.');
        } else if (cleanTranscript === 'cat' && cleanTarget === 'car') {
          setErrorMsg('You said "Cat"! Try to make a round "Arr" sound at the end.');
        } else if (cleanTranscript === 'dog' && cleanTarget === 'sun') {
          setErrorMsg('You said "Dog"! Hiss like a snake "Sss" for Sun.');
        } else if (transcript) {
          setErrorMsg(`I heard "${transcript}". Let's practice the sounds!`);
        } else {
          setErrorMsg("I heard another sound. Let's try once more!");
        }
      }
    } catch {
      setGameStatus('error');
      setErrorMsg('Cannot reach the Phonics backend. Make sure the local server is running!');
      playSoundEffect('fail');
    }
  };

  const handleNextWord = () => {
    setGameStatus('idle');
    setErrorMsg('');
    setHeardText('');
    setWordIndex(prev => (prev + 1) % PHONICS_WORDS.length);
  };

  // Map phoneme types to emoji mouth shapes to delight a 5 year old in real-time
  const getPhonemeMouth = () => {
    if (!isListening) return '⭐';
    switch (currentPhoneme) {
      case 'vocalic': return '😮'; // Vowels open wide
      case 'fricative': return '😬'; // Hissing / sss
      case 'plosive': return '😀'; // Pops
      default: return '😐'; // Silence
    }
  };

  return (
    <div className="app-container">
      {/* Kid-Friendly Game Dashboard */}
      <main className="glass-card game-dashboard">
        {/* Star Points Score Counter */}
        <div className="score-container">
          <span className="star-icon">⭐</span>
          <span className="score-value">{score}</span>
        </div>

        {/* Word Display Card */}
        <section className="word-card">
          <div className="emoji-display">{currentWordObj.emoji}</div>
          <h2 className="target-word">{currentWordObj.word}</h2>
          <div className="phonics-spelling">{currentWordObj.phonics}</div>
        </section>

        {/* Mascot Face & Reaction */}
        <div className="mascot-container">
          <div className={`mascot-avatar ${gameStatus}`}>
            {gameStatus === 'idle' && '⭐'}
            {gameStatus === 'recording' && getPhonemeMouth()}
            {gameStatus === 'transcribing' && '🤔'}
            {gameStatus === 'success' && '🎉'}
            {gameStatus === 'fail' && '🥺'}
            {gameStatus === 'error' && '🩹'}
          </div>
          <div className="mascot-text">
            {gameStatus === 'idle' && `Can you say "${currentWordObj.word}"?`}
            {gameStatus === 'recording' && 'Mascot is listening... Keep speaking!'}
            {gameStatus === 'transcribing' && 'Thinking...'}
            {gameStatus === 'success' && 'Super job! You got it!'}
            {gameStatus === 'fail' && (errorMsg || 'Let\'s try again!')}
            {gameStatus === 'error' && errorMsg}
          </div>
        </div>

        {/* Visualizer Wave when recording */}
        {gameStatus === 'recording' && (
          <div className="visualizer-container recording">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        )}

        {/* Simple Controls */}
        <div className="control-area">
          {gameStatus === 'idle' && (
            <button className="btn btn-record" onClick={handleStartRecording}>
              🎤 Press & Say
            </button>
          )}

          {gameStatus === 'recording' && (
            <button className="btn btn-stop" onClick={handleStopRecording}>
              ⏹️ Stop & Check
            </button>
          )}

          {(gameStatus === 'success' || gameStatus === 'fail' || gameStatus === 'error') && (
            <div className="action-buttons">
              {gameStatus !== 'success' && (
                <button className="btn btn-retry" onClick={handleStartRecording}>
                  🔄 Try Again
                </button>
              )}
              <button className="btn btn-next" onClick={handleNextWord}>
                Next Word ➡️
              </button>
            </div>
          )}
        </div>

        {/* Tip Box for Phonics Practice */}
        {(gameStatus === 'idle' || gameStatus === 'fail') && (
          <div className="tip-box">
            💡 <strong>Phonics Tip:</strong> {currentWordObj.tip}
          </div>
        )}
      </main>

      {/* Subtle Developer Debug Toggle */}
      <footer className="dev-footer">
        <button className="debug-toggle" onClick={() => setShowDebug(!showDebug)}>
          ⚙️ Developer Tools ({isServerConnected ? 'Backend Connected' : 'Backend Offline'})
        </button>

        {showDebug && (
          <div className="glass-card debug-card">
            <h3>System Status</h3>
            <p>
              Whisper C++ Server: <strong>{isServerConnected ? 'CONNECTED' : 'OFFLINE'}</strong> on <code>localhost:8080</code>
            </p>
            {heardText && (
              <p>
                Raw Whisper Transcription: <code>"{heardText}"</code>
              </p>
            )}
            <p>
              Real-time Phoneme Class: <code>{currentPhoneme}</code>
            </p>
            {!isServerConnected && (
              <div className="dev-instructions">
                <p>Run these commands in separate terminals to start the local backend:</p>
                <code>bun run whisper:setup</code>
                <br />
                <code>bun run whisper:server</code>
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
