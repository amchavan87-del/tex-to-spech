import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Download, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  base64Audio: string | null;
  speed: number;
  pitch: number;
  onEnded?: () => void;
}

// Utility to decode base64
const decodeBase64 = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio, speed, pitch, onEnded }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new Ctx();
    gainNodeRef.current = audioContextRef.current.createGain();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 64;
    
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Load Audio Data
  useEffect(() => {
    if (!base64Audio || !audioContextRef.current) return;

    const loadAudio = async () => {
      try {
        const arrayBuffer = decodeBase64(base64Audio);
        const decodedBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedBuffer;
        setDuration(decodedBuffer.duration);
        setProgress(0);
        pauseTimeRef.current = 0;
        setIsPlaying(false);
        drawVisualizer(); // Initial draw
      } catch (e) {
        console.error("Error decoding audio", e);
      }
    };

    loadAudio();
  }, [base64Audio]);

  // Update live parameters
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = speed;
      // Detune is in cents. 100 cents = 1 semitone.
      // Mapping our pitch (-10 to 10) to roughly -1200 to 1200 cents (1 octave)
      sourceNodeRef.current.detune.value = pitch * 100;
    }
  }, [speed, pitch]);

  useEffect(() => {
    if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying && progress === 0) {
         // Clear if stopped
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         // Draw a static line
         ctx.beginPath();
         ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.stroke();
         return;
      }
      
      analyserRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Gradient color
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#7000ff');
        gradient.addColorStop(1, '#00f0ff');
        
        ctx.fillStyle = gradient;
        // Rounded bars logic is complex in canvas, simple rect for perf
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };
    draw();
  };

  const updateProgress = () => {
    if (!audioContextRef.current || !startTimeRef.current) return;
    // Calculate elapsed time taking speed into account (approximation for UI)
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    const adjustedElapsed = elapsed * speed; // Rough estimate for slider
    // Better: use exact time if not looped
    
    // For simple playback, just track elapsed real time vs duration / speed
    const currentProg = pauseTimeRef.current + (elapsed * speed);
    
    if (currentProg >= duration) {
        setIsPlaying(false);
        setProgress(duration);
        if (onEnded) onEnded();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
        setProgress(currentProg);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = async () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      // Pause
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      // Calculate pause time
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      pauseTimeRef.current += elapsed * speed; 
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      // Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = speed;
      source.detune.value = pitch * 100;
      
      source.connect(gainNodeRef.current!); // gain connected to analyser
      
      // Schedule start
      // We need to start from where we paused. 
      // note: offset is in original buffer time, not wall clock.
      const offset = pauseTimeRef.current;
      
      source.start(0, offset);
      startTimeRef.current = audioContextRef.current.currentTime;
      sourceNodeRef.current = source;
      
      setIsPlaying(true);
      
      // Start loops
      drawVisualizer();
      updateProgress();
      
      source.onended = () => {
        // Handled by updateProgress for smoother UI sync usually, 
        // but this is a fallback.
      };
    }
  };

  const handleDownload = () => {
    if (!base64Audio) return;
    const link = document.createElement('a');
    link.href = `data:audio/mp3;base64,${base64Audio}`;
    link.download = `neonvoice-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
    }
    pauseTimeRef.current = 0;
    setProgress(0);
    setIsPlaying(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    // Redraw static
    setTimeout(() => {
        const canvas = canvasRef.current;
        if(canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0,0, canvas.width, canvas.height);
            ctx?.beginPath();
            ctx!.strokeStyle = 'rgba(0, 240, 255, 0.3)';
            ctx?.moveTo(0, canvas.height / 2);
            ctx?.lineTo(canvas.width, canvas.height / 2);
            ctx?.stroke();
        }
    }, 100);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl w-full flex flex-col gap-4">
      {/* Waveform Canvas */}
      <div className="h-24 w-full bg-black/20 rounded-xl overflow-hidden relative flex items-center justify-center">
        <canvas 
            ref={canvasRef} 
            width={600} 
            height={96} 
            className="w-full h-full"
        />
        {!base64Audio && <span className="absolute text-gray-500 text-sm">Waiting for audio generation...</span>}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <button 
                onClick={handleReset}
                className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                disabled={!base64Audio}
            >
                <RotateCcw size={20} />
            </button>
            <button 
                onClick={togglePlay}
                className={`p-4 rounded-full transition-all shadow-lg ${
                    base64Audio 
                    ? 'bg-gradient-to-r from-secondary to-primary text-white hover:scale-105 shadow-primary/25' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!base64Audio}
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
        </div>

        {/* Progress Bar (Visual Only for now) */}
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-100 ease-linear"
                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-primary/80 min-w-[80px] justify-end">
            {Math.floor(progress)}s / {Math.floor(duration)}s
        </div>

        <button 
            onClick={handleDownload}
            className="p-3 rounded-full hover:bg-white/10 text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!base64Audio}
        >
            <Download size={20} />
        </button>
      </div>
      
      {/* Volume Slider */}
      <div className="flex items-center gap-3 px-2">
          <Volume2 size={16} className="text-gray-400" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
      </div>
    </div>
  );
};